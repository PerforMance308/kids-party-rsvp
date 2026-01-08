import NextAuth, { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      emailVerified?: Date | null
    } & DefaultSession['user']
  }

  interface User {
    id: string
    emailVerified?: Date | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string
    emailVerified?: Date | null | string
  }
}