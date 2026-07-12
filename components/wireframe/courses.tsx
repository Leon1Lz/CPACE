"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Search,
  Plus,
  BookOpen,
  Users,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  FileText,
  Video,
  CheckCircle2,
  Circle,
  Play,
} from "lucide-react"
import { PlaceholderBox, PlaceholderText, WireframeLabel } from "./placeholder"

// Course List Page (Admin/Instructor View)
export function CourseListPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Courses</h1>
          <p className="text-sm text-muted-foreground">
            Manage all courses and programs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <WireframeLabel>Course Management</WireframeLabel>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search courses..." className="pl-9" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Program" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            <SelectItem value="cms">CMS</SelectItem>
            <SelectItem value="cfm">CFM</SelectItem>
            <SelectItem value="com">COM</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Course Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox />
                </TableHead>
                <TableHead>Course Name</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Modules</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  name: "Marketing Fundamentals",
                  program: "CMS",
                  modules: 8,
                  enrolled: 45,
                  status: "Active",
                },
                {
                  name: "Digital Marketing Strategy",
                  program: "CMS",
                  modules: 6,
                  enrolled: 32,
                  status: "Active",
                },
                {
                  name: "Financial Planning",
                  program: "CFM",
                  modules: 10,
                  enrolled: 28,
                  status: "Active",
                },
                {
                  name: "Operations Management",
                  program: "COM",
                  modules: 7,
                  enrolled: 0,
                  status: "Draft",
                },
                {
                  name: "Business Analytics",
                  program: "CFM",
                  modules: 5,
                  enrolled: 15,
                  status: "Active",
                },
              ].map((course, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <span className="font-medium">{course.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{course.program}</Badge>
                  </TableCell>
                  <TableCell>{course.modules} modules</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      {course.enrolled}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        course.status === "Active" ? "default" : "secondary"
                      }
                    >
                      {course.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing 1-5 of 18 courses
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            1
          </Button>
          <Button variant="ghost" size="sm">
            2
          </Button>
          <Button variant="ghost" size="sm">
            3
          </Button>
          <Button variant="outline" size="sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Course Create/Edit Page
export function CourseEditorPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create Course</h1>
          <p className="text-sm text-muted-foreground">
            Add a new course to the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <WireframeLabel>Course Editor</WireframeLabel>
          <Button variant="outline">Save Draft</Button>
          <Button>Publish Course</Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="content">Modules & Content</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Course Title</label>
                  <Input placeholder="Enter course title" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Program</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cms">
                        CMS - Certified Marketing Specialist
                      </SelectItem>
                      <SelectItem value="cfm">
                        CFM - Certified Financial Manager
                      </SelectItem>
                      <SelectItem value="com">
                        COM - Certified Operations Manager
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <div className="min-h-[150px] border rounded-md p-3 bg-muted/30">
                  <PlaceholderText lines={4} />
                  <p className="text-xs text-muted-foreground mt-2">
                    Rich text editor placeholder
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Course Thumbnail</label>
                  <PlaceholderBox
                    aspectRatio="video"
                    label="Upload Image"
                    className="cursor-pointer hover:border-primary"
                  />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select defaultValue="draft">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Estimated Duration
                    </label>
                    <Input placeholder="e.g., 8 hours" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Course Modules</h3>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Module
                  </Button>
                </div>

                {[1, 2, 3].map((module) => (
                  <Card key={module} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-sm font-medium">
                            {module}
                          </div>
                          <Input
                            defaultValue={`Module ${module}: Introduction`}
                            className="w-64"
                          />
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="ml-11 space-y-2">
                        <div className="flex items-center gap-2 p-2 rounded border bg-card">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Reading: Overview</span>
                          <Badge variant="secondary" className="ml-auto">
                            Text
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded border bg-card">
                          <Video className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Video: Key Concepts
                          </span>
                          <Badge variant="secondary" className="ml-auto">
                            Video
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm" className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Content
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground text-center py-8">
                Assessment configuration placeholder
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground text-center py-8">
                Course settings placeholder
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Course View Page (Learner View)
export function CourseViewPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Course Sidebar */}
      <div className="w-80 border-r bg-card overflow-y-auto">
        <div className="p-4 border-b">
          <WireframeLabel className="mb-2">Course Player</WireframeLabel>
          <h2 className="font-bold">Marketing Fundamentals</h2>
          <p className="text-xs text-muted-foreground mt-1">CMS Program</p>
          <div className="flex items-center gap-2 mt-3">
            <Progress value={65} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground">65%</span>
          </div>
        </div>

        <div className="p-2">
          {[
            {
              title: "Module 1: Introduction",
              completed: true,
              items: [
                { name: "Welcome & Overview", completed: true, type: "text" },
                { name: "Course Objectives", completed: true, type: "video" },
              ],
            },
            {
              title: "Module 2: Fundamentals",
              completed: true,
              items: [
                { name: "Core Concepts", completed: true, type: "text" },
                { name: "Case Study", completed: true, type: "text" },
                { name: "Quiz 1", completed: true, type: "quiz" },
              ],
            },
            {
              title: "Module 3: Strategies",
              completed: false,
              items: [
                { name: "Strategy Framework", completed: true, type: "video" },
                { name: "Implementation Guide", completed: false, type: "text", active: true },
                { name: "Quiz 2", completed: false, type: "quiz" },
              ],
            },
            {
              title: "Module 4: Digital Marketing",
              completed: false,
              items: [
                { name: "Digital Channels", completed: false, type: "text" },
                { name: "Analytics Basics", completed: false, type: "video" },
              ],
            },
          ].map((module, i) => (
            <div key={i} className="mb-2">
              <div
                className={`flex items-center gap-2 p-2 rounded text-sm font-medium ${
                  module.completed ? "text-muted-foreground" : ""
                }`}
              >
                {module.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-chart-1" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
                {module.title}
              </div>
              <div className="ml-6 space-y-1">
                {module.items.map((item, j) => (
                  <div
                    key={j}
                    className={`flex items-center gap-2 p-2 rounded text-sm cursor-pointer hover:bg-muted ${
                      item.active ? "bg-muted font-medium" : ""
                    } ${item.completed ? "text-muted-foreground" : ""}`}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="h-3 w-3 text-chart-1" />
                    ) : (
                      <Circle className="h-3 w-3" />
                    )}
                    {item.name}
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      {item.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                Module 3: Strategies
              </p>
              <h1 className="text-xl font-bold">Implementation Guide</h1>
            </div>
            <Badge variant="secondary">Reading</Badge>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <PlaceholderBox
              aspectRatio="video"
              label="Content Display Area"
              className="mb-6"
            />

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Section Title</h2>
              <PlaceholderText lines={4} />
              <PlaceholderText lines={3} />
              <PlaceholderText lines={5} />
            </div>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="border-t p-4">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <Button variant="outline">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button variant="outline">Mark as Complete</Button>
            <Button>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
