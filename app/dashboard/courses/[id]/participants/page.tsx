"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, Download, Search, Loader2, Users, CheckCircle, XCircle, Clock, Award } from "lucide-react"
import Link from "next/link"

type AssessmentResult = {
  assessmentId: string; title: string; type: string; passingScore: number
  score: number | null; passed: boolean; attempts: number
}
type Participant = {
  userId: string; firstName: string; lastName: string; email: string
  enrolledAt: string; progress: number; status: string
  certificate: { certificateNumber: string; issuedAt: string; isValid: boolean } | null
  assessmentResults: AssessmentResult[]
}
type Assessment = { id: string; title: string; type: string; passingScore: number }

export default function ParticipantsPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  const role = session?.user?.role?.toLowerCase()

  const [participants, setParticipants] = useState<Participant[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [courseTitle, setCourseTitle] = useState("")
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (role === "learner" || role === "proctor") { router.push("/dashboard"); return }
    Promise.all([
      fetch(`/api/courses/${courseId}/participants`).then(r => r.json()),
      fetch(`/api/courses/${courseId}`).then(r => r.json()),
    ]).then(([pd, cd]) => {
      setParticipants(pd.participants ?? [])
      setAssessments(pd.assessments ?? [])
      setCourseTitle(cd.title ?? "Course")
    }).finally(() => setLoading(false))
  }, [courseId, role, router])

  const filtered = participants.filter(p =>
    `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const exportCSV = () => {
    const headers = [
      "Name", "Email", "Enrolled At", "Progress %", "Status", "Certificate",
      ...assessments.map(a => `${a.title} Score`),
      ...assessments.map(a => `${a.title} Passed`),
      ...assessments.map(a => `${a.title} Attempts`),
    ]
    const rows = filtered.map(p => [
      `${p.firstName} ${p.lastName}`,
      p.email,
      new Date(p.enrolledAt).toLocaleDateString(),
      p.progress.toFixed(0),
      p.status,
      p.certificate ? p.certificate.certificateNumber : "None",
      ...assessments.map(a => {
        const r = p.assessmentResults.find(ar => ar.assessmentId === a.id)
        return r?.score != null ? r.score.toFixed(1) : "N/A"
      }),
      ...assessments.map(a => {
        const r = p.assessmentResults.find(ar => ar.assessmentId === a.id)
        return r ? (r.passed ? "Yes" : "No") : "N/A"
      }),
      ...assessments.map(a => {
        const r = p.assessmentResults.find(ar => ar.assessmentId === a.id)
        return r ? r.attempts : 0
      }),
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${courseTitle.replace(/[^a-z0-9]/gi, "_")}_participants.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = {
    total: participants.length,
    completed: participants.filter(p => p.status === "COMPLETED").length,
    certified: participants.filter(p => p.certificate).length,
    avgProgress: participants.length > 0 ? participants.reduce((s, p) => s + p.progress, 0) / participants.length : 0,
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-xl">
            <Link href="/dashboard/courses"><ChevronLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-black text-gray-900">Participants</h1>
            <p className="text-sm text-gray-500 mt-0.5">{courseTitle}</p>
          </div>
        </div>
        <Button onClick={exportCSV} variant="outline" className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50">
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Enrolled", value: stats.total, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "Completed", value: stats.completed, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
          { label: "Certified", value: stats.certified, icon: Award, color: "text-violet-600 bg-violet-50" },
          { label: "Avg Progress", value: `${stats.avgProgress.toFixed(0)}%`, icon: Clock, color: "text-amber-600 bg-amber-50" },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-black text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search participants…" className="pl-9 rounded-xl" />
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100 bg-gray-50/80">
                <TableHead className="text-gray-500 font-semibold">Participant</TableHead>
                <TableHead className="text-gray-500 font-semibold">Enrolled</TableHead>
                <TableHead className="text-gray-500 font-semibold">Status</TableHead>
                {assessments.map(a => (
                  <TableHead key={a.id} className="text-gray-500 font-semibold text-center whitespace-nowrap">
                    {a.title.length > 20 ? a.title.slice(0, 20) + "…" : a.title}
                  </TableHead>
                ))}
                <TableHead className="text-gray-500 font-semibold text-center">Certificate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4 + assessments.length} className="text-center py-12 text-gray-400">
                    No participants found
                  </TableCell>
                </TableRow>
              ) : filtered.map(p => (
                <TableRow key={p.userId} className="border-gray-50 hover:bg-gray-50/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-emerald-700">{p.firstName[0]}{p.lastName[0]}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-gray-400">{p.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {new Date(p.enrolledAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs rounded-full ${
                      p.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                      p.status === "ACTIVE" ? "bg-blue-100 text-blue-700" :
                      p.status === "DROPPED" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    }`} variant="outline">{p.status}</Badge>
                  </TableCell>
                  {assessments.map(a => {
                    const r = p.assessmentResults.find(ar => ar.assessmentId === a.id)
                    return (
                      <TableCell key={a.id} className="text-center">
                        {r?.score != null ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`text-sm font-bold ${r.passed ? "text-emerald-600" : "text-red-500"}`}>
                              {r.score.toFixed(1)}%
                            </span>
                            <div className="flex items-center gap-1">
                              {r.passed
                                ? <CheckCircle className="h-3 w-3 text-emerald-500" />
                                : <XCircle className="h-3 w-3 text-red-400" />}
                              <span className="text-xs text-gray-400">{r.attempts}x</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </TableCell>
                    )
                  })}
                  <TableCell className="text-center">
                    {p.certificate ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <Award className="h-4 w-4 text-violet-500" />
                        <span className="text-xs text-gray-400">#{p.certificate.certificateNumber}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
