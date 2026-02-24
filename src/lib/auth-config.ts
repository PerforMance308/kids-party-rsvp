import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { comparePassword } from '@/lib/auth'

export const authOptions: NextAuthOptions = {
  debug: false,
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Required: users who registered via email/password can also sign in with
      // Google using the same address. Safe for Google because Google verifies
      // email ownership — only the real account holder can authenticate.
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() }
        })

        // Always run bcrypt compare to prevent timing attacks that reveal
        // whether an email exists. Use a dummy hash when user is not found.
        const dummyHash = '$2a$12$000000000000000000000000000000000000000000000000000000'
        const hashToCompare = user?.passwordHash || dummyHash
        const isValidPassword = await comparePassword(credentials.password, hashToCompare)

        if (!user || !user.passwordHash || !isValidPassword) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      },
    },
  },
  callbacks: {
    signIn: async ({ user, account, profile }) => {
      // If the user is signing in with Google, mark email as verified
      if (account?.provider === 'google' && (profile as any)?.email_verified && user.email) {
        try {
          // Use upsert to handle both new and existing users
          await prisma.user.upsert({
            where: { email: user.email },
            update: { emailVerified: new Date() },
            create: {
              email: user.email,
              name: user.name || profile?.name || null,
              image: user.image || (profile as any)?.picture || null,
              emailVerified: new Date(),
            }
          })
        } catch (error) {
          // Ignore errors - adapter will handle user creation
        }
      }
      return true
    },
    jwt: async ({ token, user, trigger }) => {
      // Store user ID in token on initial sign-in
      if (user) {
        token.userId = user.id
        // Fetch role and emailVerified on sign-in
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { emailVerified: true, role: true }
        })
        token.emailVerified = dbUser?.emailVerified
        token.role = dbUser?.role || 'USER'
        token.lastRefresh = Date.now()
        return token
      }

      // Force refresh when session.update() is called (e.g. after email verification)
      const forceRefresh = trigger === 'update'

      // Refresh user data every 5 minutes or on forced update
      const REFRESH_INTERVAL = 5 * 60 * 1000
      const lastRefresh = (token.lastRefresh as number) || 0
      if (token.userId && (forceRefresh || Date.now() - lastRefresh > REFRESH_INTERVAL)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId as string },
          select: { emailVerified: true, role: true }
        })
        token.emailVerified = dbUser?.emailVerified
        token.role = dbUser?.role || 'USER'
        token.lastRefresh = Date.now()
      }

      return token
    },
    session: async ({ session, token }) => {
      // Add user ID, verification status, and role to session from token
      if (session?.user) {
        if (token?.userId) {
          session.user.id = token.userId as string
        }
        session.user.emailVerified = token.emailVerified as any
        session.user.role = token.role as any
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}