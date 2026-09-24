"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Award, Search, Download, Loader2, CheckCircle } from "lucide-react"
import { PaginationControls } from "@/components/ui/pagination-controls"

export default function CertificatesPage() {
  const { data: session } = useSession()
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Pagination states
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [dbStats, setDbStats] = useState({ total: 0, valid: 0, coursesCount: 0 })
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const role = session?.user?.role?.toLowerCase()

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const fetchCertificates = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search: debouncedSearch,
    })
    fetch(`/api/certificates?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        if (data.data) {
          setCertificates(data.data)
          setTotal(data.total)
          setTotalPages(data.totalPages)
          if (data.stats) setDbStats(data.stats)
        }
      })
      .finally(() => setLoading(false))
  }, [page, limit, debouncedSearch])

  useEffect(() => {
    if (session) {
      fetchCertificates()
    }
  }, [session, fetchCertificates])

  const filtered = certificates

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {role === "admin" ? "All Certificates" : "My Certificates"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {role === "admin" ? "Certificates issued across all learners" : "Your earned certificates and credentials"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Issued", value: dbStats.total, gradient: "from-violet-500 to-purple-600" },
          { label: "Valid", value: dbStats.valid, gradient: "from-emerald-500 to-teal-600" },
          { label: "Courses", value: dbStats.coursesCount, gradient: "from-blue-500 to-cyan-600" },
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-md group hover:shadow-xl transition-all duration-300 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{s.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{s.value}</p>
                </div>
                <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Award className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Certificates */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search certificates..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl border-gray-200" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : filtered.length > 0 ? (
            <>
              {role === "learner" ? (
                <div className="space-y-4">
                  {filtered.map((c: any) => (
                    <div key={c.id} className="flex items-center gap-4 p-5 rounded-2xl border border-gray-100 bg-gradient-to-r from-violet-50 to-purple-50 hover:shadow-md transition-all duration-200">
                      <div className="h-16 w-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
                        <Award className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-bold text-gray-900">{c.title}</h3>
                          {c.isValid && <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold"><CheckCircle className="h-3 w-3" />Valid</span>}
                        </div>
                        <p className="text-sm text-gray-500">{c.course?.title}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Issued: {new Date(c.issuedAt).toLocaleDateString()} · #{c.certificateNumber}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <a href={`/api/certificates/${c.id}/download`} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs"><Download className="h-3 w-3 mr-1" />Download</Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-100">
                      {role === "admin" && <TableHead className="text-gray-500 font-medium">Learner</TableHead>}
                      <TableHead className="text-gray-500 font-medium">Certificate</TableHead>
                      <TableHead className="text-gray-500 font-medium">Course</TableHead>
                      <TableHead className="text-gray-500 font-medium">Certificate #</TableHead>
                      <TableHead className="text-gray-500 font-medium">Issued</TableHead>
                      <TableHead className="text-gray-500 font-medium">Status</TableHead>
                      <TableHead className="text-gray-500 font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((c: any) => (
                      <TableRow key={c.id} className="border-gray-50 hover:bg-gray-50/50">
                        {role === "admin" && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                                {c.user?.firstName?.[0]}{c.user?.lastName?.[0]}
                              </div>
                              <span className="text-sm font-medium">{c.user?.firstName} {c.user?.lastName}</span>
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="font-medium text-sm text-gray-900">{c.title}</TableCell>
                        <TableCell className="text-sm text-gray-600">{c.course?.title}</TableCell>
                        <TableCell className="text-xs text-gray-400 font-mono">#{c.certificateNumber}</TableCell>
                        <TableCell className="text-xs text-gray-400">{new Date(c.issuedAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.isValid ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                            {c.isValid ? "Valid" : "Expired"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1.5">
                            <a href={`/api/certificates/${c.id}/download`} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="rounded-xl text-xs"><Download className="h-3 w-3 mr-1" />PDF</Button>
                            </a>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
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
              <Award className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No certificates found</p>
              {role === "learner" && <p className="text-xs mt-1">Complete a course to earn your first certificate!</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
