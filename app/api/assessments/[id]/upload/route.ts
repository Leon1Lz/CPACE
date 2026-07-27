import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"


export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user || user.role === "LEARNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    // Safe filename sanitization
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_ ]/g, "").replace(/\s+/g, "_")
    const filename = `${id}-${Date.now()}-${sanitizedName}`
    
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
