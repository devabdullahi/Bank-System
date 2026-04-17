import { calculateRSI } from '../indicators/rsi.js';
import { calculateMACD } from '../indicators/macd.js';
import { calculateBollingerBands } from '../indicators/bollingerBands.js';
import { calculateEMA } from '../indicators/ema.js';

/**
 * Scores how profitable a signal setup looks based on multiple confirming indicators.
 * Returns a score 0-100. Only signals scoring 60+ should be shown.
 *
 * A "profitable" setup means multiple indicators agree AND price action supports it.
 */
export function scoreProfitability(candles, signal) {
  let score = 0;
  let reasons = [];

  const rsi = calculateRSI(candles);
  const macd = calculateMACD(candles);
  const bb = calculateBollingerBands(candles);
  const ema9 = calculateEMA(candles, 9);
  const ema21 = calculateEMA(candles, 21);
  const lastClose = candles[candles.length - 1]?.close;

  if (!lastClose) return { score: 0, reasons: ['not enough data'] };

  if (signal.type === 'BUY') {
    // RSI confirms oversold
    if (rsi !== null && rsi < 35) {
      score += 20;
      reasons.push(`RSI is low at ${rsi.toFixed(1)} — stock is beaten down`);
    }

    // Price near or below lower Bollinger Band — cheap relative to recent range
    if (bb && lastClose <= bb.lower * 1.02) {
      score += 20;
      reasons.push(`price is near the bottom of its range`);
    }

    // MACD histogram turning up — momentum shifting
    if (macd && macd.histogram > -0.5) {
      score += 15;
      reasons.push(`momentum is starting to shift upward`);
    }

    // Price above short EMA — not in total freefall
    if (ema9 && lastClose > ema9 * 0.98) {
      score += 10;
      reasons.push(`price is stabilizing`);
    }

    // Volume spike on recent candles — institutional interest
    const recentVol = candles.slice(-5).reduce((s, c) => s + c.volume, 0) / 5;
    const avgVol = candles.slice(-20).reduce((s, c) => s + c.volume, 0) / 20;
    if (avgVol > 0 && recentVol > avgVol * 1.3) {
      score += 15;
      reasons.push(`volume is picking up — big players might be buying`);
    }

    // Recent pullback from higher levels (buy the dip, not a falling knife)
    const high20 = Math.max(...candles.slice(-20).map(c => c.high));
    const pullback = (high20 - lastClose) / high20;
    if (pullback > 0.05 && pullback < 0.20) {
      score += 20;
      reasons.push(`stock pulled back ${(pullback * 100).toFixed(0)}% from recent highs — potential dip buy`);
    }

  } else if (signal.type === 'SELL') {
    // RSI confirms overbought
    if (rsi !== null && rsi > 65) {
      score += 20;
      reasons.push(`RSI is high at ${rsi.toFixed(1)} — stock is overextended`);
    }

    // Price near or above upper Bollinger Band
    if (bb && lastClose >= bb.upper * 0.98) {
      score += 20;
      reasons.push(`price is at the top of its range`);
    }

    // MACD histogram turning down
    if (macd && macd.histogram < 0.5) {
      score += 15;
      reasons.push(`momentum is fading`);
    }

    // Price below long EMA — trend is weakening
    if (ema21 && lastClose < ema21) {
      score += 15;
      reasons.push(`price dropped below trend line`);
    }

    // Big run-up — sell the rip
    const low20 = Math.min(...candles.slice(-20).map(c => c.low));
    const runup = (lastClose - low20) / low20;
    if (runup > 0.08) {
      score += 20;
      reasons.push(`stock ran up ${(runup * 100).toFixed(0)}% recently — could pull back`);
    }

    // Volume drying up on the rally
    const recentVol = candles.slice(-3).reduce((s, c) => s + c.volume, 0) / 3;
    const avgVol = candles.slice(-20).reduce((s, c) => s + c.volume, 0) / 20;
    if (avgVol > 0 && recentVol < avgVol * 0.7) {
      score += 10;
      reasons.push(`volume is declining — rally losing steam`);
    }
  }

  return { score: Math.min(score, 100), reasons };
}
