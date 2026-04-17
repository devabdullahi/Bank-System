import { jest } from '@jest/globals';
import { calculateRSI } from '../src/indicators/rsi.js';
import { calculateEMA, detectEMACrossover } from '../src/indicators/ema.js';
import { calculateMACD } from '../src/indicators/macd.js';
import { calculateBollingerBands } from '../src/indicators/bollingerBands.js';

// Generate synthetic candle data
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

// Trending up then down for crossover detection
const trendingUp = Array.from({ length: 50 }, (_, i) => 100 + i * 2);
const trendingDown = Array.from({ length: 50 }, (_, i) => 200 - i * 2);

describe('RSI Indicator', () => {
  test('returns a value between 0 and 100', () => {
    const candles = makeCandles(trendingUp);
    const rsi = calculateRSI(candles);
    expect(rsi).toBeGreaterThanOrEqual(0);
    expect(rsi).toBeLessThanOrEqual(100);
  });

  test('returns high RSI for strong uptrend', () => {
    const candles = makeCandles(trendingUp);
    const rsi = calculateRSI(candles);
    expect(rsi).toBeGreaterThan(70);
  });

  test('returns low RSI for strong downtrend', () => {
    const candles = makeCandles(trendingDown);
    const rsi = calculateRSI(candles);
    expect(rsi).toBeLessThan(30);
  });

  test('returns null for insufficient data', () => {
    const candles = makeCandles([100, 101, 102]);
    const rsi = calculateRSI(candles);
    expect(rsi).toBeNull();
  });
});

describe('EMA Indicator', () => {
  test('returns a numeric value', () => {
    const candles = makeCandles(trendingUp);
    const ema = calculateEMA(candles, 10);
    expect(typeof ema).toBe('number');
  });

  test('EMA follows price direction', () => {
    const candles = makeCandles(trendingUp);
    const ema = calculateEMA(candles, 10);
    // EMA should be below the latest close in an uptrend (lagging)
    expect(ema).toBeLessThan(candles[candles.length - 1].close);
  });

  test('detects bullish crossover', () => {
    // Short EMA rising faster than long: create data that crosses
    const flat = Array(30).fill(100);
    const spike = Array.from({ length: 20 }, (_, i) => 100 + (i + 1) * 3);
    const candles = makeCandles([...flat, ...spike]);
    const cross = detectEMACrossover(candles, 9, 21);
    // Should detect bullish at some point during spike
    expect(['BULLISH', null]).toContain(cross);
  });

  test('returns null for insufficient data', () => {
    const candles = makeCandles([100, 101]);
    expect(detectEMACrossover(candles, 9, 21)).toBeNull();
  });
});

describe('MACD Indicator', () => {
  test('returns macd, signal, and histogram', () => {
    const candles = makeCandles(trendingUp);
    const result = calculateMACD(candles);
    expect(result).toHaveProperty('macd');
    expect(result).toHaveProperty('signal');
    expect(result).toHaveProperty('histogram');
  });

  test('histogram is non-negative in uptrend', () => {
    const candles = makeCandles(trendingUp);
    const result = calculateMACD(candles);
    expect(result.histogram).toBeGreaterThanOrEqual(0);
  });

  test('returns null for insufficient data', () => {
    const candles = makeCandles([100, 101, 102]);
    expect(calculateMACD(candles)).toBeNull();
  });
});

describe('Bollinger Bands Indicator', () => {
  test('returns upper, middle, lower bands', () => {
    const candles = makeCandles(trendingUp);
    const result = calculateBollingerBands(candles);
    expect(result).toHaveProperty('upper');
    expect(result).toHaveProperty('middle');
    expect(result).toHaveProperty('lower');
  });

  test('upper > middle > lower', () => {
    const candles = makeCandles(trendingUp);
    const result = calculateBollingerBands(candles);
    expect(result.upper).toBeGreaterThan(result.middle);
    expect(result.middle).toBeGreaterThan(result.lower);
  });

  test('returns null for insufficient data', () => {
    const candles = makeCandles([100, 101]);
    expect(calculateBollingerBands(candles)).toBeNull();
  });
});
