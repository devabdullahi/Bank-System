import { RSI } from 'technicalindicators';

export function calculateRSI(candles, period = 14) {
  const closes = candles.map(c => c.close);
  const results = RSI.calculate({ values: closes, period });
  return results.length > 0 ? results[results.length - 1] : null;
}
