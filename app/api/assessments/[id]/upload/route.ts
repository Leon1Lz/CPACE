import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import crypto from "crypto"
import { canManageAssessment } from "@/lib/authorization"
import { isAllowedAssessmentMaterial } from "@/lib/assessment-upload"

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    if (!(await canManageAssessment(user, id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "File must be between 1 byte and 10 MB" }, { status: 413 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const extension = file.name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? ""
    if (!isAllowedAssessmentMaterial(buffer, extension, file.type)) {
      return NextResponse.json({ error: "Unsupported or invalid file type" }, { status: 415 })
    }
    const filename = `${id}-${crypto.randomUUID()}${extension}`
    
    // Ensure public/uploads directory exists
    const uploadDir = join(process.cwd(), "public", "uploads")
    await mkdir(uploadDir, { recursive: true })
    
    // Save file
    const filePath = join(uploadDir, filename)
    await writeFile(filePath, buffer)
    
    const materialUrl = `/uploads/${filename}`

    // Update assessment database record
    const updated = await prisma.assessment.update({
      where: { id },
      data: {
        materialUrl,
        materialName: file.name
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
