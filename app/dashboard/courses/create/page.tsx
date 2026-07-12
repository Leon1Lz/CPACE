"use client"

import { CourseCreationForm } from "@/components/courses/course-creation-form"
import { AppSidebar } from "@/components/wireframe/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { useSession } from "next-auth/react"

export default function CreateCoursePage() {
  const { data: session } = useSession()
  const userRole = session?.user?.role?.toLowerCase() as "admin" | "instructor" | "learner"

  return (
    <SidebarProvider>
      <AppSidebar 
        role={userRole} 
        activePage="courses" 
        onNavigate={() => {}} 
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/courses">Courses</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Create Course</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex-1 overflow-auto">
          <CourseCreationForm />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
