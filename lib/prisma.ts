import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL must be configured in the server environment")
}

const createPrismaClient = () => {
  const pool = new Pool({
    connectionString: databaseUrl,
    // Require a certificate trusted by the runtime instead of accepting any
    // server certificate, which would make database traffic vulnerable to MITM.
    ssl: { rejectUnauthorized: true },
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
