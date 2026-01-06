import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { comparePassword } from '@/lib/auth'

export const authOptions: NextAuthOptions = {
  debug: false, // Disable debug mode to reduce console output
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

        const isPasswordValid = await comparePassword(
          credentials.password,
          user.passwordHash
        )

        if (!isPasswordValid) {
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
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session once per day
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60, // 1 day
      },
    },
  },
  callbacks: {
    jwt: async ({ user, token, account }) => {
      console.log('JWT Callback:', { 
        hasUser: !!user,
        hasAccount: !!account,
        provider: account?.provider,
        userEmail: user?.email,
        tokenUserId: token?.userId
      })
      
      // On sign in, populate token with user data
      if (user && account) {
        console.log('Sign in detected, setting token data')
        
        if (account.provider === 'google' && user.email) {
          try {
            // Find or create user in database
            let dbUser = await prisma.user.findUnique({
              where: { email: user.email }
            })

            if (!dbUser) {
              console.log('Creating new Google user:', user.email)
              dbUser = await prisma.user.create({
                data: {
                  email: user.email,
                  name: user.name || null,
                  image: user.image || null,
                  emailVerified: new Date(),
                }
              })
            } else {
              console.log('Updating existing Google user:', user.email)
              dbUser = await prisma.user.update({
                where: { id: dbUser.id },
                data: {
                  name: user.name || dbUser.name,
                  image: user.image || dbUser.image,
                  emailVerified: new Date(),
                }
              })
            }

            // Set token with database user data
            token.userId = dbUser.id
            token.email = dbUser.email
            token.name = dbUser.name || undefined
            token.picture = dbUser.image || undefined
            return token
          } catch (error) {
            console.error('Database error in JWT callback:', error)
            return token
          }
        } else if (account.provider === 'credentials') {
          // For credentials login, user object comes from authorize function
          token.userId = user.id
          token.email = user.email
          token.name = user.name || undefined
          token.picture = user.image || undefined
          return token
        }
      }
      
      // Return existing token for subsequent requests
      console.log('Returning token with userId:', token.userId)
      return token
    },
    session: async ({ session, token }) => {
      console.log('Session Callback:', { 
        tokenUserId: token?.userId,
        sessionUser: session?.user
      })
      
      // Only populate session if we have a valid userId in token
      if (token?.userId) {
        session.user = {
          id: token.userId,
          email: token.email || '',
          name: token.name || '',
          image: token.picture || '',
        }
        
        console.log('Session created with user:', session.user)
      } else {
        console.error('No userId in JWT token - session invalid')
      }
      
      return session
    },
    redirect: async ({ url, baseUrl }) => {
      console.log('Redirect Callback - Processing:', { url, baseUrl })
      
      // Handle error redirects
      if (url.includes('/api/auth/error') || url.includes('error=')) {
        console.log('Auth error detected, redirecting to login')
        return `${baseUrl}/login`
      }
      
      // If it's a relative URL that starts with /, prepend baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      
      // If it's already a full URL and same origin, allow it
      if (url.startsWith(baseUrl)) {
        return url
      }
      
      // Default fallback
      return `${baseUrl}/dashboard`
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}