import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { prisma } from "./prisma"

const providers: NextAuthOptions["providers"] = [
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
]

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.unshift(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  )
}

const vercelProductionDomain = "https://cpace-three.vercel.app"
if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.includes("localhost")) {
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    process.env.NEXTAUTH_URL = vercelProductionDomain
  }
}
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = "http://localhost:3000"
}

export const authOptions: NextAuthOptions = {
  providers,
  secret: process.env.NEXTAUTH_SECRET || "miY07Ku2Y7H5lfMoWe4OMTlp+y51+r488AI95NrdoNU=",
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const email = user.email?.toLowerCase().trim()
        if (!email) {
          return "/login?error=InvalidEmail"
        }

        if (!prisma) {
          console.error("Prisma client not available for Google authentication")
          return false
        }

        // 1. Check if user already exists in database
        const existingUser = await prisma.user.findUnique({
          where: { email },
        })

        if (existingUser) {
          if (!existingUser.isActive) {
            return "/login?error=UserSuspended"
          }
          // Update avatar if not already set
          if (!existingUser.avatar && user.image) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { avatar: user.image },
            }).catch(() => null)
          }
          return true
        }

        // 2. Check if email is whitelisted in pre-approved list
        const preApproved = await prisma.preApprovedEmail.findUnique({
          where: { email },
        })

        if (!preApproved) {
          return "/login?error=NotPreApproved"
        }

        // 3. User is pre-approved: auto-create account with assigned role
        const googleProfile = profile as any
        const firstName =
          googleProfile?.given_name ||
          (user.name ? user.name.split(" ")[0] : "Learner")
        const lastName =
          googleProfile?.family_name ||
          (user.name && user.name.split(" ").length > 1
            ? user.name.split(" ").slice(1).join(" ")
            : "")

        const randomPassword = crypto.randomBytes(32).toString("hex")
        const hashedPassword = await bcrypt.hash(randomPassword, 12)

        await prisma.user.create({
          data: {
            email,
            firstName: firstName.trim() || "Learner",
            lastName: lastName.trim(),
            avatar: user.image || null,
            password: hashedPassword,
            role: preApproved.role,
          },
        })

        // Consume the pre-approved email record
        await prisma.preApprovedEmail.delete({
          where: { id: preApproved.id },
        }).catch(() => null)

        return true
      }

      return true
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && token.email) {
        try {
          const normalizedEmail = token.email.toLowerCase().trim()
          const dbUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: { id: true, role: true, email: true, firstName: true, lastName: true, isActive: true },
          })

          if (!dbUser || !dbUser.isActive) {
            token.error = "UserSuspended"
          } else {
            const sessionToken = crypto.randomUUID()
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { activeSessionToken: sessionToken },
            })
            token.userId = dbUser.id
            token.role = dbUser.role
            token.sessionToken = sessionToken
            token.email = dbUser.email
            token.name = `${dbUser.firstName} ${dbUser.lastName}`.trim()
          }
        } catch (error) {
          console.error("Error setting up Google session in jwt callback:", error)
          token.error = "SessionVerificationFailed"
        }
      } else if (user) {
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
    error: "/login",
  }
}
