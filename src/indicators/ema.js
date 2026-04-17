import { EMA } from 'technicalindicators';

export function calculateEMA(candles, period = 20) {
  const closes = candles.map(c => c.close);
  const results = EMA.calculate({ values: closes, period });
  return results.length > 0 ? results[results.length - 1] : null;
}

export function detectEMACrossover(candles, shortPeriod = 9, longPeriod = 21) {
  const closes = candles.map(c => c.close);
  const shortEMA = EMA.calculate({ values: closes, period: shortPeriod });
  const longEMA = EMA.calculate({ values: closes, period: longPeriod });

  // Align arrays — longEMA is shorter
  const offset = shortEMA.length - longEMA.length;
  if (longEMA.length < 2) return null;

  const prevShort = shortEMA[offset + longEMA.length - 2];
  const prevLong = longEMA[longEMA.length - 2];
  const currShort = shortEMA[offset + longEMA.length - 1];
  const currLong = longEMA[longEMA.length - 1];

  if (prevShort <= prevLong && currShort > currLong) return 'BULLISH';
  if (prevShort >= prevLong && currShort < currLong) return 'BEARISH';
  return null;
}
