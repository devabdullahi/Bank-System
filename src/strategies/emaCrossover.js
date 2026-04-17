import BaseStrategy from './baseStrategy.js';
import { detectEMACrossover } from '../indicators/ema.js';

export default class EMACrossoverStrategy extends BaseStrategy {
  constructor({ shortPeriod = 9, longPeriod = 21 } = {}) {
    super('EMA Crossover');
    this.shortPeriod = shortPeriod;
    this.longPeriod = longPeriod;
  }

  evaluate(candles, ticker) {
    const crossover = detectEMACrossover(candles, this.shortPeriod, this.longPeriod);
    if (!crossover) return null;

    if (crossover === 'BULLISH') {
      return this.createSignal('BUY', ticker, 75, `EMA ${this.shortPeriod} crossed above EMA ${this.longPeriod}`);
    }
    if (crossover === 'BEARISH') {
      return this.createSignal('SELL', ticker, 75, `EMA ${this.shortPeriod} crossed below EMA ${this.longPeriod}`);
    }
    return null;
  }
}
