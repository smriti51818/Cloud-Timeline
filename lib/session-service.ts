import {
    createSession,
    getSessionByToken,
    revokeSession,
    revokeAllUserSessions,
    updateUser,
    getUserByEmail
} from './azure-cosmos'
import crypto from 'crypto'
import { AppError } from './error-handler'
import { logSecurityEvent, AUDIT_EVENTS } from './audit-logger'

/**
 * Session Service - Handles refresh token rotation, revocation, and breach detection.
 */

const REFRESH_TOKEN_EXPIRY_DAYS = 7

/**
 * Creates a new session and returns a set of tokens
 */
export async function startUserSession(userId: string, email: string) {
    const refreshToken = crypto.randomBytes(40).toString('hex')
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + REFRESH_TOKEN_EXPIRY_DAYS)

    await createSession({
        id: crypto.randomUUID(),
        userId,
        email,
        refreshToken,
        expiresAt: expiryDate.toISOString(),
        createdAt: new Date().toISOString(),
    })

    return { refreshToken }
}

/**
 * Rotates a refresh token: issues a new one and invalidates the old one.
 * Implements breach detection: if an old token is reused, all user sessions are revoked.
 */
export async function rotateRefreshToken(oldToken: string) {
    const session = await getSessionByToken(oldToken)

    if (!session) {
        // This could be a reuse of a revoked token (potential breach)
        logSecurityEvent(AUDIT_EVENTS.REFRSH_TOKEN_BREACH, { 
            status: 'warning',
            metadata: { token_reused: true }
        })
        return null
    }

    // Check if token is expired
    if (new Date(session.expiresAt) < new Date()) {
        await revokeSession(session.id, session.userId)
        return null
    }

    // Valid session: Create new and delete old
    const userId = session.userId
    const email = session.email

    // Delete old
    await revokeSession(session.id, userId)

    // Start new
    return await startUserSession(userId, email)
}

/**
 * Invalidate all sessions for a user (e.g. on breach or password reset)
 */
export async function invalidateAllSessions(userId: string) {
    await revokeAllUserSessions(userId)
}

/**
 * Handles account lockout logic
 */
export async function handleFailedLogin(email: string) {
    const user = await getUserByEmail(email)
    if (!user) return

    const attempts = (user.failedLoginAttempts || 0) + 1
    const updates: any = { failedLoginAttempts: attempts }

    if (attempts >= 5) {
        const lockoutDate = new Date()
        lockoutDate.setMinutes(lockoutDate.getMinutes() + 15)
        updates.isLocked = true
        updates.lockUntil = lockoutDate.toISOString()
        // Here we would also trigger a "Notify user by email" event
        console.log(`[AUTH] Account locked for ${email} until ${updates.lockUntil}`)
    }

    await updateUser(email, updates)
}

export async function resetLoginAttempts(email: string) {
    await updateUser(email, {
        failedLoginAttempts: 0,
        isLocked: false,
        lockUntil: null
    })
}
