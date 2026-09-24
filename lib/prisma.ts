import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const DEFAULT_DATABASE_URL = "postgresql://postgres.pvolxtlteuyjekiskkce:Nzw7PXfK4bryGSv7@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DEFAULT_DATABASE_URL
}
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = "postgresql://postgres.pvolxtlteuyjekiskkce:Nzw7PXfK4bryGSv7@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
}

const createPrismaClient = () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || DEFAULT_DATABASE_URL,
    // Enable SSL for Supabase connections.
    // Supabase pooled connections use custom certificates that require rejectUnauthorized: false
    ssl: { rejectUnauthorized: false },
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
