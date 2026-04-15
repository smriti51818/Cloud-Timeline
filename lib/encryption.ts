import crypto from 'crypto'
import { AppError } from './error-handler'

/**
 * Encryption Service - Provides field-level encryption using AES-256-GCM.
 * Even if the database is compromised, user data remains unreadable.
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

/**
 * Get the master encryption key from environment variables.
 * Key must be 32 bytes (256 bits).
 */
function getEncryptionKey(): Buffer {
    const key = process.env.MASTER_ENCRYPTION_KEY
    if (!key) {
        console.error('[ENCRYPTION] MASTER_ENCRYPTION_KEY is MISSING in process.env')
        throw new AppError('MASTER_ENCRYPTION_KEY is not defined', 500, 'ENCRYPTION_ERROR')
    }
    console.log(`[ENCRYPTION] Found key in env, string length: ${key.length}`)

    try {
        const trimmedKey = key.trim()
        const buffer = Buffer.from(trimmedKey, 'base64')
        if (buffer.length !== 32) {
            console.error(`[ENCRYPTION] Invalid key length: ${buffer.length} bytes (expected 32)`)
            throw new Error(`Key must be 32 bytes base64 encoded string (got ${buffer.length})`)
        }
        return buffer
    } catch (error: any) {
        console.error('[ENCRYPTION] Key parsing failed:', error.message)
        throw new AppError(`Invalid MASTER_ENCRYPTION_KEY format: ${error.message}`, 500, 'ENCRYPTION_ERROR')
    }
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Output format: base64(iv + authTag + ciphertext)
 */
export function encrypt(plaintext: string): string {
    if (!plaintext) return plaintext

    try {
        const key = getEncryptionKey()
        const iv = crypto.randomBytes(IV_LENGTH)
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

        let ciphertext = cipher.update(plaintext, 'utf8', 'base64')
        ciphertext += cipher.final('base64')

        const authTag = cipher.getAuthTag()

        const combined = Buffer.concat([
            iv,
            authTag,
            Buffer.from(ciphertext, 'base64')
        ])
        
        return combined.toString('base64')

    } catch (error: any) {
        console.error('[ENCRYPTION] Encrypt failed:', error.message)
        throw new AppError(`Data encryption failed: ${error.message}`, 500, 'ENCRYPTION_ERROR')
    }
}

/**
 * Decrypt a ciphertext string using AES-256-GCM.
 * Input format: base64(iv + authTag + ciphertext)
 */
export function decrypt(encryptedData: string): string {
    if (!encryptedData) return encryptedData

    // Basic heuristic to skip decryption of plaintext (for migration safety)
    if (!isBase64(encryptedData)) return encryptedData

    try {
        const key = getEncryptionKey()
        const buffer = Buffer.from(encryptedData, 'base64')

        // Extract components
        if (buffer.length < IV_LENGTH + AUTH_TAG_LENGTH) {
            // Not a valid ciphertext, might be raw plaintext that looks like base64
            return encryptedData
        }

        const iv = buffer.subarray(0, IV_LENGTH)
        const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
        const ciphertext = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
        decipher.setAuthTag(authTag)

        let plaintext = decipher.update(ciphertext, undefined, 'utf8')
        plaintext += decipher.final('utf8')

        return plaintext

    } catch (error) {
        // If decryption fails, it might be plaintext that accidentally passed the check
        console.warn('[ENCRYPTION] Decrypt failed, returning original value:', error)
        return encryptedData
    }
}

/**
 * Utility to check if a string is Base64 (simple check)
 */
function isBase64(str: string): boolean {
    if (!str || typeof str !== 'string' || str.length % 4 !== 0) return false
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
    return base64Regex.test(str)
}
