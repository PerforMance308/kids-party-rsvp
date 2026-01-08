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
    jwt: async ({ token, user, account }) => {
      // Store user ID in token for session access
      if (user && account) {
        if (account.provider === 'credentials') {
          token.userId = user.id
        } else if (account.provider === 'google') {
          // For Google OAuth, find or create user in database
          try {
            let dbUser = await prisma.user.findUnique({
              where: { email: user.email! }
            })
            
            if (!dbUser) {
              dbUser = await prisma.user.create({
                data: {
                  email: user.email!,
                  name: user.name,
                  image: user.image,
                  emailVerified: new Date(),
                }
              })
            }
            
            token.userId = dbUser.id
          } catch (error) {
            console.error('Database error in JWT callback:', error)
            // Return token even if database operation fails
            return token
          }
        }
      }
      return token
    },
    session: async ({ session, token }) => {
      // Add user ID to session from token
      if (token?.userId && session?.user) {
        session.user.id = token.userId as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}