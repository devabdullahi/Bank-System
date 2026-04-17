import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import CcxtFeed from './feeds/ccxtFeed.js';
import YahooFeed from './feeds/yahooFeed.js';
import { discoverStocks } from './feeds/stockScreener.js';
import RSIOversoldStrategy from './strategies/rsiOversold.js';
import EMACrossoverStrategy from './strategies/emaCrossover.js';
import MACDSignalStrategy from './strategies/macdSignal.js';
import LoggerCallout from './callouts/logger.js';
import { scoreProfitability } from './utils/profitFilter.js';
import { startWebServer, updateSignals, updateScanStatus } from './web/server.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, '..', 'config', 'default.json'), 'utf-8'));

// --- Config from .env ---
const cryptoSymbols = (process.env.CRYPTO_SYMBOLS || '').split(',').map(s => s.trim()).filter(Boolean);
const extraStocks = (process.env.STOCK_SYMBOLS || '').split(',').map(s => s.trim()).filter(Boolean);
const cryptoTimeframe = process.env.CRYPTO_TIMEFRAME || '1h';
const stockTimeframe = process.env.STOCK_TIMEFRAME || '1d';
const cycleInterval = (parseInt(process.env.CYCLE_INTERVAL, 10) || 60) * 1000;
const minProfitScore = parseInt(process.env.MIN_PROFIT_SCORE, 10) || 60;
const port = parseInt(process.env.PORT, 10) || 3000;

// --- Initialize feeds ---
const cryptoFeed = cryptoSymbols.length > 0 ? new CcxtFeed({ exchangeId: 'coinbase' }) : null;
const stockFeed = new YahooFeed();

// --- Initialize strategies ---
const strategies = [
  new RSIOversoldStrategy(config.rsiOversold),
  new EMACrossoverStrategy(config.emaCrossover),
  new MACDSignalStrategy(config.macdSignal),
];

// --- Initialize callouts ---
const callouts = [
  new LoggerCallout(),
];

// --- Track all signals found across cycles ---
let allSignals = [];

// --- Process a single symbol, return any signals found ---
async function processSymbol(feed, symbol, timeframe) {
  const signals = [];
  const [candles, ticker] = await Promise.all([
    feed.fetchCandles(symbol, timeframe),
    feed.fetchTicker(symbol),
  ]);

  for (const strategy of strategies) {
    const signal = strategy.evaluate(candles, ticker);
    if (!signal) continue;

    const { score, reasons } = scoreProfitability(candles, signal);
    if (score < minProfitScore) continue;

    signal.profitScore = score;
    signal.profitReasons = reasons;
    signals.push(signal);
  }
  return signals;
}

// --- Run cycle ---
async function runCycle() {
  updateScanStatus({ scanning: true });
  const newSignals = [];

  // Process crypto
  for (const symbol of cryptoSymbols) {
    try {
      const sigs = await processSymbol(cryptoFeed, symbol, cryptoTimeframe);
      newSignals.push(...sigs);
    } catch (err) {
      // skip
    }
  }

  // Discover stocks
  let stockSymbols = [];
  try {
    stockSymbols = await discoverStocks();
    for (const s of extraStocks) {
      if (!stockSymbols.includes(s)) stockSymbols.push(s);
    }
  } catch (err) {
    stockSymbols = extraStocks;
  }

  // Process stocks
  let scanned = 0;
  for (const symbol of stockSymbols) {
    try {
      const sigs = await processSymbol(stockFeed, symbol, stockTimeframe);
      newSignals.push(...sigs);
      scanned++;
      if (scanned % 10 === 0) {
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (err) {
      // skip
    }
  }

  // Merge new signals
  for (const sig of newSignals) {
    const key = `${sig.symbol}:${sig.strategy}`;
    const idx = allSignals.findIndex(s => `${s.symbol}:${s.strategy}` === key);
    if (idx >= 0) {
      allSignals[idx] = sig;
    } else {
      allSignals.push(sig);
    }
  }

  // Remove stale signals older than 1 hour
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  allSignals = allSignals.filter(s => s.timestamp > oneHourAgo);

  // Sort best first
  allSignals.sort((a, b) => b.profitScore - a.profitScore);

  // Update web dashboard
  updateSignals(allSignals);
  updateScanStatus({ stocksScanned: scanned, lastRefresh: Date.now(), scanning: false });

  // Log to terminal too
  console.log(`[${new Date().toLocaleTimeString()}] Scanned ${scanned} stocks — ${allSignals.length} signal(s) active`);
  for (const signal of newSignals) {
    await Promise.all(callouts.map(c => c.send(signal).catch(() => {})));
  }
}

// --- Main ---
async function main() {
  console.log('Signal Trading Bot starting...');

  // Start web dashboard
  startWebServer(port);

  // Run immediately, then on interval
  await runCycle();
  setInterval(runCycle, cycleInterval);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
