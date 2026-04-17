import winston from 'winston';

const holdTimeGuide = {
  'RSI Oversold': {
    BUY: 'buy now and hold for 2-5 days until RSI bounces back to the 50-60 range, then sell for profit',
    SELL: 'sell/short now and cover in 1-3 days when it cools off',
  },
  'EMA Crossover': {
    BUY: 'buy now and ride the new uptrend for 1-3 weeks — sell when the short EMA crosses back below the long one',
    SELL: 'sell/short now — the trend just flipped bearish, hold the short for 1-3 weeks',
  },
  'MACD Signal': {
    BUY: 'buy now while momentum is turning — hold for 1-2 weeks, take profit when the move slows down',
    SELL: 'sell/short now — momentum is dying, cover in 1-2 weeks when it bottoms out',
  },
};

function formatSignal(signal) {
  const guide = holdTimeGuide[signal.strategy]?.[signal.type] || '';
  const action = signal.type === 'BUY' ? '🟢 BUY' : '🔴 SELL/SHORT';
  const strength = signal.profitScore >= 80 ? 'HIGH PROBABILITY' : signal.profitScore >= 60 ? 'GOOD PROBABILITY' : 'MODERATE';

  const lines = [
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `${action} — ${signal.symbol} @ $${signal.price}`,
    `Profit potential: ${strength} (${signal.profitScore}/100)`,
    ``,
    `Why this looks profitable:`,
    ...(signal.profitReasons || []).map(r => `  • ${r}`),
    ``,
    `What an experienced trader would do:`,
    `  → ${guide}`,
    ``,
    `⚠️  Educational only — not financial advice.`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
  ];

  return lines.join('\n');
}

export default class LoggerCallout {
  constructor(logFile = 'signals.log') {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.printf(({ message }) => message),
          ),
        }),
        new winston.transports.File({ filename: logFile }),
      ],
    });
  }

  async send(signal) {
    this.logger.info(formatSignal(signal));
  }
}
