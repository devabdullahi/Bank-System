import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const ALL_SCREENS = [
  'most_actives',
  'day_gainers',
  'day_losers',
  'undervalued_large_caps',
  'growth_technology_stocks',
  'undervalued_growth_stocks',
  'aggressive_small_caps',
  'small_cap_gainers',
];

// Rotate which screeners we use each cycle so we get variety
let cycleIndex = 0;

export async function discoverStocks() {
  const allSymbols = new Set();

  // Pick 4 screeners per cycle, rotating through all of them
  const screensThisCycle = [];
  for (let i = 0; i < 4; i++) {
    screensThisCycle.push(ALL_SCREENS[(cycleIndex + i) % ALL_SCREENS.length]);
  }
  cycleIndex = (cycleIndex + 4) % ALL_SCREENS.length;

  for (const screenerId of screensThisCycle) {
    try {
      const result = await yahooFinance.screener({ scrIds: screenerId, count: 100 });
      const quotes = result?.quotes || [];
      for (const q of quotes) {
        if (
          q.symbol &&
          !q.symbol.includes('.') &&
          !q.symbol.includes('-') &&
          q.quoteType === 'EQUITY'
        ) {
          allSymbols.add(q.symbol);
        }
      }
    } catch (err) {
      // skip failed screeners
    }
  }

  return [...allSymbols];
}
