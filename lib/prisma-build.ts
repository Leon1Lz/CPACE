// Build-time Prisma client wrapper
import { PrismaClient } from '@prisma/client'

// This is a build-safe version that doesn't initialize during build
let prismaInstance: PrismaClient | null = null

export const getPrismaClient = () => {
  if (!prismaInstance && process.env.NODE_ENV !== 'production' && process.env.DATABASE_URL) {
    prismaInstance = new PrismaClient()
  }
  return prismaInstance
}

export const prisma = getPrismaClient()
