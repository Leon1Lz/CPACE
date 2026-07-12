"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Search,
  Plus,
  MoreHorizontal,
  Users,
  UserCheck,
  UserX,
  Mail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { PlaceholderAvatar, WireframeLabel } from "./placeholder"

// User Management Page
export function UserManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage administrators, instructors, and learners
          </p>
        </div>
        <div className="flex items-center gap-2">
          <WireframeLabel>Admin Only</WireframeLabel>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account for the learning portal
                </DialogDescription>
              </DialogHeader>
              <AddUserForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: 287, icon: Users },
          { label: "Administrators", value: 5, icon: UserCheck },
          { label: "Instructors", value: 12, icon: UserCheck },
          { label: "Learners", value: 270, icon: Users },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." className="pl-9" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Administrator</SelectItem>
            <SelectItem value="instructor">Instructor</SelectItem>
            <SelectItem value="learner">Learner</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Enrolled Courses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  name: "Maria Santos",
                  email: "maria@example.com",
                  role: "Learner",
                  courses: 3,
                  status: "Active",
                  lastLogin: "2 hours ago",
                },
                {
                  name: "Juan dela Cruz",
                  email: "juan@example.com",
                  role: "Learner",
                  courses: 2,
                  status: "Active",
                  lastLogin: "1 day ago",
                },
                {
                  name: "Dr. Ana Reyes",
                  email: "ana.reyes@example.com",
                  role: "Instructor",
                  courses: 4,
                  status: "Active",
                  lastLogin: "3 hours ago",
                },
                {
                  name: "Pedro Garcia",
                  email: "pedro@example.com",
                  role: "Learner",
                  courses: 1,
                  status: "Inactive",
                  lastLogin: "30 days ago",
                },
                {
                  name: "Admin User",
                  email: "admin@cpace.ph",
                  role: "Administrator",
                  courses: 0,
                  status: "Active",
                  lastLogin: "Just now",
                },
              ].map((user, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <PlaceholderAvatar size="sm" />
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === "Administrator"
                          ? "default"
                          : user.role === "Instructor"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.courses > 0 ? `${user.courses} courses` : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          user.status === "Active"
                            ? "bg-chart-1"
                            : "bg-muted-foreground"
                        }`}
                      />
                      {user.status}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.lastLogin}
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
          Showing 1-5 of 287 users
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
          <span className="text-muted-foreground">...</span>
          <Button variant="ghost" size="sm">
            58
          </Button>
          <Button variant="outline" size="sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Add User Form Component
function AddUserForm() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input placeholder="Juan" />
        </div>
        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input placeholder="dela Cruz" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Email Address</Label>
        <Input type="email" placeholder="juan@example.com" />
      </div>

      <div className="space-y-2">
        <Label>Phone (Optional)</Label>
        <Input type="tel" placeholder="+63 912 345 6789" />
      </div>

      <div className="space-y-2">
        <Label>Role</Label>
        <Select defaultValue="learner">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="learner">Learner</SelectItem>
            <SelectItem value="instructor">Instructor</SelectItem>
            <SelectItem value="admin">Administrator</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Enroll in Programs</Label>
        <div className="space-y-2">
          {["CMS - Certified Marketing Specialist", "CFM - Certified Financial Manager", "COM - Certified Operations Manager"].map(
            (program, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Checkbox id={`program-${i}`} />
                <Label htmlFor={`program-${i}`} className="font-normal text-sm">
                  {program}
                </Label>
              </div>
            )
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch id="send-welcome" defaultChecked />
        <Label htmlFor="send-welcome" className="font-normal">
          Send welcome email with login credentials
        </Label>
      </div>

      <DialogFooter>
        <Button variant="outline">Cancel</Button>
        <Button>Create User</Button>
      </DialogFooter>
    </div>
  )
}

// User Profile Page (Individual Learner View by Admin/Instructor)
export function UserProfilePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <span>User Management</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Maria Santos</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <PlaceholderAvatar size="lg" />
          <div>
            <h1 className="text-2xl font-bold">Maria Santos</h1>
            <p className="text-muted-foreground">maria@example.com</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge>Learner</Badge>
              <Badge variant="secondary">CMS Program</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WireframeLabel>User Profile</WireframeLabel>
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Send Message
          </Button>
          <Button variant="outline">Edit Profile</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Course Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                course: "Marketing Fundamentals",
                progress: 75,
                status: "In Progress",
              },
              {
                course: "Digital Marketing Strategy",
                progress: 45,
                status: "In Progress",
              },
              {
                course: "Business Communication",
                progress: 100,
                status: "Completed",
              },
            ].map((course, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 rounded border"
              >
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                  <span className="text-xs font-medium">{course.progress}%</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{course.course}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-chart-1 rounded-full"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                    <Badge
                      variant={
                        course.status === "Completed" ? "default" : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {course.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* User Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">
                Enrolled Date
              </span>
              <span className="font-medium">Jan 15, 2026</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">
                Total Courses
              </span>
              <span className="font-medium">3</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Completed</span>
              <span className="font-medium">1</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Avg. Score</span>
              <span className="font-medium">82%</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">
                Certificates
              </span>
              <span className="font-medium">1</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Last Active</span>
              <span className="font-medium">2 hours ago</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assessment History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assessment</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  name: "Module 1 Quiz",
                  course: "Marketing Fundamentals",
                  score: "85%",
                  date: "Apr 25, 2026",
                  status: "Passed",
                },
                {
                  name: "Module 2 Quiz",
                  course: "Marketing Fundamentals",
                  score: "78%",
                  date: "Apr 28, 2026",
                  status: "Passed",
                },
                {
                  name: "Case Study 1",
                  course: "Digital Marketing",
                  score: "92%",
                  date: "May 1, 2026",
                  status: "Passed",
                },
              ].map((assessment, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">
                    {assessment.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {assessment.course}
                  </TableCell>
                  <TableCell>{assessment.score}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {assessment.date}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">{assessment.status}</Badge>
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
