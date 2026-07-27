"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { SafeHtml } from "@/components/ui/safe-html"
import { Loader2, Save, Eye, X, Plus } from "lucide-react"
import { useSession } from "next-auth/react"

interface CourseFormData {
  title: string
  description: string
  content: string
  category: string
  level: string
  duration: string
  price: string
  thumbnail: string
  status: "DRAFT" | "PUBLISHED"
}

export function CourseCreationForm() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [previewMode, setPreviewMode] = useState(false)

  const [formData, setFormData] = useState<CourseFormData>({
    title: "",
    description: "",
    content: "",
    category: "",
    level: "",
    duration: "",
    price: "",
    thumbnail: "",
    status: "DRAFT"
  })

  const [learningObjectives, setLearningObjectives] = useState<string[]>([])
  const [newObjective, setNewObjective] = useState("")

  const categories = [
    "Marketing",
    "Finance", 
    "Operations",
    "Management",
    "Technology",
    "Leadership",
    "Communication"
  ]

  const levels = ["Beginner", "Intermediate", "Advanced", "All Levels"]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          learningObjectives,
          price: formData.price ? parseFloat(formData.price) : 0
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Course created successfully!")
        setTimeout(() => {
          router.push("/dashboard/courses")
        }, 2000)
      } else {
        setError(data.error || "Failed to create course")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof CourseFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addLearningObjective = () => {
    if (newObjective.trim()) {
      setLearningObjectives([...learningObjectives, newObjective.trim()])
      setNewObjective("")
    }
  }

  const removeLearningObjective = (index: number) => {
    setLearningObjectives(learningObjectives.filter((_, i) => i !== index))
  }

  if (previewMode) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Course Preview</h2>
          <Button onClick={() => setPreviewMode(false)} variant="outline">
            Back to Edit
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{formData.title || "Course Title"}</h1>
                <div className="flex gap-2 mb-4">
                  <Badge variant="secondary">{formData.category || "Category"}</Badge>
                  <Badge variant="outline">{formData.level || "Level"}</Badge>
                  <Badge variant="outline">{formData.duration || "Duration"}</Badge>
                </div>
                <p className="text-gray-600 text-lg">{formData.description || "Course description will appear here..."}</p>
              </div>

              {formData.price && (
                <div className="text-2xl font-bold text-cpace-600">
                  ${formData.price}
                </div>
              )}

              {learningObjectives.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">What You'll Learn</h3>
                  <ul className="space-y-2">
                    {learningObjectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-cpace-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="text-xl font-semibold mb-3">Course Content</h3>
                {formData.content ? (
                  <SafeHtml
                    html={formData.content}
                    className="prose prose-sm max-w-none text-gray-700 leading-relaxed border rounded-xl p-4 bg-gray-50"
                    externalLinks
                  />
                ) : (
                  <p className="text-gray-400 text-sm border rounded-xl p-4 bg-gray-50 italic">Course content will appear here...</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Create New Course</h2>
          <p className="text-gray-600">Build your course content and publish it to learners</p>
        </div>
        <Button onClick={() => setPreviewMode(true)} variant="outline">
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential details about your course</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Enter course title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Course Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Write a compelling description for your course"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Level *</Label>
                <Select value={formData.level} onValueChange={(value) => handleChange("level", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration *</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => handleChange("duration", e.target.value)}
                  placeholder="e.g., 8 weeks, 40 hours"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learning Objectives */}
        <Card>
          <CardHeader>
            <CardTitle>Learning Objectives</CardTitle>
            <CardDescription>What will learners be able to do after completing this course?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                placeholder="Enter a learning objective"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLearningObjective())}
              />
              <Button type="button" onClick={addLearningObjective} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {learningObjectives.length > 0 && (
              <div className="space-y-2">
                {learningObjectives.map((objective, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span>{objective}</span>
                    <Button
                      type="button"
                      onClick={() => removeLearningObjective(index)}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Content */}
        <Card>
          <CardHeader>
            <CardTitle>Course Content</CardTitle>
            <CardDescription>
              Write your full course overview using the rich text editor below — headings, lists, quotes, code blocks, and links are all supported.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <RichTextEditor
              value={formData.content}
              onChange={(val) => handleChange("content", val)}
              placeholder="Write your course overview, learning objectives, or introductory material here…"
              minHeight="320px"
            />
            <p className="text-xs text-gray-400 mt-1">
              Tip: Use Ctrl+B for bold, Ctrl+I for italic, Ctrl+Z to undo.
            </p>
          </CardContent>
        </Card>

        {/* Publishing Options */}
        <Card>
          <CardHeader>
            <CardTitle>Publishing Options</CardTitle>
            <CardDescription>Control how your course is published</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Publication Status</Label>
              <Select value={formData.status} onValueChange={(value: "DRAFT" | "PUBLISHED") => handleChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft - Save but don't publish</SelectItem>
                  <SelectItem value="PUBLISHED">Published - Make available to learners</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input
                id="thumbnail"
                value={formData.thumbnail}
                onChange={(e) => handleChange("thumbnail", e.target.value)}
                placeholder="https://example.com/course-thumbnail.jpg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-cpace-600 hover:bg-cpace-700">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Course...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Course
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
