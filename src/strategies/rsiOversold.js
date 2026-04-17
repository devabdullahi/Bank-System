import BaseStrategy from './baseStrategy.js';
import { calculateRSI } from '../indicators/rsi.js';

export default class RSIOversoldStrategy extends BaseStrategy {
  constructor({ period = 14, oversold = 30, overbought = 70 } = {}) {
    super('RSI Oversold');
    this.period = period;
    this.oversold = oversold;
    this.overbought = overbought;
  }

  evaluate(candles, ticker) {
    const rsi = calculateRSI(candles, this.period);
    if (rsi === null) return null;

    if (rsi < this.oversold) {
      return this.createSignal('BUY', ticker, Math.round(100 - rsi), `RSI at ${rsi.toFixed(2)} (below ${this.oversold})`);
    }
    if (rsi > this.overbought) {
      return this.createSignal('SELL', ticker, Math.round(rsi), `RSI at ${rsi.toFixed(2)} (above ${this.overbought})`);
    }
    return null;
  }
}
