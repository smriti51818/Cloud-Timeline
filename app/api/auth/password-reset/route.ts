import { NextResponse } from 'next/server'
import { getUserByEmail, updateUser } from '@/lib/azure-cosmos'
import { hashPassword } from '@/lib/password-utils'
import { hashToken, slowEquals } from '@/lib/security-utils'
import { invalidateAllSessions } from '@/lib/session-service'
import { validateEmail, validatePassword, sanitizeString } from '@/lib/validation'
import { validateCsrf } from '@/lib/csrf'

/**
 * POST /api/auth/password-reset
 * Finalizes password reset using token and invalidates all sessions.
 */
export async function POST(request: Request) {
    try {
        validateCsrf()
        const body = await request.json()
        const email = validateEmail(body.email)
        const token = sanitizeString(body.token, 100)
        const newPassword = validatePassword(body.newPassword)

        const user = await getUserByEmail(email)

        if (!user || !user.resetToken) {
            return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
        }

        // Check if token is expired (15m)
        const expiry = new Date(user.resetTokenExpiry)
        if (expiry < new Date()) {
            return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 })
        }

        // Constant-time hash comparison
        const hashedInput = hashToken(token)
        const isMatch = slowEquals(hashedInput, user.resetToken)

        if (!isMatch) {
            return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
        }

        // Valid token: Update password and invalidate ALL user sessions
        const newHashedPassword = await hashPassword(newPassword)
        
        await updateUser(email, {
            password: newHashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
        })

        // Breach protection: kill all sessions for this user ID
        await invalidateAllSessions(user.id)

        return NextResponse.json({ 
            message: 'Password reset successful. All active sessions have been invalidated.' 
        }, { status: 200 })

    } catch (error) {
        console.error('[AUTH] Password reset failed:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
