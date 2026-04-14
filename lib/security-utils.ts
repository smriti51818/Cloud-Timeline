import crypto from 'crypto'

/**
 * Common security utilities for tokens and hashing
 */

/**
 * Generate a cryptographically secure random token
 */
export function generateSecureToken(bytes = 32): string {
    return crypto.randomBytes(bytes).toString('hex')
}

/**
 * Generate a SHA-256 hash of a token for storage
 */
export function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function slowEquals(a: string, b: string): boolean {
    if (!a || !b || a.length !== b.length) return false
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}
