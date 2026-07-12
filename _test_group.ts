import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
async function main() {
  const user = await prisma.user.findFirst({ where: { role: "ADMIN" } })
  console.log("Admin:", user?.id, user?.email)
  if (!user) { console.log("NO ADMIN FOUND"); return }
  const g = await prisma.group.create({ data: { name: "Test Group", creatorId: user.id } })
  console.log("Group created:", g.id)
  await prisma.group.delete({ where: { id: g.id } })
  console.log("Cleaned up OK")
}
main().catch(e => console.error("ERROR:", e.message)).finally(() => prisma.$disconnect())
