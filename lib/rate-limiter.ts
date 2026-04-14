/**
 * Rate Limiter - Sliding Window implementation.
 * Uses in-memory storage. For production, this should be replaced with Redis.
 */

interface RateLimitRecord {
    count: number
    resetTime: number
}

const memoryStore = new Map<string, RateLimitRecord>()

interface RateLimitOptions {
    limit: number
    windowMs: number
}

/**
 * Check if the request exceeds the rate limit
 * Returns { success: boolean, retryAfter: number }
 */
export async function checkRateLimit(key: string, options: RateLimitOptions) {
    const now = Date.now()
    const record = memoryStore.get(key)

    if (!record || now > record.resetTime) {
        // First request or window expired
        memoryStore.set(key, {
            count: 1,
            resetTime: now + options.windowMs
        })
        return { success: true, retryAfter: 0 }
    }

    if (record.count >= options.limit) {
        return { 
            success: false, 
            retryAfter: Math.ceil((record.resetTime - now) / 1000) 
        }
    }

    record.count++
    return { success: true, retryAfter: 0 }
}

/**
 * Cleanup expired records to prevent memory leak
 */
setInterval(() => {
    const now = Date.now()
    memoryStore.forEach((record, key) => {
        if (now > record.resetTime) {
            memoryStore.delete(key)
        }
    })
}, 15 * 60 * 1000) // Cleanup every 15 mins
