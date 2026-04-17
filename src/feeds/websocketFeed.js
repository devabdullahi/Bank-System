import ccxt from 'ccxt';

export default class WebSocketFeed {
  constructor({ exchangeId = 'binance', apiKey, secret }) {
    const proId = exchangeId + 'pro' in ccxt.pro ? exchangeId : exchangeId;
    const ExchangeClass = ccxt.pro?.[proId] || ccxt[exchangeId];
    if (!ExchangeClass) {
      throw new Error(`Exchange "${exchangeId}" not supported`);
    }
    this.exchange = new ExchangeClass({ apiKey, secret, enableRateLimit: true });
    this.running = false;
  }

  async watchCandles(symbol, timeframe = '1m', onCandle) {
    this.running = true;
    while (this.running) {
      try {
        const ohlcv = await this.exchange.watchOHLCV(symbol, timeframe);
        const candles = ohlcv.map(([timestamp, open, high, low, close, volume]) => ({
          timestamp, open, high, low, close, volume,
        }));
        onCandle(candles);
      } catch (err) {
        if (this.running) {
          console.error('WebSocket error, reconnecting...', err.message);
          await new Promise(r => setTimeout(r, 5000));
        }
      }
    }
  }

  stop() {
    this.running = false;
  }
}
