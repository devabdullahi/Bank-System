export default class Deduplicator {
  constructor(cooldownMs = 5 * 60 * 1000) {
    this.cooldownMs = cooldownMs;
    this.recentSignals = new Map();
  }

  isDuplicate(signal) {
    const key = `${signal.symbol}:${signal.type}:${signal.strategy}`;
    const lastSeen = this.recentSignals.get(key);

    if (lastSeen && Date.now() - lastSeen < this.cooldownMs) {
      return true;
    }

    this.recentSignals.set(key, Date.now());
    return false;
  }

  clear() {
    this.recentSignals.clear();
  }
}
