import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Expected CSV columns:
// question, type, points, option_a, option_b, option_c, option_d, correct_answer
//
// type values: MULTIPLE_CHOICE | TRUE_FALSE | SHORT_ANSWER | ESSAY
// correct_answer: A | B | C | D  (for MC)  or  True | False  (for T/F)  or  empty (for open-ended)

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(l => l.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"))

  return lines.slice(1).map(line => {
    // Handle quoted commas inside fields
    const cols: string[] = []
    let current = ""
    let inQuotes = false
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes }
      else if (char === "," && !inQuotes) { cols.push(current.trim()); current = "" }
      else { current += char }
    }
    cols.push(current.trim())

    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = (cols[i] ?? "").replace(/^"|"$/g, "").trim() })
    return row
  })
}

function rowToQuestion(row: Record<string, string>, order: number) {
  const question = row["question"] ?? ""
  const rawType = (row["type"] ?? "MULTIPLE_CHOICE").toUpperCase().replace(/ /g, "_")
  const type = ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY"].includes(rawType)
    ? rawType as "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY"
    : "MULTIPLE_CHOICE" as const
  const points = parseFloat(row["points"] ?? "1") || 1
  const correct = (row["correct_answer"] ?? "").toUpperCase().trim()

  let options: { text: string; isCorrect: boolean; order: number }[] = []

  if (type === "MULTIPLE_CHOICE") {
    const labels = ["A", "B", "C", "D", "E"]
    const optKeys = ["option_a", "option_b", "option_c", "option_d", "option_e"]
    options = optKeys
      .map((key, i) => ({ text: row[key] ?? "", isCorrect: correct === labels[i], order: i + 1 }))
      .filter(o => o.text !== "")
  } else if (type === "TRUE_FALSE") {
    const isTrue = correct === "TRUE" || correct === "A"
    options = [
      { text: "True", isCorrect: isTrue, order: 1 },
      { text: "False", isCorrect: !isTrue, order: 2 },
    ]
  }

  return { question, type, points, order, options }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user || user.role === "LEARNER" || user.role === "PROCTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: assessmentId } = await params

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 })

    const text = await file.text()
    const rows = parseCSV(text)
    if (rows.length === 0) return NextResponse.json({ error: "CSV is empty or invalid" }, { status: 400 })

    // Validate rows
    const errors: string[] = []
    rows.forEach((row, i) => {
      if (!row["question"]?.trim()) errors.push(`Row ${i + 2}: missing question text`)
    })
    if (errors.length > 0) return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 })

    // Get current question count for ordering
    const existingCount = await prisma.question.count({ where: { assessmentId } })

    // Bulk create questions
    const created = await Promise.all(
      rows.map((row, i) => {
        const q = rowToQuestion(row, existingCount + i + 1)
        return prisma.question.create({
          data: {
            question: q.question,
            type: q.type,
            points: q.points,
            order: q.order,
            assessmentId,
            ...(q.options.length > 0 && {
              options: { create: q.options },
            }),
          },
          include: { options: { orderBy: { order: "asc" } } },
        })
      })
    )

    return NextResponse.json({ imported: created.length, questions: created }, { status: 201 })
  } catch (error) {
    console.error("CSV import error:", error)
    return NextResponse.json({ error: "Failed to import CSV" }, { status: 500 })
  }
}
