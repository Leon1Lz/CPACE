import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be configured in the server environment")
  }
  const pool = new Pool({
    connectionString: databaseUrl,
    // Supabase pooled connections require rejectUnauthorized: false in Node.js pg
    ssl: { rejectUnauthorized: false },
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

// Lazy singleton — only instantiated on first property access, not at module load.
// This prevents Next.js build-time static analysis from throwing when DATABASE_URL
// is not available in the build environment.
function getPrisma(): PrismaClient {
  if (
    !globalForPrisma.prisma ||
    typeof (globalForPrisma.prisma as unknown as Record<string, unknown>).certificationProgram === "undefined"
  ) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrisma() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
