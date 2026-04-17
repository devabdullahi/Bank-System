import { MACD } from 'technicalindicators';

export function calculateMACD(candles, { fastPeriod = 12, slowPeriod = 26, signalPeriod = 9 } = {}) {
  const closes = candles.map(c => c.close);
  const results = MACD.calculate({
    values: closes,
    fastPeriod,
    slowPeriod,
    signalPeriod,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  if (results.length === 0) return null;

  const latest = results[results.length - 1];
  return {
    macd: latest.MACD,
    signal: latest.signal,
    histogram: latest.histogram,
  };
}
