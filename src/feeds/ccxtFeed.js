import ccxt from 'ccxt';

export default class CcxtFeed {
  constructor({ exchangeId = 'coinbase', apiKey, secret, sandbox = false }) {
    const ExchangeClass = ccxt[exchangeId];
    if (!ExchangeClass) {
      throw new Error(`Exchange "${exchangeId}" is not supported by CCXT`);
    }
    const options = { enableRateLimit: true };
    if (apiKey) options.apiKey = apiKey;
    if (secret) options.secret = secret;
    this.exchange = new ExchangeClass(options);
    if (sandbox) {
      this.exchange.setSandboxMode(true);
    }
  }

  async fetchCandles(symbol, timeframe = '1h', limit = 100) {
    const ohlcv = await this.exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
    return ohlcv.map(([timestamp, open, high, low, close, volume]) => ({
      timestamp,
      open,
      high,
      low,
      close,
      volume,
    }));
  }

  async fetchTicker(symbol) {
    const ticker = await this.exchange.fetchTicker(symbol);
    return {
      symbol: ticker.symbol,
      last: ticker.last,
      bid: ticker.bid,
      ask: ticker.ask,
      high: ticker.high,
      low: ticker.low,
      volume: ticker.baseVolume,
      timestamp: ticker.timestamp,
    };
  }
}
