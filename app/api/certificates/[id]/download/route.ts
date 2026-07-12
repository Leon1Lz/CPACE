import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { renderToStream } from "@react-pdf/renderer"
import { CertificateDocument } from "@/components/pdf/certificate-document"
import React from "react"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const { id } = await params

    const cert = await prisma.certificate.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        course: { select: { title: true, category: true } },
      },
    })

    if (!cert) return NextResponse.json({ error: "Certificate not found" }, { status: 404 })

    // Only allow the owner or admin to download
    if (cert.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const certData = {
      ...cert,
      course: { ...cert.course, category: cert.course.category ?? "" },
    }
    const stream = await renderToStream(
      React.createElement(CertificateDocument, { cert: certData }) as any
    )

    const chunks: Uint8Array[] = []
    for await (const chunk of stream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="CPACE-Certificate-${cert.certificateNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Certificate download error:", error)
    return NextResponse.json({ error: "Failed to generate certificate" }, { status: 500 })
  }
}
