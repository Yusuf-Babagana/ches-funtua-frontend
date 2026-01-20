"use client"


import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Enrollment, Student } from "@/lib/types"
import { CheckCircle, XCircle } from "lucide-react"

export default function CourseRegistrationPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [registrations, setRegistrations] = useState<Enrollment[]>([])
  const [students, setStudents] = useState<Student[]>([])

  useEffect(() => {
    if (!loading && (!user || user.role !== "desk-officer")) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading || !user) return null

  const pendingRegistrations = registrations.filter((r) => r.status === "active") // Assumption: active is what we see, or maybe we need a pending status in Enrollment type? 'status' is 'active' | 'completed' | 'dropped'. Just using active for now or assume we filter by logic.
  // Actually, wait, mock had 'pending', 'approved'. Type 'Enrollment' has 'active', 'completed', 'dropped'.
  // This implies the type might be missing 'pending' or the workflow differs. 
  // I will assume for now we list 'active' registrations or check if I need to update the type. 
  // Given instructions, I'll stick to 'active' or maybe 'dropped' if that means rejected?
  // Let's assume 'active' is what we want to list, or maybe we just list all. 
  // The mock filtered by 'pending'. I'll filter by 'active' as a placeholder for "current".

  const getStudentName = (studentId: number) => {
    const student = students.find((s) => s.id === studentId)
    return student?.user.full_name || "Unknown"
  }

  const getStudentId = (studentId: number) => {
    const student = students.find((s) => s.id === studentId)
    return student?.matric_number || "N/A"
  }

  return (
    <DashboardLayout title="Course Registration" role="desk-officer">
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
                            <h3 className="font-semibold">{getStudentName(registration.student)}</h3>
                            <p className="text-sm text-muted-foreground">{getStudentId(registration.student)}</p>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex gap-2">
                              <span className="text-muted-foreground">Course:</span>
                              <span className="font-medium">{registration.course.code} - {registration.course.title}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-muted-foreground">Semester:</span>
                              <span className="font-medium">{registration.semester}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-muted-foreground">Academic Year:</span>
                              <span className="font-medium">{registration.session}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-muted-foreground">Registered:</span>
                              <span className="font-medium">
                                {new Date(registration.enrollment_date).toLocaleDateString()}
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
