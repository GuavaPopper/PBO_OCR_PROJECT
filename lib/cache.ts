import { Redis } from "@upstash/redis"

// Initialize Redis client if REDIS_URL is provided
const redis = process.env.REDIS_URL
  ? new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN || "",
    })
  : null

export async function getCachedData<T>(key: string): Promise<T | null> {
  if (!redis) return null

  try {
    const data = await redis.get(key)
    return data as T
  } catch (error) {
    console.error("Error getting cached data:", error)
    return null
  }
}

export async function setCachedData<T>(key: string, data: T, expirationInSeconds = 3600): Promise<void> {
  if (!redis) return

  try {
    await redis.set(key, data, { ex: expirationInSeconds })
  } catch (error) {
    console.error("Error setting cached data:", error)
  }
}

export async function invalidateCache(key: string): Promise<void> {
  if (!redis) return

  try {
    await redis.del(key)
  } catch (error) {
    console.error("Error invalidating cache:", error)
  }
}
