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

        const normalizedEmail = credentials.email.trim().toLowerCase()

        if (!prisma) {
          console.error('Prisma client not available for authentication')
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: normalizedEmail
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
      } else if (typeof token.userId === "string" && token.userId.length > 0) {
        // Only run check on subsequent requests to avoid redundant DB query at login
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.userId as string },
            select: { activeSessionToken: true, isActive: true, email: true, firstName: true, lastName: true, role: true }
          })
          if (!dbUser || !dbUser.isActive) {
            token.error = "UserSuspended"
          } else if (dbUser.activeSessionToken !== token.sessionToken) {
            token.error = "SessionExpired"
          } else {
            token.email = dbUser.email
            token.name = `${dbUser.firstName} ${dbUser.lastName}`
            token.role = dbUser.role
          }
        } catch (error) {
          console.error("Error verifying active session token:", error)
          // A session whose revocation state cannot be verified must fail closed.
          token.error = "SessionVerificationFailed"
        }
      } else {
        token.error = "SessionVerificationFailed"
      }
      return token
    },
    async session({ session, token }) {
      if (token.error || typeof token.userId !== "string" || !token.userId) {
        // A revoked or suspended JWT must not remain an authenticated server
        // session. Protected API routes already reject a null session.
        return null as unknown as typeof session
      }
      if (token) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
        session.user.email = token.email ?? ""
        session.user.name = token.name ?? ""
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  }
}
