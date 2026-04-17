# Signal Trading Bot — Build Instructions

## What you're building
A bot that watches crypto (or stock) price data, detects trade setups using technical indicators, and fires alerts (callouts) to Discord, Telegram, or a log file. A sub-agent then tests the code automatically.

---

## Phase 1 — Project Setup

1. Create a new folder for your project and open it in VS Code or your preferred editor.
2. Initialize a Node.js project using `npm init`.
3. Install these packages: `ccxt` (exchange data), `technicalindicators` (RSI/EMA/MACD), `discord.js` (Discord alerts), `node-telegram-bot-api` (Telegram alerts), `dotenv` (environment variables), and `winston` (logging).
4. Install `jest` as a dev dependency for testing.
5. Add `"type": "module"` to your `package.json` so you can use ES module syntax.
6. Create a `.env` file at the root and add your exchange API keys, Discord bot token, Telegram bot token, and the symbols you want to watch (e.g. `BTC/USDT`).

---

## Phase 2 — Data Feed

7. Create a `src/feeds/` folder.
8. Inside it, build a **CCXT feed module** whose job is to connect to your chosen exchange and fetch OHLCV candle data (open, high, low, close, volume) and the current ticker price for a given symbol.
9. Optionally build a **WebSocket feed module** that streams live candles in real time instead of polling — useful for short timeframes like 1-minute.

---

## Phase 3 — Indicator Engine

10. Create a `src/indicators/` folder. Each file in here should be a small, focused module that takes an array of candles as input and returns a computed value.
11. Build an **RSI module** that returns the current Relative Strength Index value.
12. Build an **EMA module** that returns the current Exponential Moving Average, and a helper that detects when a short EMA crosses above or below a longer EMA.
13. Build a **MACD module** that returns the current MACD line, signal line, and histogram.
14. Build a **Bollinger Bands module** that returns the upper band, lower band, and middle band.

---

## Phase 4 — Strategy Engine

15. Create a `src/strategies/` folder.
16. Build a **base strategy class** that defines the interface every strategy must follow: it takes candles and a ticker, and returns either `null` (no signal) or a signal object containing the trade type (BUY/SELL), symbol, price, strength, reason, and timestamp.
17. Build an **RSI Oversold strategy** that fires a BUY when RSI drops below your oversold threshold and a SELL when it rises above your overbought threshold.
18. Build an **EMA Crossover strategy** that fires a BUY when the short EMA crosses above the long EMA, and a SELL when it crosses below.
19. Build a **MACD Signal strategy** that fires a BUY when the MACD histogram turns positive and a SELL when it turns negative.

---

## Phase 5 — Callout System

20. Create a `src/callouts/` folder.
21. Build a **Discord callout module** that logs into your Discord bot and sends a rich embed message to your configured channel whenever it receives a signal object.
22. Build a **Telegram callout module** that sends a formatted text message to your Telegram chat with the signal details.
23. Build a **logger callout module** that writes every signal to both the console and a `signals.log` file.
24. Build a **deduplicator utility** in `src/utils/` that tracks recently fired signals and suppresses any identical signal (same symbol + type + strategy) that fires again within your cooldown window (e.g. 5 minutes).

---

## Phase 6 — Orchestrator

25. Create `src/orchestrator.js` — this is the heart of the bot.
26. On startup, it should read your config from `.env`, initialize the data feed, load all strategies, and connect all callout channels.
27. Define a **run cycle** function that loops through every watched symbol, fetches fresh candles and ticker data, runs each strategy against that data, and for any signal returned, checks the deduplicator then fires all callouts in parallel.
28. Run the cycle once immediately on startup, then repeat it on a timer (e.g. every 60 seconds).

---

## Phase 7 — Sub-Agent Test Suite

29. Create a `tests/` folder.
30. Write **unit tests for each indicator** — verify each one returns a value in the expected range given known input candles.
31. Write **unit tests for each strategy** — verify that a strategy correctly returns a BUY signal when given obviously oversold candle data, and that the signal object has all required fields.
32. Write **unit tests for callouts and the deduplicator** — verify the logger doesn't throw, and that the deduplicator correctly allows the first signal through and blocks the duplicate.
33. Build a **sub-agent test script** that calls the Anthropic API with the source code of each strategy file and asks it to review the code for correctness, score it out of 10, flag any issues, and suggest edge cases to test. Save the result as `subagent-report.json`.

---

## Phase 8 — Configuration

34. Create a `config/default.json` file that stores all your strategy parameters (RSI periods, EMA lengths, MACD settings) so you can tune them without touching code.
35. Make sure your orchestrator reads from this config file on startup.

---

## Phase 9 — Deployment

36. Write a `Dockerfile` that uses the Node 20 Alpine image, installs only production dependencies, copies your source, and starts the orchestrator.
37. Write a `docker-compose.yml` that runs the bot container, mounts your `signals.log` file so logs persist outside the container, and sets `restart: unless-stopped` so it recovers automatically after crashes.
38. Deploy by running `docker compose up -d` on your server.

---

## How to extend it later

- **New strategy** — add a new file in `src/strategies/`, extend the base class, register it in the orchestrator. The sub-agent will pick it up automatically on the next review run.
- **New callout channel** — add a new file in `src/callouts/` with a `send(signal)` method, add it to the callouts array in the orchestrator.
- **Backtesting** — feed historical OHLCV arrays from your data feed into each strategy's `evaluate()` method in a loop and track the results.
- **Live trading** — after thorough paper testing, integrate CCXT's `createOrder()` call into the orchestrator after a signal passes all your filters.
