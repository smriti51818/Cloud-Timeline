import { NextResponse } from 'next/server'
import { getUserByEmail, updateUser } from '@/lib/azure-cosmos'
import { generateSecureToken, hashToken } from '@/lib/security-utils'

/**
 * POST /api/auth/password-reset-request
 * Enumeration-resistant reset request flow.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email } = body

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        const user = await getUserByEmail(email)

        // Always return generic success message to prevent user enumeration
        const genericResponse = { 
            message: 'If an account exists with this email, a password reset link has been sent.' 
        }

        if (user) {
            // Generate reset token (15 minute expiry)
            const rawToken = generateSecureToken(32)
            const hashedToken = hashToken(rawToken)
            const expiry = new Date()
            expiry.setMinutes(expiry.getMinutes() + 15)

            await updateUser(email, {
                resetToken: hashedToken,
                resetTokenExpiry: expiry.toISOString(),
            })

            // In a real app, send actual reset email here.
            if (process.env.NODE_ENV === 'development') {
                console.log(`[AUTH] Password Reset Token for ${email}: ${rawToken}`)
            }
        }

        return NextResponse.json(genericResponse, { status: 200 })

    } catch (error) {
        console.error('[AUTH] Reset request failed:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
