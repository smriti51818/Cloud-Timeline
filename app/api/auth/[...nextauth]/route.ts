import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'

const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID ? [GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    })] : []),
    ...(process.env.GITHUB_CLIENT_ID ? [GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    })] : []),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.provider = account.provider
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
        ;(session as any).provider = (token as any).provider
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }


