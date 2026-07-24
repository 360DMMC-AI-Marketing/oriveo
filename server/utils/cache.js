import IORedis from "ioredis";

let redis = null;

export function initCache() {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    redis = new IORedis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });
    redis.on("error", () => {});
    redis.connect().catch(() => {});
    return redis;
  } catch {
    return null;
  }
}

export async function cacheGet(key) {
  if (!redis) return null;
  try {
    const val = await redis.get(`cache:${key}`);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key, data, ttlSeconds = 60) {
  if (!redis) return;
  try {
    await redis.setex(`cache:${key}`, ttlSeconds, JSON.stringify(data));
  } catch {}
}

export async function cacheDel(pattern) {
  if (!redis) return;
  try {
    const keys = await redis.keys(`cache:${pattern}`);
    if (keys.length > 0) await redis.del(...keys);
  } catch {}
}

export function getRedis() {
  return redis;
}
