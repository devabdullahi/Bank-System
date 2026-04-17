import { jest } from '@jest/globals';
import RSIOversoldStrategy from '../src/strategies/rsiOversold.js';
import EMACrossoverStrategy from '../src/strategies/emaCrossover.js';
import MACDSignalStrategy from '../src/strategies/macdSignal.js';

function makeCandles(closes) {
  return closes.map((close, i) => ({
    timestamp: Date.now() - (closes.length - i) * 60000,
    open: close - 1,
    high: close + 2,
    low: close - 2,
    close,
    volume: 1000,
  }));
}

const ticker = { symbol: 'BTC/USDT', last: 50000 };

describe('RSI Oversold Strategy', () => {
  const strategy = new RSIOversoldStrategy({ period: 14, oversold: 30, overbought: 70 });

  test('returns BUY when RSI is below oversold', () => {
    const downtrend = Array.from({ length: 50 }, (_, i) => 200 - i * 2);
    const candles = makeCandles(downtrend);
    const signal = strategy.evaluate(candles, ticker);
    expect(signal).not.toBeNull();
    expect(signal.type).toBe('BUY');
  });

  test('returns SELL when RSI is above overbought', () => {
    const uptrend = Array.from({ length: 50 }, (_, i) => 100 + i * 2);
    const candles = makeCandles(uptrend);
    const signal = strategy.evaluate(candles, ticker);
    expect(signal).not.toBeNull();
    expect(signal.type).toBe('SELL');
  });

  test('returns null when RSI is in neutral zone', () => {
    // Oscillating prices → RSI near 50
    const oscillating = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i) * 5);
    const candles = makeCandles(oscillating);
    const signal = strategy.evaluate(candles, ticker);
    expect(signal).toBeNull();
  });

  test('signal has all required fields', () => {
    const downtrend = Array.from({ length: 50 }, (_, i) => 200 - i * 2);
    const candles = makeCandles(downtrend);
    const signal = strategy.evaluate(candles, ticker);
    expect(signal).toHaveProperty('strategy');
    expect(signal).toHaveProperty('type');
    expect(signal).toHaveProperty('symbol');
    expect(signal).toHaveProperty('price');
    expect(signal).toHaveProperty('strength');
    expect(signal).toHaveProperty('reason');
    expect(signal).toHaveProperty('timestamp');
  });
});

describe('EMA Crossover Strategy', () => {
  const strategy = new EMACrossoverStrategy({ shortPeriod: 9, longPeriod: 21 });

  test('returns null for flat market', () => {
    const flat = Array(50).fill(100);
    const candles = makeCandles(flat);
    const signal = strategy.evaluate(candles, ticker);
    expect(signal).toBeNull();
  });

  test('returns null for insufficient data', () => {
    const candles = makeCandles([100, 101]);
    const signal = strategy.evaluate(candles, ticker);
    expect(signal).toBeNull();
  });
});

describe('MACD Signal Strategy', () => {
  const strategy = new MACDSignalStrategy();

  test('returns null for insufficient data', () => {
    const candles = makeCandles([100, 101, 102]);
    const signal = strategy.evaluate(candles, ticker);
    expect(signal).toBeNull();
  });

  test('returns null for steady trend (no histogram flip)', () => {
    const uptrend = Array.from({ length: 50 }, (_, i) => 100 + i * 2);
    const candles = makeCandles(uptrend);
    const signal = strategy.evaluate(candles, ticker);
    // Steady uptrend — histogram stays positive, no flip
    expect(signal).toBeNull();
  });
});
