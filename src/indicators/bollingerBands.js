import { BollingerBands } from 'technicalindicators';

export function calculateBollingerBands(candles, period = 20, stdDev = 2) {
  const closes = candles.map(c => c.close);
  const results = BollingerBands.calculate({
    values: closes,
    period,
    stdDev,
  });

  if (results.length === 0) return null;

  const latest = results[results.length - 1];
  return {
    upper: latest.upper,
    middle: latest.middle,
    lower: latest.lower,
  };
}
