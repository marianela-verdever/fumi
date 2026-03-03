import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Lazy-init so the app still builds without Upstash env vars
let redis: Redis | null = null;

function getRedis() {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;
    redis = new Redis({ url, token });
  }
  return redis;
}

/**
 * Chat endpoint: 30 requests per 60 seconds per user
 */
export function getChatLimiter() {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(30, "60 s"),
    prefix: "rl:chat",
  });
}

/**
 * Chapter generation: 10 requests per 60 seconds per user
 */
export function getChapterLimiter() {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    prefix: "rl:chapter",
  });
}
