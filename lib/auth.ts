import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        if (!prisma) {
          console.error('Prisma client not available for authentication')
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.isActive) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        // Generate a new unique session token
        const sessionToken = crypto.randomUUID()

        // Update the user's active session token in the database
        await prisma.user.update({
          where: { id: user.id },
          data: { activeSessionToken: sessionToken }
        })

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          sessionToken,
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.userId = user.id
        token.sessionToken = (user as any).sessionToken
      } else if (token.userId) {
        // Only run check on subsequent requests to avoid redundant DB query at login
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.userId as string },
            select: { activeSessionToken: true }
          })
          if (!dbUser || dbUser.activeSessionToken !== token.sessionToken) {
            token.error = "SessionExpired"
          }
        } catch (error) {
          console.error("Error verifying active session token:", error)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
        if (token.error) {
          (session as any).error = token.error
        }
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  }
}
