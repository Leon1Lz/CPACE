"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Users, 
  Clock, 
  BookOpen,
  TrendingUp,
  CheckCircle,
  Loader2,
  GraduationCap,
  Globe,
  EyeOff,
  Archive,
} from "lucide-react"
import { useSession } from "next-auth/react"

interface Course {
  id: string
  title: string
  description: string
  category: string
  level: string
  duration: string
  status: string
  thumbnail?: string
  createdAt: string
  updatedAt: string
  creator: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  instructor: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  _count: {
    enrollments: number
    modules: number
    assessments: number
  }
}

export default function CoursesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("ALL")
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())

  const role = session?.user?.role?.toLowerCase()

  useEffect(() => {
    fetchCourses()
    if (role === "learner") {
      fetch("/api/enrollments").then(r => r.json()).then(data => {
        if (Array.isArray(data)) setEnrolledIds(new Set(data.map((e: any) => e.courseId)))
      })
    }
  }, [filterCategory, filterStatus, role])

  const fetchCourses = async () => {
    try {
      const params = new URLSearchParams()
      if (filterCategory && filterCategory !== "ALL") params.append("category", filterCategory)
      if (filterStatus && filterStatus !== "ALL") params.append("status", filterStatus)

      const response = await fetch(`/api/courses?${params}&limit=100`)
      if (response.ok) {
        const json = await response.json()
        setCourses(Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [])
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "bg-green-100 text-green-800"
      case "DRAFT": return "bg-yellow-100 text-yellow-800"
      case "ARCHIVED": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const stats = {
    totalCourses: courses.length,
    publishedCourses: courses.filter(c => c.status === "PUBLISHED").length,
    totalStudents: courses.reduce((sum, course) => sum + course._count.enrollments, 0),
  }

  const handlePublishToggle = async (courseId: string, currentStatus: string) => {
    const newStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED"
    const res = await fetch(`/api/courses/${courseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: newStatus } : c))
    }
  }

  const handleArchive = async (courseId: string) => {
    const res = await fetch(`/api/courses/${courseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ARCHIVED" }),
    })
    if (res.ok) {
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: "ARCHIVED" } : c))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  // ── LEARNER VIEW: show only assigned courses ──────────
  if (role === "learner") {
    const enrolledCourses = filteredCourses.filter(c => enrolledIds.has(c.id))
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-sm text-gray-500 mt-1">Your assigned learning programs</p>
        </div>

        {enrolledCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="h-12 w-12 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-400">No courses assigned yet</p>
            <p className="text-xs text-gray-400 mt-1">Contact your administrator if you expect to have course access</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {enrolledCourses.map(course => {
              const CATEGORY_COLORS: Record<string, string> = {
                CFMS: "from-emerald-600 to-teal-700",
                CMMS: "from-blue-600 to-indigo-700",
                COMS: "from-orange-500 to-amber-600",
              }
              const gradient = CATEGORY_COLORS[course.category] ?? "from-gray-500 to-gray-600"
              return (
                <Link key={course.id} href={`/dashboard/learn/courses/${course.id}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col">
                  <div className={`bg-gradient-to-r ${gradient} px-5 py-6`}>
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                      <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-bold text-white text-base leading-snug">{course.title}</h3>
                    <span className="text-xs text-white/70 mt-1 inline-block">{course.category}</span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-sm text-gray-500 line-clamp-2 flex-1">{course.description}</p>
                    <div className="flex items-center gap-3 mt-3 mb-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course._count.enrollments} learners</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-xl px-4 py-2.5">
                      <CheckCircle className="h-4 w-4" /> Continue Learning
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Course Management</h1>
          <p className="text-gray-600">Create and manage your courses</p>
        </div>
        <Link href="/dashboard/courses/create">
          <Button className="bg-cpace-600 hover:bg-cpace-700">
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-cpace-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold">{stats.totalCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold">{stats.publishedCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                <SelectItem value="CFMS">CFMS</SelectItem>
                <SelectItem value="CMMS">CMMS</SelectItem>
                <SelectItem value="COMS">COMS</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Courses</CardTitle>
          <CardDescription>
            Manage your course content and track performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || (filterCategory !== "ALL") || (filterStatus !== "ALL") 
                  ? "Try adjusting your search or filters" 
                  : "Get started by creating your first course"}
              </p>
              {!searchTerm && filterCategory === "ALL" && filterStatus === "ALL" && (
                <Link href="/dashboard/courses/create">
                  <Button className="bg-cpace-600 hover:bg-cpace-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Course
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{course.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {course.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{course.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{course._count.enrollments}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(course.status)}>
                        {course.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {new Date(course.updatedAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/courses/${course.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/courses/${course.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/courses/${course.id}/participants`}>
                              <Users className="mr-2 h-4 w-4" />
                              Participants
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handlePublishToggle(course.id, course.status)}>
                            {course.status === "PUBLISHED"
                              ? <><EyeOff className="mr-2 h-4 w-4" />Unpublish</>
                              : <><Globe className="mr-2 h-4 w-4 text-emerald-600" />Publish</>
                            }
                          </DropdownMenuItem>
                          {course.status !== "ARCHIVED" && (
                            <DropdownMenuItem onClick={() => handleArchive(course.id)} className="text-gray-500">
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
