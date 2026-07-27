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
import { Users, Search, UserCheck, UserX, GraduationCap, BookOpen, Award, Loader2, ShieldCheck, Trash2, PlusCircle, ShieldAlert } from "lucide-react"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { Textarea } from "@/components/ui/textarea"

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

  // Tabs navigation state
  const [activeTab, setActiveTab] = useState<"users" | "whitelist">("users")

  // Whitelist states
  const [whitelist, setWhitelist] = useState<any[]>([])
  const [whitelistLoading, setWhitelistLoading] = useState(false)
  const [whitelistSearch, setWhitelistSearch] = useState("")
  const [debouncedWhitelistSearch, setDebouncedWhitelistSearch] = useState("")
  const [whitelistPage, setWhitelistPage] = useState(1)
  const [whitelistTotalPages, setWhitelistTotalPages] = useState(1)
  const [whitelistTotal, setWhitelistTotal] = useState(0)

  // Whitelist upload states
  const [bulkEmails, setBulkEmails] = useState("")
  const [bulkRole, setBulkRole] = useState("LEARNER")
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    success: boolean
    message: string
    addedCount?: number
    skippedCount?: number
    invalidEmails?: string[]
  } | null>(null)

  // Pagination states
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [counts, setCounts] = useState({ total: 0, admin: 0, instructor: 0, proctor: 0, learner: 0 })
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to page 1 on search change
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const fetchUsers = () => {
    if (!session) return
    setLoading(true)
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search: debouncedSearch,
      role: roleFilter,
    })
    fetch(`/api/users?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        if (data.data) {
          setUsers(data.data)
          setTotal(data.total)
          setTotalPages(data.totalPages)
          if (data.counts) setCounts(data.counts)
        }
      })
      .finally(() => setLoading(false))
  }

  // Reset page when role filter changes
  useEffect(() => {
    setPage(1)
  }, [roleFilter])

  useEffect(() => {
    if (session && session.user.role !== "ADMIN") { router.push("/dashboard"); return }
    fetchUsers()
  }, [session, page, limit, debouncedSearch, roleFilter])

  // Debounce whitelist search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedWhitelistSearch(whitelistSearch)
      setWhitelistPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [whitelistSearch])

  // Fetch whitelist
  const fetchWhitelist = () => {
    if (!session || activeTab !== "whitelist") return
    setWhitelistLoading(true)
    const params = new URLSearchParams({
      page: whitelistPage.toString(),
      limit: "10",
      search: debouncedWhitelistSearch,
    })
    fetch(`/api/admin/pre-approved-emails?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        if (data.data) {
          setWhitelist(data.data)
          setWhitelistTotal(data.total)
          setWhitelistTotalPages(data.totalPages)
        }
      })
      .finally(() => setWhitelistLoading(false))
  }

  useEffect(() => {
    fetchWhitelist()
  }, [session, activeTab, whitelistPage, debouncedWhitelistSearch])

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bulkEmails.trim()) return
    setUploadLoading(true)
    setUploadResult(null)
    try {
      const res = await fetch("/api/admin/pre-approved-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawEmails: bulkEmails, role: bulkRole }),
      })
      const data = await res.json()
      if (res.ok) {
        setUploadResult({
          success: true,
          message: data.message,
          addedCount: data.addedCount,
          skippedCount: data.skippedCount,
          invalidEmails: data.invalidEmails,
        })
        setBulkEmails("")
        fetchWhitelist()
      } else {
        setUploadResult({
          success: false,
          message: data.error || "Failed to upload emails",
        })
      }
    } catch {
      setUploadResult({
        success: false,
        message: "An unexpected error occurred.",
      })
    } finally {
      setUploadLoading(false)
    }
  }

  const handleDeleteWhitelist = async (id: string) => {
    const res = await fetch("/api/admin/pre-approved-emails", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setWhitelist(prev => prev.filter(item => item.id !== id))
      setWhitelistTotal(prev => prev - 1)
    }
  }

  const currentUserId = (session?.user as any)?.id

  const filtered = users

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
    { label: "Total Users", value: counts.total, icon: Users, gradient: "from-emerald-500 to-teal-600" },
    { label: "Admins", value: counts.admin, icon: UserCheck, gradient: "from-rose-500 to-pink-600" },
    { label: "Instructors", value: counts.instructor, icon: BookOpen, gradient: "from-blue-500 to-cyan-600" },
    { label: "Proctors", value: counts.proctor, icon: Award, gradient: "from-violet-500 to-purple-600" },
    { label: "Learners", value: counts.learner, icon: GraduationCap, gradient: "from-amber-500 to-orange-600" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage registered users and whitelist pre-approved registration emails</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1.5 rounded-xl self-start sm:self-center">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              activeTab === "users"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Active Users
          </button>
          <button
            onClick={() => setActiveTab("whitelist")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              activeTab === "whitelist"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Pre-Approved Whitelist
          </button>
        </div>
      </div>

      {activeTab === "users" ? (
        <>
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
                <>
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
                  <PaginationControls
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    total={total}
                    limit={limit}
                  />
                </>
              ) : (
                <div className="text-center py-16 text-gray-400">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">No users found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        /* WHITELIST TAB */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bulk Paste Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <h2 className="font-bold text-gray-900 text-base">Bulk Add Emails</h2>
                <p className="text-xs text-gray-500 mt-0.5">Paste list from sheets/excel to pre-approve accounts.</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBulkUpload} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase">Paste Email List</label>
                    <Textarea
                      placeholder="email1@cpace.com&#10;email2@cpace.com&#10;email3@cpace.com, email4@cpace.com"
                      value={bulkEmails}
                      onChange={(e) => setBulkEmails(e.target.value)}
                      rows={8}
                      className="rounded-xl font-mono text-sm placeholder:font-sans"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase">Assigned Role</label>
                    <Select value={bulkRole} onValueChange={setBulkRole}>
                      <SelectTrigger className="w-full rounded-xl border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LEARNER">Learner</SelectItem>
                        <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                        <SelectItem value="PROCTOR">Proctor</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    disabled={uploadLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
                  >
                    {uploadLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    ) : (
                      <PlusCircle className="h-4 w-4 mr-1.5" />
                    )}
                    Pre-Approve Accounts
                  </Button>
                </form>

                {/* Upload feedback summary */}
                {uploadResult && (
                  <div className={`mt-5 p-4 rounded-2xl border text-xs ${
                    uploadResult.success
                      ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                      : "bg-red-50 border-red-100 text-red-800"
                  }`}>
                    <p className="font-bold mb-1">{uploadResult.message}</p>
                    {uploadResult.success && (
                      <div className="space-y-1.5 mt-2">
                        <p>✅ Added slots: <strong>{uploadResult.addedCount}</strong></p>
                        <p>ℹ️ Skipped (already registered): <strong>{uploadResult.skippedCount}</strong></p>
                        {uploadResult.invalidEmails && uploadResult.invalidEmails.length > 0 && (
                          <div className="pt-2 border-t border-emerald-100/50 text-red-600">
                            <p className="font-bold">⚠️ Invalid addresses ({uploadResult.invalidEmails.length}):</p>
                            <p className="font-mono mt-1 break-all bg-white/40 p-1.5 rounded-lg max-h-24 overflow-y-auto">
                              {uploadResult.invalidEmails.join(", ")}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex gap-3 text-xs text-gray-500 leading-relaxed">
              <ShieldAlert className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-gray-800">Why Whitelisting?</p>
                <p className="mt-0.5">Enabling whitelisting restricts self-registration. Learners will only be able to create an account if their email is pre-registered here. One-time slots are consumed automatically upon signup.</p>
              </div>
            </div>
          </div>

          {/* Current Whitelisted emails list */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="font-bold text-gray-900 text-base">Whitelisted Registrations</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Active registration tokens waiting to be claimed.</p>
                </div>
                <div className="relative w-48 sm:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="Search whitelist..."
                    value={whitelistSearch}
                    onChange={(e) => setWhitelistSearch(e.target.value)}
                    className="pl-9 rounded-xl border-gray-200 text-xs h-8"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {whitelistLoading && whitelist.length === 0 ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  </div>
                ) : whitelist.length > 0 ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-100">
                          <TableHead className="text-gray-500 font-medium text-xs">Email Address</TableHead>
                          <TableHead className="text-gray-500 font-medium text-xs">Pre-Approved Role</TableHead>
                          <TableHead className="text-gray-500 font-medium text-xs">Added On</TableHead>
                          <TableHead className="text-gray-500 font-medium text-xs text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {whitelist.map((item) => (
                          <TableRow key={item.id} className="border-gray-50 hover:bg-gray-50/50">
                            <TableCell className="font-mono text-xs font-bold text-gray-800">
                              {item.email}
                            </TableCell>
                            <TableCell>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleColors[item.role] || "bg-gray-100"}`}>
                                {item.role}
                              </span>
                            </TableCell>
                            <TableCell className="text-[10px] text-gray-400">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteWhitelist(item.id)}
                                className="h-7 w-7 rounded-lg hover:bg-red-50 hover:text-red-600 text-gray-400"
                                title="Remove pre-approval slot"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <PaginationControls
                      currentPage={whitelistPage}
                      totalPages={whitelistTotalPages}
                      onPageChange={setWhitelistPage}
                      total={whitelistTotal}
                      limit={10}
                    />
                  </>
                ) : (
                  <div className="text-center py-16 text-gray-400">
                    <Users className="h-10 w-10 mx-auto mb-2.5 opacity-20" />
                    <p className="text-xs font-medium">No pre-approved emails whitelisted</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">Whitelist is currently empty.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

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
