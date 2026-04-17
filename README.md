# Signal Trading Bot

A real-time trading signal scanner that monitors stocks and cryptocurrencies using technical analysis strategies, scores opportunities by profitability, and serves results through a live web dashboard.

## Features

- **Multi-asset scanning** -- stocks via Yahoo Finance and crypto via CCXT (Coinbase)
- **Dynamic stock discovery** -- rotates through Yahoo Finance screener categories to surface new tickers each cycle
- **Technical strategies** -- RSI Oversold/Overbought, EMA Crossover, MACD Signal
- **Profitability scoring** -- multi-indicator scoring system (0-100) filters out low-quality signals
- **Web dashboard** -- auto-refreshing UI with signal cards, profit scores, and Buy/Sell/High Probability filters
- **Signal deduplication** -- cooldown-based dedup prevents repeat alerts within a configurable window
- **Multi-channel alerts** -- pluggable callout system (logger built-in, Discord and Telegram ready)
- **No API keys required** -- Yahoo Finance and Coinbase public endpoints work out of the box

## Quick Start

```bash
# Install dependencies
npm install

# Configure (optional -- defaults work without any keys)
cp .env.example .env   # edit tickers, timeframes, thresholds

# Run
npm start
```

Open **http://localhost:3000** to view the dashboard.

## Configuration

All runtime settings live in `.env`:

| Variable | Default | Description |
|---|---|---|
| `CRYPTO_SYMBOLS` | `BTC/USDT,ETH/USDT,SOL/USDT` | Comma-separated crypto pairs |
| `STOCK_SYMBOLS` | 35 diversified tickers | Comma-separated stock tickers |
| `CRYPTO_TIMEFRAME` | `1h` | Candle timeframe for crypto |
| `STOCK_TIMEFRAME` | `1d` | Candle timeframe for stocks |
| `CYCLE_INTERVAL` | `300` | Seconds between scan cycles |
| `MIN_PROFIT_SCORE` | `60` | Minimum score (0-100) to surface a signal |
| `PORT` | `3000` | Web dashboard port |

Strategy parameters (RSI period, EMA lengths, MACD periods, Bollinger Bands, dedup cooldown) are in `config/default.json`.

## Project Structure

```
src/
  orchestrator.js        # Main loop -- coordinates feeds, strategies, and output
  feeds/
    ccxtFeed.js          # Crypto market data via CCXT
    yahooFeed.js         # Stock market data via Yahoo Finance
    stockScreener.js     # Dynamic stock discovery from Yahoo screeners
    websocketFeed.js     # WebSocket feed (placeholder)
  indicators/
    rsi.js               # Relative Strength Index
    ema.js               # Exponential Moving Average
    macd.js              # MACD
    bollingerBands.js    # Bollinger Bands
  strategies/
    baseStrategy.js      # Base class for strategies
    rsiOversold.js       # RSI oversold/overbought strategy
    emaCrossover.js      # EMA crossover strategy
    macdSignal.js        # MACD signal line crossover
  callouts/
    logger.js            # File/console logger
    discord.js           # Discord webhook alerts
    telegram.js          # Telegram bot alerts
  utils/
    deduplicator.js      # Signal deduplication with cooldown
    profitFilter.js      # Multi-indicator profitability scoring
  web/
    server.js            # Express API server
    index.html           # Dashboard UI
config/
  default.json           # Strategy parameters
tests/
  indicators.test.js     # Indicator unit tests
  strategies.test.js     # Strategy unit tests
  callouts.test.js       # Callout unit tests
```

## Running Tests

```bash
npm test
```

## Docker

```bash
docker compose up -d
```

The container runs the bot with your `.env` and persists `signals.log` to the host.

## Disclaimer

This tool generates educational trading signals only. It is not financial advice. Do your own research before making any trading decisions.
