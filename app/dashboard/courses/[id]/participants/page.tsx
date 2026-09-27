"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ChevronLeft, Download, Search, Loader2, Users, CheckCircle,
  XCircle, Clock, Award, UserPlus, Trash2, AlertCircle
} from "lucide-react"
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
  const [courseStatus, setCourseStatus] = useState("PUBLISHED")
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Direct enrollment state
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [availableLearners, setAvailableLearners] = useState<any[]>([])
  const [loadingLearners, setLoadingLearners] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [enrolling, setEnrolling] = useState(false)
  const [enrollError, setEnrollError] = useState("")
  const [enrollSuccess, setEnrollSuccess] = useState("")
  const [unenrollBusy, setUnenrollBusy] = useState<string | null>(null)
  const [enrollMode, setEnrollMode] = useState<"select" | "create">("select")
  const [newFirstName, setNewFirstName] = useState("")
  const [newLastName, setNewLastName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [learnerSearch, setLearnerSearch] = useState("")

  const loadData = useCallback(async () => {
    try {
      const [pd, cd] = await Promise.all([
        fetch(`/api/courses/${courseId}/participants`).then(r => r.json()),
        fetch(`/api/courses/${courseId}`).then(r => r.json()),
      ])
      setParticipants(pd.participants ?? [])
      setAssessments(pd.assessments ?? [])
      setCourseTitle(cd.title ?? "Course")
      setCourseStatus(cd.status ?? "PUBLISHED")
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    if (role === "learner" || role === "proctor") { router.push("/dashboard"); return }
    void loadData()
  }, [role, router, loadData])

  const handleOpenEnrollDialog = async () => {
    setEnrollOpen(true)
    setEnrollError("")
    setEnrollSuccess("")
    setSelectedUserId("")
    setEnrollMode("select")
    setNewFirstName("")
    setNewLastName("")
    setNewEmail("")
    setLearnerSearch("")
    setLoadingLearners(true)
    try {
      const res = await fetch("/api/users?role=LEARNER&limit=100")
      const data = await res.json()
      const list = Array.isArray(data.data) ? data.data : Array.isArray(data.users) ? data.users : []
      setAvailableLearners(list)
      if (list.length === 0) {
        setEnrollMode("create")
      }
    } catch {
      setEnrollError("Failed to fetch learners list")
    } finally {
      setLoadingLearners(false)
    }
  }

  const handleEnrollLearner = async () => {
    if (!selectedUserId) return
    setEnrolling(true)
    setEnrollError("")
    setEnrollSuccess("")
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, courseId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setEnrollError(data.error || "Failed to enroll learner")
        return
      }
      setEnrollSuccess("Learner successfully enrolled!")
      await loadData()
      setTimeout(() => {
        setEnrollOpen(false)
        setSelectedUserId("")
        setEnrollSuccess("")
      }, 900)
    } catch {
      setEnrollError("Network error while enrolling learner")
    } finally {
      setEnrolling(false)
    }
  }

  const handleCreateAndEnroll = async () => {
    if (!newFirstName.trim() || !newLastName.trim() || !newEmail.trim()) {
      setEnrollError("Please provide first name, last name, and email.")
      return
    }
    setEnrolling(true)
    setEnrollError("")
    setEnrollSuccess("")
    try {
      const userRes = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: newFirstName.trim(),
          lastName: newLastName.trim(),
          email: newEmail.trim(),
          role: "LEARNER",
        }),
      })
      const userData = await userRes.json()
      if (!userRes.ok) {
        setEnrollError(userData.error || "Failed to create learner account")
        return
      }

      const createdUser = userData.user || userData.data
      const newUserId = createdUser?.id
      if (!newUserId) {
        setEnrollError("Learner account created, but missing user identifier")
        return
      }

      const enrollRes = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: newUserId, courseId }),
      })
      const enrollData = await enrollRes.json()
      if (!enrollRes.ok) {
        setEnrollError(enrollData.error || "Learner created, but failed to enroll into course")
        return
      }

      setEnrollSuccess(`${createdUser.firstName} ${createdUser.lastName} created and successfully enrolled!`)
      await loadData()
      setTimeout(() => {
        setEnrollOpen(false)
        setEnrollMode("select")
        setNewFirstName("")
        setNewLastName("")
        setNewEmail("")
        setSelectedUserId("")
        setEnrollSuccess("")
      }, 1000)
    } catch {
      setEnrollError("Network error while creating and enrolling learner")
    } finally {
      setEnrolling(false)
    }
  }

  const handleUnenroll = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to unenroll ${userName}? Their enrollment and course record will be removed.`)) {
      return
    }
    setUnenrollBusy(userId)
    try {
      const res = await fetch("/api/enrollments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, courseId }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "Failed to unenroll participant")
        return
      }
      await loadData()
    } catch {
      alert("Network error while unenrolling participant")
    } finally {
      setUnenrollBusy(null)
    }
  }

  const nonEnrolledLearners = availableLearners
    .filter(u => !participants.some(p => p.userId === u.id))
    .filter(u => {
      if (!learnerSearch.trim()) return true
      const q = learnerSearch.toLowerCase().trim()
      return (
        `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q)
      )
    })

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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-gray-900">Participants</h1>
              <Badge variant="outline" className={`text-xs ${
                courseStatus === "PUBLISHED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                {courseStatus}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{courseTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleOpenEnrollDialog} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            <UserPlus className="h-4 w-4 mr-2" /> Enroll Learner
          </Button>
          <Button onClick={exportCSV} variant="outline" className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Direct Enroll Dialog */}
      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Enroll Learner into Course</DialogTitle>
          </DialogHeader>

          {courseStatus !== "PUBLISHED" && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Course is in {courseStatus} status</p>
                <p className="mt-0.5 text-amber-700">Learners can only be enrolled in published courses. Please publish this course from the course editor before enrolling learners.</p>
              </div>
            </div>
          )}

          {/* Mode Switch Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setEnrollMode("select"); setEnrollError(""); }}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-all ${
                enrollMode === "select"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Select Existing Learner
            </button>
            <button
              type="button"
              onClick={() => { setEnrollMode("create"); setEnrollError(""); }}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-all ${
                enrollMode === "create"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              + Create & Enroll New
            </button>
          </div>

          <div className="space-y-4 py-1">
            {enrollMode === "select" ? (
              <div className="space-y-2">
                <Label>Select Learner</Label>
                {loadingLearners ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> Loading available learners...
                  </div>
                ) : availableLearners.length === 0 ? (
                  <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                    <p>No registered learners found in the system yet.</p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setEnrollMode("create")}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3"
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Create New Learner
                    </Button>
                  </div>
                ) : nonEnrolledLearners.length === 0 ? (
                  <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                    <p>
                      {availableLearners.length > 0 && learnerSearch.trim()
                        ? "No matching learners found for this search."
                        : "All registered learners are already enrolled in this course."}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setEnrollMode("create")}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3"
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Create Another Learner
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableLearners.length > 3 && (
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                          value={learnerSearch}
                          onChange={e => setLearnerSearch(e.target.value)}
                          placeholder="Filter by name or email..."
                          className="pl-8 h-8 text-xs rounded-lg"
                        />
                      </div>
                    )}
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Choose a learner to enroll" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {nonEnrolledLearners.map(u => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.firstName} {u.lastName} ({u.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">First Name *</Label>
                    <Input
                      value={newFirstName}
                      onChange={e => setNewFirstName(e.target.value)}
                      placeholder="e.g. Maria"
                      className="rounded-xl text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Last Name *</Label>
                    <Input
                      value={newLastName}
                      onChange={e => setNewLastName(e.target.value)}
                      placeholder="e.g. Santos"
                      className="rounded-xl text-xs h-9"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email Address *</Label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="learner@example.com"
                    className="rounded-xl text-xs h-9"
                  />
                </div>
                <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  💡 A learner account will be created with default password <span className="font-mono font-semibold text-slate-700">cpace1234</span> and enrolled directly into this course.
                </p>
              </div>
            )}

            {enrollError && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{enrollError}</span>
              </div>
            )}

            {enrollSuccess && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{enrollSuccess}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEnrollOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            {enrollMode === "select" ? (
              <Button
                onClick={handleEnrollLearner}
                disabled={enrolling || !selectedUserId || courseStatus !== "PUBLISHED"}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                {enrolling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Enroll
              </Button>
            ) : (
              <Button
                onClick={handleCreateAndEnroll}
                disabled={enrolling || !newFirstName.trim() || !newLastName.trim() || !newEmail.trim() || courseStatus !== "PUBLISHED"}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                {enrolling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Create & Enroll
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <TableHead className="text-gray-500 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5 + assessments.length} className="text-center py-12 text-gray-400">
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
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnenroll(p.userId, `${p.firstName} ${p.lastName}`)}
                      disabled={unenrollBusy === p.userId}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Unenroll learner"
                    >
                      {unenrollBusy === p.userId ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
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

