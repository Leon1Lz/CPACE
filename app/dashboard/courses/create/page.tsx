"use client"

import { CourseCreationForm } from "@/components/courses/course-creation-form"

// The dashboard layout (app/dashboard/layout.tsx) already renders the sidebar,
// header, and breadcrumbs. Rendering them here as well caused a doubled shell.
export default function CreateCoursePage() {
  return <CourseCreationForm />
}
