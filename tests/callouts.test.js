import { jest } from '@jest/globals';
import LoggerCallout from '../src/callouts/logger.js';
import Deduplicator from '../src/utils/deduplicator.js';

const mockSignal = {
  strategy: 'RSI Oversold',
  type: 'BUY',
  symbol: 'BTC/USDT',
  price: 50000,
  strength: 85,
  reason: 'RSI at 25.00 (below 30)',
  timestamp: Date.now(),
};

describe('Logger Callout', () => {
  test('does not throw when sending a signal', async () => {
    const logger = new LoggerCallout('test-signals.log');
    await expect(logger.send(mockSignal)).resolves.not.toThrow();
  });
});

describe('Deduplicator', () => {
  test('allows first signal through', () => {
    const dedup = new Deduplicator(5000);
    expect(dedup.isDuplicate(mockSignal)).toBe(false);
  });

  test('blocks duplicate within cooldown', () => {
    const dedup = new Deduplicator(5000);
    dedup.isDuplicate(mockSignal); // first call marks it
    expect(dedup.isDuplicate(mockSignal)).toBe(true);
  });

  test('allows same signal after cooldown expires', () => {
    const dedup = new Deduplicator(1); // 1ms cooldown
    dedup.isDuplicate(mockSignal);
    // Wait just slightly
    const start = Date.now();
    while (Date.now() - start < 5) {} // busy wait 5ms
    expect(dedup.isDuplicate(mockSignal)).toBe(false);
  });

  test('allows different signals', () => {
    const dedup = new Deduplicator(5000);
    dedup.isDuplicate(mockSignal);
    const differentSignal = { ...mockSignal, symbol: 'ETH/USDT' };
    expect(dedup.isDuplicate(differentSignal)).toBe(false);
  });

  test('clear resets all tracked signals', () => {
    const dedup = new Deduplicator(5000);
    dedup.isDuplicate(mockSignal);
    dedup.clear();
    expect(dedup.isDuplicate(mockSignal)).toBe(false);
  });
});
