import { NextAuthOptions, getServerSession } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import AzureADProvider from 'next-auth/providers/azure-ad'

/**
 * NextAuth configuration options
 */
export const authOptions: NextAuthOptions = {
    session: {
        strategy: 'jwt',
    },
    providers: [
        ...(process.env.GOOGLE_CLIENT_ID ? [
            GoogleProvider({
                clientId: process.env.GOOGLE_CLIENT_ID!,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
                allowDangerousEmailAccountLinking: true,
            })
        ] : []),
        ...(process.env.GITHUB_CLIENT_ID ? [
            GitHubProvider({
                clientId: process.env.GITHUB_CLIENT_ID!,
                clientSecret: process.env.GITHUB_CLIENT_SECRET!,
                allowDangerousEmailAccountLinking: true,
            })
        ] : []),
        ...(process.env.NEXT_PUBLIC_AZURE_CLIENT_ID ? [
            AzureADProvider({
                clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!,
                clientSecret: process.env.AZURE_CLIENT_SECRET!, // This one is sensitive
                tenantId: process.env.NEXT_PUBLIC_AZURE_TENANT_ID!,
                allowDangerousEmailAccountLinking: true,
            })
        ] : []),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async jwt({ token, account, profile }) {
            if (account) {
                token.provider = account.provider
                token.accessToken = account.access_token
            }
            if (profile && typeof profile === 'object') {
                const anyProfile = profile as Record<string, any>
                token.name = token.name || anyProfile.name
                token.picture = token.picture || anyProfile.picture || anyProfile.avatar_url
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub!
                session.user.name = token.name as string | undefined
                session.user.image = (token.picture as string | undefined) || session.user.image
                    // Expose provider for UI if needed
                    ; (session as any).provider = token.provider
            }
            return session
        },
    },
    pages: {
        signIn: '/login',
        error: '/login', // Error code passed in query string as ?error=
    },
}

/**
 * Utility to get the current session in server-side components and API routes
 */
export const getSession = () => getServerSession(authOptions)
