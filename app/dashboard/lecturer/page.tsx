"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Users,
  GraduationCap,
  ArrowRight,
  Loader2,
  Building2,
  User,
  CalendarDays,
  RefreshCw,
  Library,
  FileSpreadsheet
} from "lucide-react"
import { lecturerAPI } from "@/lib/api"
import { toast } from "sonner"

export default function LecturerDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      if (!refreshing) setLoading(true)
      const response = await lecturerAPI.getDashboard()
      if (response && !response.error) {
        setData(response)
      }
    } catch (error) {
      console.error("Failed to load dashboard", error)
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchDashboardData()
  }

  if (loading) {
    return (
      <DashboardLayout title="Lecturer Dashboard" role="lecturer">
        <div className="flex flex-col gap-4 justify-center items-center h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
          <p className="text-slate-500 text-sm animate-pulse">Loading Academic Profile...</p>
        </div>
      </DashboardLayout>
    )
  }

  const { lecturer, statistics, current_semester, current_courses } = data || {}

  const sidebarItems = [
    { href: "/dashboard/lecturer", label: "Overview", icon: BookOpen, active: true },
    { href: "/dashboard/lecturer/courses", label: "My Courses & Grades", icon: GraduationCap, active: false },
  ]

  return (
    <DashboardLayout title="Lecturer Dashboard" role="lecturer" sidebarItems={sidebarItems}>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          {/* Identity Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5 flex-1 w-full relative overflow-hidden group">
            {/* Decoration */}
            <div className="absolute right-0 top-0 h-full w-1 bg-teal-600" />

            <div className="h-16 w-16 bg-teal-50 rounded-full flex items-center justify-center border border-teal-100 shadow-inner group-hover:scale-105 transition-transform">
              <User className="h-8 w-8 text-teal-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{lecturer?.name || "Lecturer"}</h2>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 mt-1">
                <Badge variant="secondary" className="font-medium text-xs bg-slate-100 text-slate-600 border-slate-200">
                  {lecturer?.designation?.replace('_', ' ') || "Academic Staff"}
                </Badge>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="font-mono bg-slate-50 px-2 py-0.5 rounded text-xs border border-slate-100 text-slate-600">
                  {lecturer?.staff_id}
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-teal-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        {/* Info Pills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-indigo-100 bg-indigo-50/30 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Department</p>
                <p className="text-sm font-semibold text-slate-900">{lecturer?.department?.name || "General Studies"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 bg-emerald-50/30 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Current Session</p>
                <p className="text-sm font-semibold text-slate-900">
                  {current_semester?.session || "N/A"}
                  <span className="text-slate-400 font-normal mx-1">|</span>
                  {current_semester?.semester || "-"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- STATS ROW --- */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Assigned Courses</CardTitle>
              <Library className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{statistics?.current_semester_courses || 0}</div>
              <p className="text-xs text-teal-600 mt-1 font-medium">Active this semester</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Total Students</CardTitle>
              <Users className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{statistics?.current_students || 0}</div>
              <p className="text-xs text-emerald-600 mt-1 font-medium">Across all courses</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Pending Grades</CardTitle>
              <FileSpreadsheet className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{statistics?.grades_to_enter || 0}</div>
              <p className="text-xs text-orange-600 mt-1 font-medium">Results awaiting entry</p>
            </CardContent>
          </Card>
        </div>

        {/* --- ASSIGNED COURSES LIST --- */}
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-teal-600" />
              My Assigned Courses
            </h2>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/lecturer/courses')} className="text-slate-500 hover:text-teal-700">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {current_courses && current_courses.length > 0 ? (
              current_courses.map((course: any) => (
                <Card key={course.id} className="flex flex-col border-slate-200 shadow-sm hover:shadow-lg hover:border-teal-300 transition-all cursor-pointer group bg-white">
                  <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/30">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-bold text-slate-800 group-hover:text-teal-700 transition-colors">
                          {course.code}
                        </CardTitle>
                        <CardDescription className="line-clamp-1 font-medium text-slate-600 text-xs">
                          {course.title}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-white text-slate-500 border-slate-200">{course.credits} Units</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 pt-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2.5 rounded-md border border-slate-100 group-hover:bg-teal-50/50 group-hover:border-teal-100 transition-colors">
                      <Users className="h-4 w-4 text-slate-400 group-hover:text-teal-500" />
                      <span className="font-bold text-slate-900">
                        {course.enrolled_students ?? course.student_count ?? course.enrolled ?? 0}
                      </span>
                      <span className="text-slate-500 text-xs uppercase tracking-wide">Students Enrolled</span>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-4 pb-4 px-4 grid grid-cols-2 gap-3 bg-white rounded-b-xl">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      onClick={() => router.push(`/dashboard/lecturer/courses/${course.course_id || course.id}/students`)}
                    >
                      Class List
                    </Button>
                    <Button
                      size="sm"
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                      onClick={() => router.push(`/dashboard/lecturer/courses/${course.course_id || course.id}`)}
                    >
                      <FileSpreadsheet className="h-3 w-3 mr-2" /> Grades
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">No courses assigned</h3>
                <p className="text-slate-500 max-w-sm mt-1">
                  There are no courses assigned to you for the current semester. Please contact your Head of Department.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}