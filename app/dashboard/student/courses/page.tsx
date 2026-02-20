"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen, CreditCard, CheckCircle, XCircle, AlertCircle,
  Plus, Loader2, Calendar, FileText, Trash2, User, Clock, GraduationCap
} from "lucide-react"
import { registrationAPI } from "@/lib/api"
import { toast } from "sonner"

// Matching the flattened CourseRegistrationSerializer from backend
interface Registration {
  id: number
  course_code: string
  course_title: string
  course_credits: number
  lecturer_name: string
  semester_info: string
  registration_date: string
  status: string
  is_payment_verified: boolean
  department_name: string
}

export default function StudentCoursesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [droppingId, setDroppingId] = useState<number | null>(null)

  useEffect(() => {
    if (!authLoading && user?.role === "student") {
      fetchCourseData()
    }
  }, [authLoading, user])

  const fetchCourseData = async () => {
    try {
      setLoading(true)
      // Use the specific API method for schedule
      const response = await registrationAPI.getCurrentSchedule()

      if (Array.isArray(response)) {
        setRegistrations(response)
      } else if (response?.results) {
        setRegistrations(response.results)
      } else {
        setRegistrations([])
      }
    } catch (error) {
      console.error("Failed to load courses", error)
      toast.error('Failed to load course list.')
    } finally {
      setLoading(false)
    }
  }

  const handleDropCourse = async (registrationId: number, courseCode: string) => {
    if (!confirm(`Are you sure you want to drop ${courseCode}? This action cannot be undone.`)) return

    setDroppingId(registrationId)
    try {
      await registrationAPI.dropCourse(registrationId)
      toast.success(`${courseCode} dropped successfully`)
      // Refresh list
      fetchCourseData()
    } catch (error: any) {
      toast.error("Failed to drop course")
    } finally {
      setDroppingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: any = {
      'registered': "bg-emerald-100 text-emerald-800 border-emerald-200",
      'approved_lecturer': "bg-blue-100 text-blue-800 border-blue-200",
      'pending': "bg-amber-100 text-amber-800 border-amber-200",
      'dropped': "bg-slate-100 text-slate-600 border-slate-200",
      'completed': "bg-purple-100 text-purple-800 border-purple-200"
    }

    let label = status.replace(/_/g, ' ')
    let icon = <Clock className="h-3 w-3 mr-1" />

    if (status === 'registered' || status === 'completed') {
      label = status === 'completed' ? "Completed" : "Enrolled"
      icon = <CheckCircle className="h-3 w-3 mr-1" />
    } else if (status === 'dropped') {
      icon = <XCircle className="h-3 w-3 mr-1" />
    }

    return (
      <Badge variant="outline" className={`${styles[status] || styles.pending} capitalize flex items-center w-fit`}>
        {icon} {label}
      </Badge>
    )
  }

  // Calculate stats
  const totalCredits = registrations.reduce((acc, reg) => acc + (reg.course_credits || 0), 0)

  // Sidebar items for navigation consistency
  const sidebarItems = [
    { href: "/dashboard/student", label: "Overview", icon: BookOpen, active: false },
    { href: "/dashboard/student/courses", label: "My Courses", icon: BookOpen, active: true },
    { href: "/dashboard/student/grades", label: "Results", icon: GraduationCap, active: false },
  ]

  if (authLoading || loading) {
    return (
      <DashboardLayout title="My Courses" role="student" sidebarItems={sidebarItems}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="My Courses" role="student" sidebarItems={sidebarItems}>
      <div className="space-y-6 max-w-6xl mx-auto">

        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-teal-950 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-teal-600" /> My Courses
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
              <span className="bg-slate-100 px-2 py-1 rounded"><strong>{registrations.length}</strong> Courses</span>
              <span className="bg-slate-100 px-2 py-1 rounded"><strong>{totalCredits}</strong> Total Units</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => router.push('/dashboard/student')}
              className="bg-teal-600 hover:bg-teal-700 text-white shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" /> Register More
            </Button>
          </div>
        </div>

        {/* --- Course List --- */}
        <div className="space-y-4">
          {registrations.length === 0 ? (
            <Card className="border-dashed border-2 bg-slate-50">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">No courses registered</h3>
                <p className="text-slate-500 max-w-sm mt-1 mb-6">
                  You haven't registered for any courses this semester yet.
                </p>
                <Button onClick={() => router.push('/dashboard/student')}>
                  Go to Registration
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4">
              {registrations.map((reg) => (
                <Card key={reg.id} className="hover:border-teal-200 transition-all duration-200 group">
                  <div className="p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">

                    {/* Course Info */}
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono font-bold text-lg text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                          {reg.course_code}
                        </span>
                        {getStatusBadge(reg.status)}
                      </div>
                      <h3 className="font-semibold text-slate-900 text-lg">
                        {reg.course_title}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-2">
                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded font-medium text-teal-700">
                          {reg.department_name}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                          <User className="h-3 w-3 text-slate-400" /> {reg.lecturer_name || "TBA"}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                          <CreditCard className="h-3 w-3 text-slate-400" /> {reg.course_credits} Units
                        </span>
                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                          <Calendar className="h-3 w-3 text-slate-400" /> {new Date(reg.registration_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      {reg.status !== 'dropped' && reg.status !== 'completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDropCourse(reg.id, reg.course_code)}
                          disabled={droppingId === reg.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100"
                        >
                          {droppingId === reg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                          Drop
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  )
}