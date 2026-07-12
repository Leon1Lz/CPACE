"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Plus,
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react"
import { PlaceholderAvatar, WireframeLabel } from "./placeholder"

// Assessment List Page
export function AssessmentListPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assessments</h1>
          <p className="text-sm text-muted-foreground">
            Manage quizzes and examinations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <WireframeLabel>Assessment Management</WireframeLabel>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Assessment
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search assessments..." className="pl-9" />
        </div>
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
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="quiz">Quiz</SelectItem>
            <SelectItem value="exam">Exam</SelectItem>
            <SelectItem value="assignment">Assignment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Assessment Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assessment Name</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  name: "Module 1 Quiz",
                  course: "Marketing Fundamentals",
                  type: "Quiz",
                  questions: 15,
                  submissions: 42,
                  status: "Active",
                },
                {
                  name: "Midterm Examination",
                  course: "Marketing Fundamentals",
                  type: "Exam",
                  questions: 50,
                  submissions: 38,
                  status: "Active",
                },
                {
                  name: "Case Study Analysis",
                  course: "Digital Marketing",
                  type: "Assignment",
                  questions: 5,
                  submissions: 12,
                  status: "Active",
                },
                {
                  name: "Module 3 Quiz",
                  course: "Financial Planning",
                  type: "Quiz",
                  questions: 20,
                  submissions: 0,
                  status: "Draft",
                },
              ].map((assessment, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">
                    {assessment.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {assessment.course}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{assessment.type}</Badge>
                  </TableCell>
                  <TableCell>{assessment.questions}</TableCell>
                  <TableCell>{assessment.submissions}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        assessment.status === "Active" ? "default" : "secondary"
                      }
                    >
                      {assessment.status}
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

// Take Assessment Page (Learner View)
export function TakeAssessmentPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const totalQuestions = 15
  const answeredQuestions = [0, 1, 2, 4, 7]

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Assessment Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <WireframeLabel>Assessment Mode</WireframeLabel>
              <div>
                <h1 className="font-semibold">Module 3 Quiz</h1>
                <p className="text-xs text-muted-foreground">
                  Marketing Fundamentals
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span className="font-mono">24:35</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Question {currentQuestion + 1} of {totalQuestions}
              </div>
              <Button>Submit Assessment</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      {currentQuestion + 1}
                    </span>
                    <Badge variant="secondary">Multiple Choice</Badge>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Flag className="h-4 w-4 mr-1" />
                    Flag
                  </Button>
                </div>

                <div className="space-y-6">
                  <p className="text-lg">
                    Which of the following best describes the primary purpose of
                    market segmentation in strategic marketing?
                  </p>

                  <RadioGroup defaultValue="option-1" className="space-y-3">
                    {[
                      "To divide the market into distinct groups of buyers with different needs or behaviors",
                      "To reduce marketing costs by targeting fewer customers",
                      "To create a monopoly in specific market segments",
                      "To eliminate competition from other businesses",
                    ].map((option, i) => (
                      <div
                        key={i}
                        className="flex items-center space-x-3 p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer"
                      >
                        <RadioGroupItem
                          value={`option-${i}`}
                          id={`option-${i}`}
                        />
                        <Label
                          htmlFor={`option-${i}`}
                          className="flex-1 cursor-pointer"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                disabled={currentQuestion === 0}
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                onClick={() =>
                  setCurrentQuestion(
                    Math.min(currentQuestion + 1, totalQuestions - 1)
                  )
                }
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: totalQuestions }).map((_, i) => {
                    const isAnswered = answeredQuestions.includes(i)
                    const isCurrent = i === currentQuestion
                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentQuestion(i)}
                        className={`h-8 w-8 rounded text-sm font-medium flex items-center justify-center transition-colors ${
                          isCurrent
                            ? "bg-primary text-primary-foreground"
                            : isAnswered
                            ? "bg-chart-1 text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                      >
                        {i + 1}
                      </button>
                    )
                  })}
                </div>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-chart-1" />
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-muted" />
                    <span>Unanswered</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Grading Interface (Instructor View)
export function GradingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Grade Submissions</h1>
          <p className="text-sm text-muted-foreground">
            Module 3 Quiz - Marketing Fundamentals
          </p>
        </div>
        <WireframeLabel>Grading Interface</WireframeLabel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submission List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Submissions</CardTitle>
              <Select defaultValue="pending">
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="graded">Graded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1">
              {[
                {
                  name: "Maria Santos",
                  time: "2 hours ago",
                  autoScore: 85,
                  status: "pending",
                  active: true,
                },
                {
                  name: "Juan dela Cruz",
                  time: "5 hours ago",
                  autoScore: 78,
                  status: "pending",
                },
                {
                  name: "Ana Reyes",
                  time: "1 day ago",
                  autoScore: 92,
                  status: "graded",
                },
                {
                  name: "Pedro Garcia",
                  time: "1 day ago",
                  autoScore: 65,
                  status: "graded",
                },
              ].map((submission, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded cursor-pointer hover:bg-muted ${
                    submission.active ? "bg-muted" : ""
                  }`}
                >
                  <PlaceholderAvatar size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {submission.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {submission.time}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{submission.autoScore}%</p>
                    {submission.status === "pending" ? (
                      <Badge variant="secondary" className="text-[10px]">
                        Pending
                      </Badge>
                    ) : (
                      <Badge className="text-[10px]">Graded</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Grading Detail */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PlaceholderAvatar />
                <div>
                  <CardTitle className="text-base">Maria Santos</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Submitted 2 hours ago
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">85%</p>
                <p className="text-xs text-muted-foreground">Auto-graded</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Question Review */}
            {[
              {
                question:
                  "Explain the difference between market segmentation and target marketing.",
                answer:
                  "Market segmentation is the process of dividing a broad market into subsets of consumers who have common needs and characteristics. Target marketing is the process of evaluating and selecting one or more market segments to enter.",
                type: "short-answer",
                points: 10,
                maxPoints: 10,
              },
              {
                question:
                  "Which of the following is NOT a type of market segmentation?",
                answer: "Demographic segmentation",
                correct: "Random segmentation",
                type: "multiple-choice",
                points: 5,
                maxPoints: 5,
                isCorrect: false,
              },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-lg border space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {i + 1}
                    </span>
                    <Badge variant="secondary">{item.type}</Badge>
                  </div>
                  {item.type === "multiple-choice" ? (
                    item.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-chart-1" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )
                  ) : null}
                </div>

                <p className="text-sm font-medium">{item.question}</p>

                <div className="bg-muted/50 p-3 rounded text-sm">
                  <p className="text-xs text-muted-foreground mb-1">
                    {"Learner's Answer:"}
                  </p>
                  <p>{item.answer}</p>
                </div>

                {item.correct && (
                  <div className="bg-chart-1/10 p-3 rounded text-sm">
                    <p className="text-xs text-muted-foreground mb-1">
                      Correct Answer:
                    </p>
                    <p>{item.correct}</p>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Points:</Label>
                    <Input
                      type="number"
                      defaultValue={item.points}
                      className="w-16 h-8"
                    />
                    <span className="text-xs text-muted-foreground">
                      / {item.maxPoints}
                    </span>
                  </div>
                  <div className="flex-1">
                    <Input placeholder="Add feedback..." className="h-8" />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Total Score</p>
                <p className="text-2xl font-bold">
                  15 <span className="text-muted-foreground">/ 20</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Save & Next</Button>
                <Button>Finalize Grade</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
