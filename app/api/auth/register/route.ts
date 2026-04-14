import { NextResponse } from 'next/server'
import { createUser, getUserByEmail } from '@/lib/azure-cosmos'
import { hashPassword } from '@/lib/password-utils'
import { generateSecureToken, hashToken } from '@/lib/security-utils'
import { validateRegistration } from '@/lib/validation'
import { validateCsrf } from '@/lib/csrf'
import crypto from 'crypto'

/**
 * POST /api/auth/register
 * Secure registration flow with email verification token generation.
 */
export async function POST(request: Request) {
    try {
        validateCsrf()
        const rawBody = await request.json()
        const { email, password, name } = validateRegistration(rawBody)

        // Check if user already exists
        const existingUser = await getUserByEmail(email)
        if (existingUser) {
            // Return generic success to prevent user enumeration if requested, 
            // but usually for registration we inform if email is taken.
            return NextResponse.json({ error: 'User already exists' }, { status: 409 })
        }

        // Hash password with Argon2id
        const hashedPassword = await hashPassword(password)

        // Generate email verification token (32 bytes)
        const rawToken = generateSecureToken(32)
        const hashedToken = hashToken(rawToken)
        const tokenExpiry = new Date()
        tokenExpiry.setHours(tokenExpiry.getHours() + 24)

        const newUser = await createUser({
            id: crypto.randomUUID(),
            email,
            name,
            password: hashedPassword,
            emailVerified: null,
            verifyToken: hashedToken,
            verifyTokenExpiry: tokenExpiry.toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        // In a real app, we would send the rawToken via email here.
        // For this audit, we'll log it in development (DO NOT LOG IN PROD)
        if (process.env.NODE_ENV === 'development') {
            console.log(`[AUTH] Verification Token for ${email}: ${rawToken}`)
        }

        return NextResponse.json({ 
            message: 'Registration successful. Please check your email to verify your account.',
            userId: newUser.id 
        }, { status: 201 })

    } catch (error) {
        console.error('[AUTH] Registration failed:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
