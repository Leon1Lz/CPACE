"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Users, Search, UserCheck, UserX, GraduationCap, BookOpen, Award, Loader2, ShieldCheck, Trash2 } from "lucide-react"

export default function UsersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => {
    if (session && session.user.role !== "ADMIN") { router.push("/dashboard"); return }
    fetch("/api/users?limit=100").then(r => r.json()).then(data => {
      setUsers(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [])
    }).finally(() => setLoading(false))
  }, [session])

  const currentUserId = (session?.user as any)?.id

  const filtered = users.filter(u => {
    const matchesSearch = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const toggleActive = async (id: string, isActive: boolean) => {
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    })
    if (res.ok) setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: !isActive } : u))
  }

  const changeRole = async (id: string, role: string) => {
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    })
    if (res.ok) setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const toggleSelectAll = () => {
    const selectableIds = filtered.filter(u => u.id !== currentUserId).map((u: any) => u.id)
    if (selectableIds.every((id: string) => selected.has(id))) {
      setSelected(prev => { const n = new Set(prev); selectableIds.forEach((id: string) => n.delete(id)); return n })
    } else {
      setSelected(prev => { const n = new Set(prev); selectableIds.forEach((id: string) => n.add(id)); return n })
    }
  }

  const bulkSetActive = async (isActive: boolean) => {
    setBulkLoading(true)
    const ids = Array.from(selected)
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, isActive }),
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => ids.includes(u.id) ? { ...u, isActive } : u))
      setSelected(new Set())
    }
    setBulkLoading(false)
  }

  const bulkDelete = async () => {
    setBulkLoading(true)
    const ids = Array.from(selected)
    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
    if (res.ok) {
      setUsers(prev => prev.filter(u => !ids.includes(u.id)))
      setSelected(new Set())
    }
    setBulkLoading(false)
    setDeleteDialog(false)
  }

  const roleColors: Record<string, string> = {
    ADMIN: "bg-rose-100 text-rose-700",
    INSTRUCTOR: "bg-blue-100 text-blue-700",
    LEARNER: "bg-emerald-100 text-emerald-700",
    PROCTOR: "bg-violet-100 text-violet-700",
  }

  const stats = [
    { label: "Total Users", value: users.length, icon: Users, gradient: "from-emerald-500 to-teal-600" },
    { label: "Admins", value: users.filter(u => u.role === "ADMIN").length, icon: UserCheck, gradient: "from-rose-500 to-pink-600" },
    { label: "Instructors", value: users.filter(u => u.role === "INSTRUCTOR").length, icon: BookOpen, gradient: "from-blue-500 to-cyan-600" },
    { label: "Proctors", value: users.filter(u => u.role === "PROCTOR").length, icon: Award, gradient: "from-violet-500 to-purple-600" },
    { label: "Learners", value: users.filter(u => u.role === "LEARNER").length, icon: GraduationCap, gradient: "from-amber-500 to-orange-600" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage all registered users on the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="border-0 shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{s.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{s.value}</p>
                </div>
                <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <s.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <span className="text-sm font-semibold text-emerald-700">{selected.size} user{selected.size > 1 ? "s" : ""} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <Button size="sm" variant="outline" disabled={bulkLoading} onClick={() => bulkSetActive(true)}
              className="rounded-xl text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-100">
              {bulkLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <UserCheck className="h-3 w-3 mr-1" />}Activate
            </Button>
            <Button size="sm" variant="outline" disabled={bulkLoading} onClick={() => bulkSetActive(false)}
              className="rounded-xl text-xs border-amber-300 text-amber-700 hover:bg-amber-50">
              {bulkLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <UserX className="h-3 w-3 mr-1" />}Deactivate
            </Button>
            <Button size="sm" disabled={bulkLoading} onClick={() => setDeleteDialog(true)}
              className="rounded-xl text-xs bg-red-600 hover:bg-red-700 text-white">
              {bulkLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} className="rounded-xl text-xs text-gray-500">
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl border-gray-200" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40 rounded-xl border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                <SelectItem value="PROCTOR">Proctor</SelectItem>
                <SelectItem value="LEARNER">Learner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : filtered.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filtered.filter(u => u.id !== currentUserId).length > 0 && filtered.filter(u => u.id !== currentUserId).every((u: any) => selected.has(u.id))}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="text-gray-500 font-medium">User</TableHead>
                  <TableHead className="text-gray-500 font-medium">Role</TableHead>
                  <TableHead className="text-gray-500 font-medium">Enrollments</TableHead>
                  <TableHead className="text-gray-500 font-medium">Certificates</TableHead>
                  <TableHead className="text-gray-500 font-medium">Joined</TableHead>
                  <TableHead className="text-gray-500 font-medium">Status</TableHead>
                  <TableHead className="text-gray-500 font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u: any) => {
                  const initials = `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase()
                  return (
                    <TableRow key={u.id} className={`border-gray-50 hover:bg-gray-50/50 ${selected.has(u.id) ? "bg-emerald-50/40" : ""}`}>
                      <TableCell className="w-10">
                        {u.id !== currentUserId && (
                          <Checkbox checked={selected.has(u.id)} onCheckedChange={() => toggleSelect(u.id)} aria-label="Select user" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleColors[u.role]}`}>{u.role}</span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{u._count?.enrollments ?? 0}</TableCell>
                      <TableCell className="text-sm text-gray-600">{u._count?.certificates ?? 0}</TableCell>
                      <TableCell className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select value={u.role} onValueChange={(val) => changeRole(u.id, val)}>
                            <SelectTrigger className="h-7 w-32 rounded-xl text-xs border-gray-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LEARNER">Learner</SelectItem>
                              <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                              <SelectItem value="PROCTOR">Proctor</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm" variant="outline"
                            onClick={() => toggleActive(u.id, u.isActive)}
                            className={`rounded-xl text-xs ${u.isActive ? "hover:border-red-400 hover:text-red-600" : "hover:border-emerald-500 hover:text-emerald-600"}`}
                          >
                            {u.isActive ? <><UserX className="h-3 w-3 mr-1" />Deactivate</> : <><UserCheck className="h-3 w-3 mr-1" />Activate</>}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" /> Delete {selected.size} user{selected.size > 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action is <strong>permanent</strong> and cannot be undone. All data associated with the selected
              user{selected.size > 1 ? "s" : ""} — including enrollments, certificates, and assessment results — will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={bulkLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={bulkDelete}
              disabled={bulkLoading}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
