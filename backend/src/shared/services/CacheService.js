/**
 * Cache Service Abstraction
 * Currently a simple in-memory implementation.
 * Can be swapped to Redis later without changing business logic.
 */
class CacheService {
  constructor() {
    this.cache = new Map();
  }

  async get(key) {
    return this.cache.get(key);
  }

  async set(key, value, ttl = 3600) {
    this.cache.set(key, value);
    // basic TTL for in-memory
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl * 1000);
  }

  async delete(key) {
    this.cache.delete(key);
  }

  async clear() {
    this.cache.clear();
  }
}

module.exports = new CacheService();
