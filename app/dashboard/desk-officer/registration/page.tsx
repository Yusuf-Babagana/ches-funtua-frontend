"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { mockCourseRegistrations, mockStudents, mockCourses } from "@/lib/mock-data"
import { CheckCircle, XCircle } from "lucide-react"

export default function CourseRegistrationPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.role !== "desk_officer")) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading || !user) return null

  const pendingRegistrations = mockCourseRegistrations.filter((r) => r.status === "pending")

  const getStudentName = (studentId: string) => {
    const student = mockStudents.find((s) => s.id === studentId)
    return student?.full_name || "Unknown"
  }

  const getStudentId = (studentId: string) => {
    const student = mockStudents.find((s) => s.id === studentId)
    return student?.student_id || "N/A"
  }

  const getCourseName = (courseId: string) => {
    const course = mockCourses.find((c) => c.id === courseId)
    return course ? `${course.code} - ${course.title}` : "Unknown Course"
  }

  return (
    <DashboardLayout title="Course Registration" role="desk_officer">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pending Course Registrations</CardTitle>
            <CardDescription>Approve or reject student course registrations</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRegistrations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No pending registrations</p>
            ) : (
              <div className="space-y-4">
                {pendingRegistrations.map((registration) => (
                  <Card key={registration.id}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2">
                          <div>
                            <h3 className="font-semibold">{getStudentName(registration.student_id)}</h3>
                            <p className="text-sm text-muted-foreground">{getStudentId(registration.student_id)}</p>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex gap-2">
                              <span className="text-muted-foreground">Course:</span>
                              <span className="font-medium">{getCourseName(registration.course_id)}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-muted-foreground">Semester:</span>
                              <span className="font-medium">{registration.semester}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-muted-foreground">Academic Year:</span>
                              <span className="font-medium">{registration.academic_year}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-muted-foreground">Registered:</span>
                              <span className="font-medium">
                                {new Date(registration.registered_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" className="text-red-600 bg-transparent">
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                          <Button>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
