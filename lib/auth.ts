import { NextAuthOptions, getServerSession } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import AzureADProvider from 'next-auth/providers/azure-ad'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getUserByEmail, createUser, updateUser } from './azure-cosmos'
import { verifyPassword } from './password-utils'
import { startUserSession, rotateRefreshToken, invalidateAllSessions, handleFailedLogin, resetLoginAttempts } from './session-service'
import { AuthenticationError } from './error-handler'
import { logSecurityEvent, AUDIT_EVENTS } from './audit-logger'

/**
 * NextAuth configuration options - Hardened for Senior Security Standards
 */
export const authOptions: NextAuthOptions = {
    session: {
        strategy: 'jwt',
        maxAge: 15 * 60, // 15 minutes session expiry (standard spec requirement)
    },
    jwt: {
        maxAge: 15 * 60,
    },
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new AuthenticationError('Email and password required')
                }

                const user = await getUserByEmail(credentials.email)

                if (!user) {
                    // Do not reveal user existence - prevent enumeration
                    throw new AuthenticationError('Invalid credentials')
                }

                if (user.isLocked && new Date(user.lockUntil) > new Date()) {
                    throw new AuthenticationError(`Account locked until ${new Date(user.lockUntil).toLocaleTimeString()}`)
                }

                // Section 4 requirement: Block unverified accounts
                if (!user.emailVerified) {
                    throw new AuthenticationError('Please verify your email before logging in.')
                }

                const isValid = await verifyPassword(credentials.password, user.password!)

                if (!isValid) {
                    await handleFailedLogin(credentials.email)
                    logSecurityEvent(AUDIT_EVENTS.LOGIN_FAILURE, { 
                        email: credentials.email, 
                        status: 'failure',
                        metadata: { reason: 'invalid_password' }
                    })
                    throw new AuthenticationError('Invalid credentials')
                }

                // Reset failed attempts on success
                await resetLoginAttempts(credentials.email)
                
                logSecurityEvent(AUDIT_EVENTS.LOGIN_SUCCESS, { 
                    userId: user.id, 
                    email: user.email, 
                    status: 'success' 
                })

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                }
            }
        }),
        ...(process.env.GOOGLE_CLIENT_ID ? [
            GoogleProvider({
                clientId: process.env.GOOGLE_CLIENT_ID!,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
                allowDangerousEmailAccountLinking: true,
            })
        ] : []),
        ...(process.env.GITHUB_CLIENT_ID || process.env.GH_CLIENT_ID ? [
            GitHubProvider({
                clientId: (process.env.GITHUB_CLIENT_ID || process.env.GH_CLIENT_ID)!,
                clientSecret: (process.env.GITHUB_CLIENT_SECRET || process.env.GH_CLIENT_SECRET)!,
                allowDangerousEmailAccountLinking: true,
            })
        ] : []),
        ...(process.env.NEXT_PUBLIC_AZURE_CLIENT_ID ? [
            AzureADProvider({
                clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!,
                clientSecret: process.env.AZURE_CLIENT_SECRET!,
                tenantId: process.env.NEXT_PUBLIC_AZURE_TENANT_ID!,
                allowDangerousEmailAccountLinking: true,
            })
        ] : []),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async signIn({ user, account, profile }) {
            try {
                if (account?.provider === 'google' || account?.provider === 'github') {
                    if (!user.email) {
                        console.error('[AUTH] SignIn failed: No email provided by provider')
                        return false
                    }
                    
                    const existingUser = await getUserByEmail(user.email)
                    if (!existingUser) {
                        console.log(`[AUTH] Creating new OAuth user for ${user.email}`)
                        await createUser({
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            image: user.image,
                            emailVerified: new Date().toISOString(),
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        })
                    } else {
                        console.log(`[AUTH] Updating existing OAuth user for ${user.email}`)
                        await updateUser(user.email, {
                            name: user.name || existingUser.name,
                            image: user.image || existingUser.image,
                            updatedAt: new Date().toISOString(),
                        })
                    }
                }
                return true
            } catch (error) {
                console.error('[AUTH] SignIn callback error:', error)
                return false
            }
        },
        async jwt({ token, user, account }) {
            try {
                // Initial sign in
                if (account && user) {
                    const dbUser = await getUserByEmail(user.email!)
                    const userId = dbUser?.id || user.id

                    const { refreshToken } = await startUserSession(userId, user.email!)
                    return {
                        ...token,
                        accessToken: account.access_token,
                        refreshToken,
                        userId,
                        expiry: Math.floor(Date.now() / 1000) + (15 * 60)
                    }
                }

                // Return previous token if the access token has not expired yet
                if (Date.now() < (token.expiry as number * 1000)) {
                    return token
                }

                // Access token has expired, try to rotate it
                const result = await rotateRefreshToken(token.refreshToken as string)
                if (!result) {
                    if (token.userId) {
                        await invalidateAllSessions(token.userId as string)
                    }
                    return { ...token, error: 'RefreshAccessTokenError' }
                }

                return {
                    ...token,
                    refreshToken: result.refreshToken,
                    expiry: Math.floor(Date.now() / 1000) + (15 * 60)
                }
            } catch (error) {
                console.error('[AUTH] JWT callback error:', error)
                return { ...token, error: 'JWTCallbackError' }
            }
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.userId as string
                session.user.name = token.name as string | undefined
                ;(session as any).error = token.error
            }
            return session
        },
    },
    cookies: {
        sessionToken: {
            name: `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'strict',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
}

/**
 * Utility to get the current session in server-side components and API routes
 */
export const getSession = () => getServerSession(authOptions)
