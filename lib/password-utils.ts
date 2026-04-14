import argon2 from 'argon2'
import { AppError } from './error-handler'

/**
 * Password Security Utils
 * Implementation of Argon2id with specified parameters.
 */

// User-specified Argon2id parameters
const ARGON2_OPTIONS: argon2.Options & { type: number } = {
    memoryCost: 65536, // 64 MB (65536 KB)
    timeCost: 3,       // 3 iterations
    parallelism: 4,    // 4 threads
    type: argon2.argon2id // Argon2id variant
}

/**
 * Hash a password using Argon2id.
 * Never stores passwords in plaintext.
 */
export async function hashPassword(password: string): Promise<string> {
    if (!password) {
        throw new AppError('Password is required', 400, 'VALIDATION_ERROR')
    }

    try {
        return await argon2.hash(password, ARGON2_OPTIONS)
    } catch (error) {
        console.error('[AUTH] Password hashing failed:', error)
        throw new AppError('Failed to process password securely', 500, 'AUTH_ERROR')
    }
}

/**
 * Verify a password against a hash using constant-time comparison.
 * Prevents timing attacks.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) return false

    try {
        return await argon2.verify(hash, password)
    } catch (error) {
        console.error('[AUTH] Password verification failed:', error)
        return false
    }
}

/**
 * Helper to ensure sensitive data like passwords are never logged or returned to frontend.
 * This is a conceptual helper used during data sanitization.
 */
export function sanitizeUser(user: any) {
    if (!user) return null
    const { password, ...safeUser } = user
    return safeUser
}
