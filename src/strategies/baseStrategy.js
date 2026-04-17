export default class BaseStrategy {
  constructor(name) {
    this.name = name;
  }

  evaluate(candles, ticker) {
    throw new Error(`Strategy "${this.name}" must implement evaluate()`);
  }

  createSignal(type, ticker, strength, reason) {
    return {
      strategy: this.name,
      type,
      symbol: ticker.symbol,
      price: ticker.last,
      strength,
      reason,
      timestamp: Date.now(),
    };
  }
}
