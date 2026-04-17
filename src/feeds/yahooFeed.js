import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export default class YahooFeed {
  async fetchCandles(symbol, timeframe = '1d', limit = 100) {
    const intervalMap = {
      '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
      '1h': '60m', '1d': '1d', '1w': '1wk', '1M': '1mo',
    };
    const interval = intervalMap[timeframe] || '1d';

    // Calculate start date based on limit and timeframe
    const msPerCandle = {
      '1m': 60000, '5m': 300000, '15m': 900000, '30m': 1800000,
      '60m': 3600000, '1d': 86400000, '1wk': 604800000, '1mo': 2592000000,
    };
    const lookback = (msPerCandle[interval] || 86400000) * limit * 1.5;
    const period1 = new Date(Date.now() - lookback);

    const result = await yahooFinance.chart(symbol, {
      period1,
      interval,
    });

    const quotes = result.quotes || [];
    return quotes.slice(-limit).map(q => ({
      timestamp: new Date(q.date).getTime(),
      open: q.open,
      high: q.high,
      low: q.low,
      close: q.close,
      volume: q.volume,
    }));
  }

  async fetchTicker(symbol) {
    const quote = await yahooFinance.quote(symbol);
    return {
      symbol,
      last: quote.regularMarketPrice,
      bid: quote.bid || quote.regularMarketPrice,
      ask: quote.ask || quote.regularMarketPrice,
      high: quote.regularMarketDayHigh,
      low: quote.regularMarketDayLow,
      volume: quote.regularMarketVolume,
      timestamp: new Date(quote.regularMarketTime).getTime(),
    };
  }
}
