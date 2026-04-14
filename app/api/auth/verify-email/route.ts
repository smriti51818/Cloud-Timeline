import { NextResponse } from 'next/server'
import { getUserByEmail, updateUser } from '@/lib/azure-cosmos'
import { hashToken, slowEquals } from '@/lib/security-utils'
import { validateEmail, sanitizeString } from '@/lib/validation'
import { validateCsrf } from '@/lib/csrf'

/**
 * POST /api/auth/verify-email
 * Single-use, time-limited email verification token processing.
 */
export async function POST(request: Request) {
    try {
        validateCsrf()
        const body = await request.json()
        const email = validateEmail(body.email)
        const token = sanitizeString(body.token, 100)

        const user = await getUserByEmail(email)

        if (!user || !user.verifyToken) {
            // Enumeration protection: return generic message even if user doesn't exist
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
        }

        // Check if token is expired (24h)
        const expiry = new Date(user.verifyTokenExpiry)
        if (expiry < new Date()) {
            return NextResponse.json({ error: 'Verification token has expired' }, { status: 400 })
        }

        // Constant-time hash comparison
        const hashedInput = hashToken(token)
        const isMatch = slowEquals(hashedInput, user.verifyToken)

        if (!isMatch) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
        }

        // Token is valid and single-use: clear it and mark email as verified
        await updateUser(email, {
            emailVerified: new Date().toISOString(),
            verifyToken: null,
            verifyTokenExpiry: null,
        })

        return NextResponse.json({ 
            message: 'Email verified successfully. You can now log in.' 
        }, { status: 200 })

    } catch (error) {
        console.error('[AUTH] Email verification failed:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
