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
          where: { email: credentials.email }
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const isValidPassword = await comparePassword(credentials.password, user.passwordHash)
        if (!isValidPassword) {
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
    maxAge: 60 * 60, // 1 hour
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60, // 1 hour
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
    jwt: async ({ token, user }) => {
      // Store user ID in token for session access
      if (user) {
        token.userId = user.id
      }

      // Always fetch latest user data for the token if we have a userId
      if (token.userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId as string },
          select: { emailVerified: true, role: true }
        })
        token.emailVerified = dbUser?.emailVerified
        token.role = dbUser?.role || 'USER'
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