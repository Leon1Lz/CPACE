import { prisma } from "@/lib/prisma"

type AuditActor = { id: string; firstName: string; lastName: string; email: string }

export async function recordStaffAudit(actor: AuditActor, action: string, details: string, category = "STAFF") {
  try {
    if (!prisma.auditLog?.create) return null
    return await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorName: `${actor.firstName} ${actor.lastName}`.trim(),
        actorEmail: actor.email,
        action,
        category,
        details,
      },
    })
  } catch (error) {
    console.error("Audit log write failed:", error)
    return null
  }
}
