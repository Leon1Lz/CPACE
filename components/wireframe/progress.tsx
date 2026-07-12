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
import {
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  ChevronRight,
  Calendar,
} from "lucide-react"
import { PlaceholderAvatar, PlaceholderChart, WireframeLabel } from "./placeholder"

// Progress Tracking Dashboard (Admin/Instructor View)
export function ProgressTrackingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Learner Progress</h1>
          <p className="text-sm text-muted-foreground">
            Track and analyze learner performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <WireframeLabel>Analytics Dashboard</WireframeLabel>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 border rounded-md px-3 py-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Apr 1 - May 4, 2026</span>
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
            <SelectValue placeholder="Course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            <SelectItem value="marketing">Marketing Fundamentals</SelectItem>
            <SelectItem value="digital">Digital Marketing</SelectItem>
            <SelectItem value="financial">Financial Planning</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Avg. Completion
                </p>
                <p className="text-2xl font-bold mt-1">68%</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-chart-1">
                  <TrendingUp className="h-3 w-3" />
                  +5% from last month
                </div>
              </div>
              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Avg. Score
                </p>
                <p className="text-2xl font-bold mt-1">78%</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-chart-1">
                  <TrendingUp className="h-3 w-3" />
                  +2% from last month
                </div>
              </div>
              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Active Learners
                </p>
                <p className="text-2xl font-bold mt-1">185</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  of 248 enrolled
                </div>
              </div>
              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  At-Risk Learners
                </p>
                <p className="text-2xl font-bold mt-1">12</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  Needs attention
                </div>
              </div>
              <div className="h-10 w-10 rounded-md bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Completion Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <PlaceholderChart type="line" className="h-[250px]" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <PlaceholderChart type="bar" className="h-[250px]" />
          </CardContent>
        </Card>
      </div>

      {/* Course Comparison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Course Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                course: "Marketing Fundamentals",
                enrolled: 45,
                completion: 72,
                avgScore: 81,
              },
              {
                course: "Digital Marketing Strategy",
                enrolled: 32,
                completion: 58,
                avgScore: 76,
              },
              {
                course: "Financial Planning",
                enrolled: 28,
                completion: 65,
                avgScore: 79,
              },
              {
                course: "Operations Management",
                enrolled: 22,
                completion: 45,
                avgScore: 74,
              },
              {
                course: "Business Communication",
                enrolled: 38,
                completion: 85,
                avgScore: 88,
              },
            ].map((course, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 rounded border"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{course.course}</p>
                  <p className="text-xs text-muted-foreground">
                    {course.enrolled} learners
                  </p>
                </div>
                <div className="w-32">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Completion</span>
                    <span>{course.completion}%</span>
                  </div>
                  <Progress value={course.completion} className="h-1.5" />
                </div>
                <div className="w-20 text-center">
                  <p className="text-lg font-bold">{course.avgScore}%</p>
                  <p className="text-[10px] text-muted-foreground">Avg Score</p>
                </div>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Learner Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Learner Details</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search learners..." className="pl-9 h-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Learner</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Avg. Score</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  name: "Maria Santos",
                  email: "maria@example.com",
                  program: "CMS",
                  progress: 75,
                  score: 82,
                  lastActive: "2 hours ago",
                  status: "On Track",
                },
                {
                  name: "Juan dela Cruz",
                  email: "juan@example.com",
                  program: "CFM",
                  progress: 45,
                  score: 78,
                  lastActive: "1 day ago",
                  status: "On Track",
                },
                {
                  name: "Ana Reyes",
                  email: "ana@example.com",
                  program: "CMS",
                  progress: 25,
                  score: 65,
                  lastActive: "7 days ago",
                  status: "At Risk",
                },
                {
                  name: "Pedro Garcia",
                  email: "pedro@example.com",
                  program: "COM",
                  progress: 92,
                  score: 88,
                  lastActive: "3 hours ago",
                  status: "Ahead",
                },
              ].map((learner, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <PlaceholderAvatar size="sm" />
                      <div>
                        <p className="font-medium">{learner.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {learner.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{learner.program}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 w-32">
                      <Progress value={learner.progress} className="h-1.5" />
                      <span className="text-xs">{learner.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{learner.score}%</TableCell>
                  <TableCell className="text-muted-foreground">
                    {learner.lastActive}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        learner.status === "At Risk"
                          ? "destructive"
                          : learner.status === "Ahead"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {learner.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
