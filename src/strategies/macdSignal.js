import BaseStrategy from './baseStrategy.js';
import { calculateMACD } from '../indicators/macd.js';

export default class MACDSignalStrategy extends BaseStrategy {
  constructor({ fastPeriod = 12, slowPeriod = 26, signalPeriod = 9 } = {}) {
    super('MACD Signal');
    this.macdConfig = { fastPeriod, slowPeriod, signalPeriod };
  }

  evaluate(candles, ticker) {
    if (candles.length < 2) return null;

    const current = calculateMACD(candles, this.macdConfig);
    const previous = calculateMACD(candles.slice(0, -1), this.macdConfig);

    if (!current || !previous) return null;
    if (current.histogram === undefined || previous.histogram === undefined) return null;

    if (previous.histogram <= 0 && current.histogram > 0) {
      return this.createSignal('BUY', ticker, 70, `MACD histogram turned positive (${current.histogram.toFixed(4)})`);
    }
    if (previous.histogram >= 0 && current.histogram < 0) {
      return this.createSignal('SELL', ticker, 70, `MACD histogram turned negative (${current.histogram.toFixed(4)})`);
    }
    return null;
  }
}
