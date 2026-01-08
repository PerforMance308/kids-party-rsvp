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
    jwt: async ({ token, user }) => {
      // Store user ID in token for session access
      if (user) {
        token.userId = user.id
      }

      // Always fetch latest emailVerified status for the token if we have a userId
      if (token.userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId as string },
          select: { emailVerified: true }
        })
        token.emailVerified = dbUser?.emailVerified
        console.log(`[AUTH DEBUG] JWT Callback - User: ${token.userId}, emailVerified:`, token.emailVerified)
      }

      return token
    },
    session: async ({ session, token }) => {
      // Add user ID and verification status to session from token
      if (session?.user) {
        if (token?.userId) {
          session.user.id = token.userId as string
        }
        session.user.emailVerified = token.emailVerified as any
        console.log(`[AUTH DEBUG] Session Callback - User: ${session.user.id}, emailVerified:`, session.user.emailVerified)
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}