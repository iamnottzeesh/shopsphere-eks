const { randomUUID } = require("node:crypto");
const Redis = require("ioredis");

function createMemoryStore() {
  const carts = new Map();

  return {
    async create() {
      const cart = {
        id: randomUUID(),
        currency: "INR",
        items: [],
        total: 0
      };
      carts.set(cart.id, cart);
      return cart;
    },
    async get(cartId) {
      return carts.get(cartId) ?? null;
    },
    async save(cart) {
      carts.set(cart.id, cart);
      return cart;
    }
  };
}

function createRedisStore({ redisUrl, keyPrefix = "shopsphere:cart:", ttlSeconds = 86400 } = {}) {
  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 2,
    connectTimeout: 5000,
    enableOfflineQueue: true,
    retryStrategy: times => Math.min(times * 200, 2000)
  });
  const keyFor = cartId => `${keyPrefix}${cartId}`;

  return {
    async create() {
      const cart = {
        id: randomUUID(),
        currency: "INR",
        items: [],
        total: 0
      };
      await redis.set(keyFor(cart.id), JSON.stringify(cart), "EX", ttlSeconds);
      return cart;
    },
    async get(cartId) {
      const value = await redis.get(keyFor(cartId));
      return value ? JSON.parse(value) : null;
    },
    async save(cart) {
      await redis.set(keyFor(cart.id), JSON.stringify(cart), "EX", ttlSeconds);
      return cart;
    },
    async close() {
      redis.disconnect();
    }
  };
}

function createCartStore(options = {}) {
  const redisUrl = options.redisUrl ?? process.env.REDIS_URL;
  return redisUrl
    ? createRedisStore({ ...options, redisUrl })
    : createMemoryStore();
}

module.exports = { createCartStore, createMemoryStore, createRedisStore };
