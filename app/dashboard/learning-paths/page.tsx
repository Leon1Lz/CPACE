"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { ArrowDown, ArrowRight, ArrowUp, BookOpen, CheckCircle2, ClipboardCheck, GripVertical, Loader2, Lock, Plus, Route, Save, Trash2, UsersRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

type Course = { id: string; title: string; category?: string | null }
type Assessment = { id: string; title: string; type: string; course: { id: string; title: string } }
type Group = { id: string; name: string; _count?: { members: number } }
type PathStep = {
  id?: string; type: "COURSE" | "ASSESSMENT"; title?: string | null; description?: string | null; isRequired: boolean
  courseId?: string | null; assessmentId?: string | null; course?: Course | null; assessment?: Assessment | null
  completed?: boolean; locked?: boolean; progress?: number; bestScore?: number | null; href?: string
}
type LearningPath = {
  id: string; title: string; description: string | null; isPublished: boolean; progress?: number; completedSteps?: number; completed?: boolean; currentStepId?: string | null
  steps: PathStep[]; groups: Array<{ group: { id: string; name: string } }>; creator?: { firstName: string; lastName: string }; _count?: { steps: number; groups: number }
}

export default function LearningPathsPage() {
  const { data: session } = useSession()
  const role = session?.user?.role?.toUpperCase()
  const isStaff = role === "ADMIN" || role === "INSTRUCTOR"
  const { toast } = useToast()
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createTitle, setCreateTitle] = useState("")
  const [createDescription, setCreateDescription] = useState("")
  const [editing, setEditing] = useState<LearningPath | null>(null)
  const [draftTitle, setDraftTitle] = useState("")
  const [draftDescription, setDraftDescription] = useState("")
  const [draftGroups, setDraftGroups] = useState<Set<string>>(new Set())
  const [draftSteps, setDraftSteps] = useState<PathStep[]>([])
  const [courseToAdd, setCourseToAdd] = useState("")
  const [assessmentToAdd, setAssessmentToAdd] = useState("")
  const [deletePath, setDeletePath] = useState<LearningPath | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const pathResponse = await fetch("/api/learning-paths", { cache: "no-store" })
      if (!pathResponse.ok) throw new Error("Unable to load learning paths")
      setPaths(await pathResponse.json())
      if (isStaff) {
        const [courseResponse, assessmentResponse, groupResponse] = await Promise.all([
          fetch("/api/courses?limit=100"), fetch("/api/assessments?limit=100"), fetch("/api/groups"),
        ])
        const [courseData, assessmentData, groupData] = await Promise.all([courseResponse.json(), assessmentResponse.json(), groupResponse.json()])
        setCourses(courseData.data ?? [])
        setAssessments(assessmentData.data ?? [])
        setGroups(Array.isArray(groupData) ? groupData : [])
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Learning paths unavailable", description: error instanceof Error ? error.message : "Please try again." })
    } finally {
      setLoading(false)
    }
  }, [isStaff, toast])

  useEffect(() => {
    if (!session) return
    const initialLoad = window.setTimeout(() => void loadData(), 0)
    return () => window.clearTimeout(initialLoad)
  }, [session, loadData])

  const openEditor = (path: LearningPath) => {
    setEditing(path)
    setDraftTitle(path.title)
    setDraftDescription(path.description ?? "")
    setDraftGroups(new Set(path.groups.map((item) => item.group.id)))
    setDraftSteps(path.steps.map((step) => ({ ...step })))
  }

  const createPath = async () => {
    if (!createTitle.trim()) return
    setSaving(true)
    try {
      const response = await fetch("/api/learning-paths", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: createTitle, description: createDescription }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to create path")
      setCreating(false); setCreateTitle(""); setCreateDescription("")
      await loadData(); openEditor(result)
    } catch (error) {
      toast({ variant: "destructive", title: "Path not created", description: error instanceof Error ? error.message : "Please try again." })
    } finally { setSaving(false) }
  }

  const savePath = async () => {
    if (!editing || !draftTitle.trim()) return
    setSaving(true)
    try {
      const response = await fetch(`/api/learning-paths/${editing.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: draftTitle, description: draftDescription, groupIds: Array.from(draftGroups), steps: draftSteps.map((step) => ({ type: step.type, courseId: step.courseId, assessmentId: step.assessmentId, title: step.title, description: step.description, isRequired: step.isRequired })) }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to save path")
      setEditing(null); await loadData()
      toast({ title: "Learning path saved", description: "Steps, groups, and learner enrollments are up to date." })
    } catch (error) {
      toast({ variant: "destructive", title: "Path not saved", description: error instanceof Error ? error.message : "Please try again." })
    } finally { setSaving(false) }
  }

  const setPublished = async (path: LearningPath, isPublished: boolean) => {
    const response = await fetch(`/api/learning-paths/${path.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPublished }) })
    const result = await response.json()
    if (response.ok) {
      setPaths((current) => current.map((item) => item.id === path.id ? { ...item, isPublished } : item))
      toast({ title: isPublished ? "Learning path published" : "Learning path unpublished", description: isPublished ? "Assigned learners can now see this path." : "The path is hidden from learners until republished." })
    } else {
      toast({ variant: "destructive", title: "Publication failed", description: result.error || "Please complete the path setup first." })
    }
  }

  const removePath = async () => {
    if (!deletePath) return
    setSaving(true)
    try {
      const response = await fetch(`/api/learning-paths/${deletePath.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Unable to delete path")
      setPaths((current) => current.filter((item) => item.id !== deletePath.id)); setDeletePath(null)
      toast({ title: "Learning path deleted", description: "Existing learner course progress was preserved." })
    } catch (error) { toast({ variant: "destructive", title: "Path not deleted", description: error instanceof Error ? error.message : "Please try again." }) }
    finally { setSaving(false) }
  }

  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= draftSteps.length) return
    setDraftSteps((current) => { const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next })
  }
  const addCourse = () => {
    const course = courses.find((item) => item.id === courseToAdd)
    if (!course || draftSteps.some((step) => step.type === "COURSE" && step.courseId === course.id)) return
    setDraftSteps((current) => [...current, { type: "COURSE", courseId: course.id, course, isRequired: true }]); setCourseToAdd("")
  }
  const addAssessment = () => {
    const assessment = assessments.find((item) => item.id === assessmentToAdd)
    if (!assessment || draftSteps.some((step) => step.type === "ASSESSMENT" && step.assessmentId === assessment.id)) return
    setDraftSteps((current) => [...current, { type: "ASSESSMENT", assessmentId: assessment.id, assessment, isRequired: true }]); setAssessmentToAdd("")
  }

  const totalAssignedLearners = useMemo(() => editing ? groups.filter((group) => draftGroups.has(group.id)).reduce((sum, group) => sum + (group._count?.members ?? 0), 0) : 0, [editing, groups, draftGroups])

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>

  if (!isStaff) {
    return <LearnerPathList paths={paths} />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="flex items-center gap-2 text-2xl font-black text-slate-900"><Route className="h-6 w-6 text-emerald-600" /> Learning Paths</h1><p className="mt-1 text-sm text-slate-500">Build ordered certification journeys and assign them to learner groups.</p></div>
        <Button onClick={() => setCreating(true)} className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"><Plus className="mr-2 h-4 w-4" /> New Learning Path</Button>
      </div>

      {paths.length ? <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{paths.map((path) => (
        <Card key={path.id} className="overflow-hidden border-slate-200 shadow-sm transition hover:shadow-lg">
          <div className={`h-1.5 ${path.isPublished ? "bg-emerald-500" : "bg-amber-400"}`} />
          <CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-lg text-slate-900">{path.title}</CardTitle><p className="mt-1 line-clamp-2 text-xs text-slate-500">{path.description || "No description yet."}</p></div><span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${path.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{path.isPublished ? "Published" : "Draft"}</span></div></CardHeader>
          <CardContent className="space-y-4"><div className="grid grid-cols-2 gap-2"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] uppercase text-slate-400">Steps</p><p className="font-black text-slate-800">{path.steps.length}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] uppercase text-slate-400">Groups</p><p className="font-black text-slate-800">{path.groups.length}</p></div></div>
            <div className="flex min-h-6 flex-wrap gap-1.5">{path.groups.length ? path.groups.map((item) => <span key={item.group.id} className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">{item.group.name}</span>) : <span className="text-xs text-slate-400">No groups assigned</span>}</div>
            <div className="flex gap-2"><Button onClick={() => openEditor(path)} className="flex-1 rounded-xl bg-[#105C2E] text-white hover:bg-[#0B4523]">Manage path</Button><Button variant="outline" onClick={() => void setPublished(path, !path.isPublished)} className="rounded-xl">{path.isPublished ? "Unpublish" : "Publish"}</Button><Button size="icon" variant="outline" onClick={() => setDeletePath(path)} className="rounded-xl border-rose-200 text-rose-600"><Trash2 className="h-4 w-4" /></Button></div>
          </CardContent>
        </Card>
      ))}</div> : <Card className="border-dashed"><CardContent className="py-20 text-center"><Route className="mx-auto h-12 w-12 text-slate-200" /><h2 className="mt-4 font-bold text-slate-800">Create your first learning path</h2><p className="mt-1 text-sm text-slate-400">Combine courses and assessments into a guided certification journey.</p></CardContent></Card>}

      <Dialog open={creating} onOpenChange={setCreating}><DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>Create learning path</DialogTitle></DialogHeader><div className="space-y-4"><div><label className="mb-1.5 block text-xs font-bold text-slate-600">Path name</label><Input value={createTitle} onChange={(event) => setCreateTitle(event.target.value)} placeholder="e.g. CFMS Certification Path" className="rounded-xl" /></div><div><label className="mb-1.5 block text-xs font-bold text-slate-600">Description</label><Textarea value={createDescription} onChange={(event) => setCreateDescription(event.target.value)} placeholder="What will learners achieve?" className="rounded-xl" /></div><Button onClick={() => void createPath()} disabled={saving || !createTitle.trim()} className="w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create and configure</Button></div></DialogContent></Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => { if (!open && !saving) setEditing(null) }}><DialogContent className="max-h-[92vh] max-w-[calc(100%-2rem)] overflow-y-auto rounded-2xl sm:max-w-4xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><Route className="h-5 w-5 text-emerald-600" /> Learning Path Builder</DialogTitle></DialogHeader>{editing && <div className="grid gap-6 lg:grid-cols-[1fr_1.45fr]">
        <div className="space-y-5"><div className="space-y-3"><Input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} className="rounded-xl font-bold" /><Textarea value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)} placeholder="Path description" className="rounded-xl" /></div><div><div className="mb-2 flex items-center justify-between"><p className="text-xs font-black uppercase tracking-wide text-slate-500">Assign groups</p><span className="text-[10px] text-slate-400">{totalAssignedLearners} learners</span></div><div className="max-h-52 space-y-2 overflow-y-auto rounded-xl border p-2">{groups.map((group) => <label key={group.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50"><input type="checkbox" checked={draftGroups.has(group.id)} onChange={(event) => setDraftGroups((current) => { const next = new Set(current); if (event.target.checked) next.add(group.id); else next.delete(group.id); return next })} className="h-4 w-4 accent-emerald-600" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-700">{group.name}</p><p className="text-[10px] text-slate-400">{group._count?.members ?? 0} members</p></div></label>)}</div></div><div className="rounded-xl bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800"><UsersRound className="mb-1 h-4 w-4" />Saving group assignments automatically enrolls current members in every course required by this path.</div></div>
        <div className="space-y-4"><div className="grid gap-2 sm:grid-cols-2"><div className="flex gap-1.5"><select value={courseToAdd} onChange={(event) => setCourseToAdd(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs"><option value="">Choose course…</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select><Button size="sm" onClick={addCourse} disabled={!courseToAdd} className="rounded-xl bg-emerald-600"><Plus className="h-4 w-4" /></Button></div><div className="flex gap-1.5"><select value={assessmentToAdd} onChange={(event) => setAssessmentToAdd(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs"><option value="">Choose assessment…</option>{assessments.map((assessment) => <option key={assessment.id} value={assessment.id}>{assessment.title} · {assessment.course.title}</option>)}</select><Button size="sm" onClick={addAssessment} disabled={!assessmentToAdd} className="rounded-xl bg-violet-600"><Plus className="h-4 w-4" /></Button></div></div>
          <div className="space-y-2">{draftSteps.length ? draftSteps.map((step, index) => { const title = step.title || step.course?.title || step.assessment?.title || "Untitled step"; return <div key={`${step.type}-${step.courseId || step.assessmentId}-${index}`} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3"><GripVertical className="h-4 w-4 shrink-0 text-slate-300" /><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${step.type === "COURSE" ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700"}`}>{step.type === "COURSE" ? <BookOpen className="h-4 w-4" /> : <ClipboardCheck className="h-4 w-4" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800"><span className="mr-1.5 text-slate-400">{index + 1}.</span>{title}</p><label className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500"><input type="checkbox" checked={step.isRequired} onChange={(event) => setDraftSteps((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, isRequired: event.target.checked } : item))} className="accent-emerald-600" /> Required to unlock next step</label></div><div className="flex gap-1"><Button size="icon" variant="ghost" disabled={index === 0} onClick={() => moveStep(index, -1)} className="h-7 w-7"><ArrowUp className="h-3.5 w-3.5" /></Button><Button size="icon" variant="ghost" disabled={index === draftSteps.length - 1} onClick={() => moveStep(index, 1)} className="h-7 w-7"><ArrowDown className="h-3.5 w-3.5" /></Button><Button size="icon" variant="ghost" onClick={() => setDraftSteps((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="h-7 w-7 text-rose-500"><Trash2 className="h-3.5 w-3.5" /></Button></div></div> }) : <div className="rounded-xl border-2 border-dashed py-16 text-center text-sm text-slate-400">Add a course or assessment to begin.</div>}</div>
          <Button onClick={() => void savePath()} disabled={saving || !draftTitle.trim()} className="w-full rounded-xl bg-[#105C2E] text-white hover:bg-[#0B4523]">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save path and assignments</Button></div>
      </div>}</DialogContent></Dialog>

      <AlertDialog open={Boolean(deletePath)} onOpenChange={(open) => { if (!open && !saving) setDeletePath(null) }}><AlertDialogContent className="rounded-2xl"><AlertDialogHeader><AlertDialogTitle>Delete this learning path?</AlertDialogTitle><AlertDialogDescription>The path structure and group assignments will be removed. Existing enrollments, course progress, results, and certificates will remain.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel><AlertDialogAction onClick={(event) => { event.preventDefault(); void removePath() }} className="rounded-xl bg-rose-600 text-white hover:bg-rose-700">Delete path</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  )
}

function LearnerPathList({ paths }: { paths: LearningPath[] }) {
  return <div className="space-y-6"><div><h1 className="flex items-center gap-2 text-2xl font-black text-slate-900"><Route className="h-6 w-6 text-emerald-600" /> My Learning Paths</h1><p className="mt-1 text-sm text-slate-500">Follow your assigned certification journey in order.</p></div>{paths.length ? <div className="space-y-5">{paths.map((path) => <Card key={path.id} className="overflow-hidden border-slate-200 shadow-sm"><div className="bg-gradient-to-r from-[#105C2E] to-emerald-600 p-5 text-white"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black">{path.title}</h2><p className="mt-1 max-w-2xl text-xs leading-relaxed text-emerald-100">{path.description}</p></div><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{path.progress ?? 0}% complete</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${path.progress ?? 0}%` }} /></div></div><CardContent className="p-5"><div className="space-y-2">{path.steps.map((step, index) => { const title = step.title || step.course?.title || step.assessment?.title || "Learning step"; const isCurrent = path.currentStepId === step.id; return <div key={step.id || index} className={`flex items-center gap-3 rounded-2xl border p-4 ${step.completed ? "border-emerald-100 bg-emerald-50/60" : isCurrent ? "border-emerald-300 bg-white shadow-sm ring-1 ring-emerald-100" : "border-slate-100 bg-slate-50/70"}`}><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${step.completed ? "bg-emerald-600 text-white" : step.locked ? "bg-slate-200 text-slate-400" : "bg-amber-100 text-amber-700"}`}>{step.completed ? <CheckCircle2 className="h-5 w-5" /> : step.locked ? <Lock className="h-4 w-4" /> : step.type === "COURSE" ? <BookOpen className="h-5 w-5" /> : <ClipboardCheck className="h-5 w-5" />}</div><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Step {index + 1} · {step.type}</p><h3 className="truncate text-sm font-bold text-slate-800">{title}</h3><p className="mt-0.5 text-[11px] text-slate-500">{step.completed ? "Completed" : step.locked ? "Complete the required previous step to unlock" : isCurrent ? "Your current step" : "Ready to begin"}{step.type === "COURSE" && !step.completed ? ` · ${step.progress ?? 0}%` : ""}</p></div>{!step.locked && step.href && <Button asChild size="sm" className={`rounded-xl ${step.completed ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}><Link href={step.href}>{step.completed ? "Review" : isCurrent ? "Continue" : "Open"}<ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>}</div>})}</div></CardContent></Card>)}</div> : <Card className="border-dashed"><CardContent className="py-20 text-center"><Route className="mx-auto h-12 w-12 text-slate-200" /><h2 className="mt-4 font-bold text-slate-800">No learning paths assigned yet</h2><p className="mt-1 text-sm text-slate-400">Your assigned certification paths will appear here.</p></CardContent></Card>}</div>
}
