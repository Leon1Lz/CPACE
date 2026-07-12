"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Users, Plus, Trash2, BookOpen, UserPlus, X, Loader2, Search, ChevronRight, UserCheck } from "lucide-react"

type Member = { id: string; joinedAt: string; user: { id: string; firstName: string; lastName: string; email: string; role: string } }
type GroupCourse = { id: string; course: { id: string; title: string; category: string; status: string } }
type Group = {
  id: string; name: string; description: string | null; createdAt: string
  creator: { firstName: string; lastName: string }
  members: Member[]
  courses: GroupCourse[]
  _count: { members: number; courses: number }
}
type User = { id: string; firstName: string; lastName: string; email: string; role: string }
type Course = { id: string; title: string; category: string; status: string }

export default function GroupsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const role = session?.user?.role?.toLowerCase()

  const [groups, setGroups] = useState<Group[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Group | null>(null)

  // Create group dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")

  // Add members dialog
  const [membersOpen, setMembersOpen] = useState(false)
  const [memberSearch, setMemberSearch] = useState("")
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [addingMembers, setAddingMembers] = useState(false)

  // Add courses dialog
  const [coursesOpen, setCoursesOpen] = useState(false)
  const [courseSearch, setCourseSearch] = useState("")
  const [addingCourse, setAddingCourse] = useState<string | null>(null)

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!role || role === "learner" || role === "proctor") { router.push("/dashboard"); return }
    Promise.all([
      fetch("/api/groups").then(r => r.json()),
      fetch("/api/users?limit=200").then(r => r.json()),
      fetch("/api/courses?status=PUBLISHED&limit=100").then(r => r.json()),
    ]).then(([g, u, c]) => {
      setGroups(Array.isArray(g) ? g : [])
      setAllUsers(Array.isArray(u.data) ? u.data : [])
      setAllCourses(Array.isArray(c.data) ? c.data : [])
    }).finally(() => setLoading(false))
  }, [role, router, status])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    setCreateError("")
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCreateError(data.error ?? "Failed to create group")
        return
      }
      setGroups(prev => [{ ...data, members: [], courses: [] }, ...prev])
      setCreateOpen(false); setNewName(""); setNewDesc(""); setCreateError("")
    } catch {
      setCreateError("Network error — please try again")
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await fetch(`/api/groups/${deleteId}`, { method: "DELETE" })
    setGroups(prev => prev.filter(g => g.id !== deleteId))
    if (selected?.id === deleteId) setSelected(null)
    setDeleteId(null)
  }

  const handleAddMembers = async () => {
    if (!selected || selectedUserIds.length === 0) return
    setAddingMembers(true)
    const res = await fetch(`/api/groups/${selected.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: selectedUserIds }),
    })
    setAddingMembers(false)
    if (res.ok) {
      // Refresh groups
      const fresh = await fetch("/api/groups").then(r => r.json())
      setGroups(Array.isArray(fresh) ? fresh : [])
      const updated = fresh.find((g: Group) => g.id === selected.id)
      if (updated) setSelected(updated)
      setMembersOpen(false); setSelectedUserIds([]); setMemberSearch("")
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!selected) return
    await fetch(`/api/groups/${selected.id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
    const updatedMembers = selected.members.filter(m => m.user.id !== userId)
    const updatedGroup = { ...selected, members: updatedMembers, _count: { ...selected._count, members: updatedMembers.length } }
    setSelected(updatedGroup)
    setGroups(prev => prev.map(g => g.id === selected.id ? updatedGroup : g))
  }

  const handleAssignCourse = async (courseId: string) => {
    if (!selected) return
    setAddingCourse(courseId)
    const res = await fetch(`/api/groups/${selected.id}/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    })
    setAddingCourse(null)
    if (res.ok) {
      const fresh = await fetch("/api/groups").then(r => r.json())
      setGroups(Array.isArray(fresh) ? fresh : [])
      const updated = fresh.find((g: Group) => g.id === selected.id)
      if (updated) setSelected(updated)
    }
  }

  const handleRemoveCourse = async (courseId: string) => {
    if (!selected) return
    await fetch(`/api/groups/${selected.id}/courses`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    })
    const updatedCourses = selected.courses.filter(c => c.course.id !== courseId)
    const updatedGroup = { ...selected, courses: updatedCourses, _count: { ...selected._count, courses: updatedCourses.length } }
    setSelected(updatedGroup)
    setGroups(prev => prev.map(g => g.id === selected.id ? updatedGroup : g))
  }

  const availableUsers = allUsers.filter(u =>
    !selected?.members.some(m => m.user.id === u.id) &&
    (u.firstName + " " + u.lastName + " " + u.email).toLowerCase().includes(memberSearch.toLowerCase())
  )

  const availableCourses = allCourses.filter(c =>
    !selected?.courses.some(gc => gc.course.id === c.id) &&
    c.title.toLowerCase().includes(courseSearch.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Participant Groups</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create cohorts and batch-enroll learners into courses</p>
        </div>
        <Dialog open={createOpen} onOpenChange={v => { setCreateOpen(v); if (!v) { setNewName(""); setNewDesc(""); setCreateError("") } }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
              <Plus className="h-4 w-4 mr-2" /> New Group
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader><DialogTitle>Create Group</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Group Name</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Batch 2025 — CFMS" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Description <span className="text-gray-400 text-xs">(optional)</span></Label>
                <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Short description of this group" className="rounded-xl" />
              </div>
              {createError && (
                <div className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{createError}</div>
              )}
              <Button onClick={handleCreate} disabled={creating || !newName.trim()} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Group list */}
        <div className="space-y-3">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-gray-100 text-center">
              <Users className="h-10 w-10 text-gray-200 mb-2" />
              <p className="text-sm font-medium text-gray-400">No groups yet</p>
              <p className="text-xs text-gray-300">Create a group to get started</p>
            </div>
          ) : groups.map(g => (
            <div
              key={g.id}
              onClick={() => setSelected(g)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${selected?.id === g.id ? "border-emerald-400 bg-emerald-50/60 shadow-sm" : "border-gray-100 bg-white hover:border-emerald-200 hover:shadow-sm"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{g.name}</p>
                  {g.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{g.description}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-gray-500"><Users className="h-3 w-3" />{g._count.members} members</span>
                    <span className="flex items-center gap-1 text-xs text-gray-500"><BookOpen className="h-3 w-3" />{g._count.courses} courses</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <ChevronRight className={`h-4 w-4 transition-colors ${selected?.id === g.id ? "text-emerald-500" : "text-gray-300"}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Group detail panel */}
        {selected ? (
          <div className="lg:col-span-2 space-y-4">
            {/* Group header */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-black text-gray-900">{selected.name}</h2>
                    {selected.description && <p className="text-sm text-gray-500 mt-0.5">{selected.description}</p>}
                    <p className="text-xs text-gray-400 mt-1">Created by {selected.creator.firstName} {selected.creator.lastName}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setDeleteId(selected.id)} className="rounded-xl text-red-500 border-red-100 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex gap-3 mt-4">
                  <div className="flex-1 p-3 rounded-xl bg-emerald-50 text-center">
                    <p className="text-2xl font-black text-emerald-600">{selected._count.members}</p>
                    <p className="text-xs text-emerald-700 font-medium">Members</p>
                  </div>
                  <div className="flex-1 p-3 rounded-xl bg-blue-50 text-center">
                    <p className="text-2xl font-black text-blue-600">{selected._count.courses}</p>
                    <p className="text-xs text-blue-700 font-medium">Courses</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Members */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2"><Users className="h-4 w-4 text-emerald-500" />Members</h3>
                  <Dialog open={membersOpen} onOpenChange={v => { setMembersOpen(v); if (!v) { setSelectedUserIds([]); setMemberSearch("") } }}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="rounded-xl text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                        <UserPlus className="h-3.5 w-3.5 mr-1" /> Add Members
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl max-w-lg">
                      <DialogHeader><DialogTitle>Add Members to {selected.name}</DialogTitle></DialogHeader>
                      <div className="space-y-3 mt-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                          <Input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search users…" className="pl-9 rounded-xl" />
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-1 rounded-xl border border-gray-100 p-2">
                          {availableUsers.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">No users found</p>
                          ) : availableUsers.map(u => (
                            <label key={u.id} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${selectedUserIds.includes(u.id) ? "bg-emerald-50" : "hover:bg-gray-50"}`}>
                              <input type="checkbox" checked={selectedUserIds.includes(u.id)} onChange={e => setSelectedUserIds(prev => e.target.checked ? [...prev, u.id] : prev.filter(id => id !== u.id))} className="rounded" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900">{u.firstName} {u.lastName}</p>
                                <p className="text-xs text-gray-400 truncate">{u.email}</p>
                              </div>
                              <Badge variant="outline" className="text-xs shrink-0">{u.role}</Badge>
                            </label>
                          ))}
                        </div>
                        {selectedUserIds.length > 0 && (
                          <p className="text-xs text-emerald-600 font-semibold">{selectedUserIds.length} user{selectedUserIds.length !== 1 ? "s" : ""} selected</p>
                        )}
                        <Button onClick={handleAddMembers} disabled={addingMembers || selectedUserIds.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                          {addingMembers ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                          Add & Enroll {selectedUserIds.length > 0 ? `(${selectedUserIds.length})` : ""}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {selected.members.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No members yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {selected.members.map(m => (
                      <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 group">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-emerald-700">{m.user.firstName[0]}{m.user.lastName[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{m.user.firstName} {m.user.lastName}</p>
                          <p className="text-xs text-gray-400 truncate">{m.user.email}</p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">{m.user.role}</Badge>
                        <button onClick={() => handleRemoveMember(m.user.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 shrink-0">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Courses */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2"><BookOpen className="h-4 w-4 text-blue-500" />Assigned Courses</h3>
                  <Dialog open={coursesOpen} onOpenChange={v => { setCoursesOpen(v); if (!v) setCourseSearch("") }}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="rounded-xl text-xs border-blue-200 text-blue-700 hover:bg-blue-50">
                        <Plus className="h-3.5 w-3.5 mr-1" /> Assign Course
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl max-w-lg">
                      <DialogHeader><DialogTitle>Assign Course to {selected.name}</DialogTitle></DialogHeader>
                      <div className="space-y-3 mt-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                          <Input value={courseSearch} onChange={e => setCourseSearch(e.target.value)} placeholder="Search courses…" className="pl-9 rounded-xl" />
                        </div>
                        <div className="max-h-72 overflow-y-auto space-y-1.5">
                          {availableCourses.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">No courses available</p>
                          ) : availableCourses.map(c => (
                            <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{c.title}</p>
                                <p className="text-xs text-gray-400">{c.category}</p>
                              </div>
                              <Button size="sm" onClick={() => handleAssignCourse(c.id)} disabled={addingCourse === c.id} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs">
                                {addingCourse === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Assign"}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {selected.courses.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No courses assigned yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {selected.courses.map(gc => (
                      <div key={gc.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 group">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{gc.course.title}</p>
                          <p className="text-xs text-gray-400">{gc.course.category}</p>
                        </div>
                        <button onClick={() => handleRemoveCourse(gc.course.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 shrink-0">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="lg:col-span-2 flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed border-gray-100">
            <Users className="h-12 w-12 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-400">Select a group to manage it</p>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={o => { if (!o) setDeleteId(null) }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the group and all member/course assignments. Enrollments already created will not be affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
