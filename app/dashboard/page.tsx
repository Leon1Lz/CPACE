"use client"

import { useSession } from "next-auth/react"
import { AdminDashboard, InstructorDashboard, LearnerDashboard, ProctorDashboard } from "@/components/wireframe/dashboards"

export default function DashboardPage() {
  const { data: session } = useSession()
  if (!session) return null

  const userRole = session.user.role?.toLowerCase()
  const userName = session.user.name || "User"

  return (
    <>
      {userRole === "admin" && <AdminDashboard userName={userName} />}
      {userRole === "instructor" && <InstructorDashboard userName={userName} />}
      {userRole === "learner" && <LearnerDashboard userName={userName} />}
      {userRole === "proctor" && <ProctorDashboard userName={userName} />}
    </>
  )
}
