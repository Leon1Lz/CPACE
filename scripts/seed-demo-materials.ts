import "dotenv/config"
import { prisma } from "../lib/prisma"
import { demoPrograms } from "../data/demo-programs"
import { buildDemoCourse } from "../lib/demo-materials"

async function main() {
  const owner = await prisma.user.findUnique({ where: { email: "admin@cpace.ph" }, select: { id: true, role: true, isActive: true } })
  if (!owner || owner.role !== "ADMIN" || !owner.isActive) throw new Error("An active primary admin is required; no accounts were created.")
  const courses = demoPrograms.map(program => buildDemoCourse(program, owner.id))
  const created = await prisma.$transaction(async tx => {
    let count = 0
    for (const course of courses) {
      const existing = await tx.course.findUnique({ where: { id: course.id }, select: { creatorId: true, title: true } })
      if (existing) {
        if (existing.creatorId !== owner.id || !existing.title.startsWith("[DEMO]")) throw new Error("Demo identifier collision; transaction cancelled.")
        continue // Preserve all edits and publication decisions on subsequent runs.
      }
      await tx.course.create({ data: course })
      count++
    }
    if (count) await tx.auditLog.create({ data: {
      actorId: owner.id, action: "DEMO_MATERIALS_CREATE", category: "SYSTEM",
      details: JSON.stringify({ createdCourses: count, programs: demoPrograms.map(program => program.code), status: "DRAFT" }),
    } })
    return count
  }, { timeout: 120000 })
  const saved = await prisma.course.findMany({
    where: { id: { in: courses.map(course => course.id!) } },
    select: { title: true, status: true, _count: { select: { modules: true, enrollments: true } }, assessments: { select: { type: true, isPublished: true, _count: { select: { questions: true } } } } },
  })
  console.log(JSON.stringify({ created, preserved: courses.length - created, courses: saved }, null, 2))
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : "Demo material setup failed")
  process.exitCode = 1
}).finally(async () => {
  await prisma.$disconnect()
  process.exit(process.exitCode ?? 0)
})
