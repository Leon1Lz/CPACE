import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  console.log('Admin:', user?.id, user?.email)
  if (!user) { console.log('NO ADMIN FOUND'); return }
  const g = await prisma.group.create({ data: { name: 'Test Group', creatorId: user.id } })
  console.log('Group created:', g.id)
  await prisma.group.delete({ where: { id: g.id } })
  console.log('Cleaned up OK')
}
main().catch(e => console.error('ERROR:', e.message, e.code)).finally(() => prisma.$disconnect())
