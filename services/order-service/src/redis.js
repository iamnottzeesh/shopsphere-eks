import { createClient } from "redis";

const redisUrl =
  process.env.ORDER_REDIS_URL ??
  process.env.TEST_REDIS_URL ??
  "redis://127.0.0.1:6379/1";

export const redis = createClient({
  url: redisUrl
});

export async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
  }
}

export async function closeRedis() {
  if (redis.isOpen) {
    await redis.disconnect();
  }
}
