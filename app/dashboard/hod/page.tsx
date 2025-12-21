"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Users,
  BookOpen,
  UserCheck,
  AlertCircle,
  Building2,
  ArrowRight,
  RefreshCw,
  Shield,
  TrendingUp,
  LayoutDashboard,
  FileCheck,
  Settings,
  BarChart3,
  GraduationCap,
  CalendarDays,
  Mail,
  Phone
} from "lucide-react"
import { hodAPI } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DashboardLayout } from "@/components/dashboard-layout"
import { toast } from "sonner"

// --- Interfaces matching Backend Response ---
interface DepartmentInfo {
  id: number
  name: string
  code: string
  hod: {
    id: number
    name: string
    staff_id?: string
    designation?: string
  }
  description?: string
}

interface DashboardData {
  statistics: {
    students: number
    lecturers: number
    courses: number
    courses_with_lecturers: number
    courses_without_lecturers: number
    pending_approvals?: number
  }
  recent_students: Array<{
    id: number
    name: string
    matric_number: string
    level: string
    status: string
  }>
  courses_summary: Array<{
    id: number
    code: string
    title: string
    credits: number
    lecturer: string
    level: string
    semester: string
  }>
  current_semester?: {
    session: string
    semester: string
  }
}

export default function HODDashboard() {
  const router = useRouter()
  const { user, logout } = useAuth()

  const [department, setDepartment] = useState<DepartmentInfo | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  // --- HOD Sidebar Navigation ---
  const sidebarItems = [
    { href: "/dashboard/hod", label: "Overview", icon: LayoutDashboard, active: true },
    { href: "/dashboard/hod/students", label: "Students", icon: Users, active: false },
    { href: "/dashboard/hod/lecturers", label: "Faculty", icon: UserCheck, active: false },
    { href: "/dashboard/hod/courses", label: "Courses", icon: BookOpen, active: false },
    { href: "/dashboard/hod/approvals", label: "Result Approvals", icon: FileCheck, active: false },
    { href: "/dashboard/hod/settings", label: "Settings", icon: Settings, active: false },
  ]

  useEffect(() => {
    if (!user) return
    if (user.role !== 'hod') {
      router.push('/dashboard')
      return
    }
    fetchDashboardData()
  }, [user, router])

  const fetchDashboardData = async () => {
    try {
      if (!refreshing) setLoading(true)
      setError("")

      const response = await hodAPI.getHODDashboard()

      if (response.error) {
        throw new Error(response.error.detail || "Failed to fetch dashboard data")
      }

      setDepartment(response.department)
      setDashboardData(response)

      if (response.department) {
        localStorage.setItem('hod_department', JSON.stringify(response.department))
      }

    } catch (error: any) {
      console.error("Error fetching HOD dashboard:", error)
      setError(error.message || "Failed to load dashboard data")
      if (error.status === 401) logout()
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchDashboardData()
    toast.success("Dashboard refreshed")
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const calculateCoveragePercentage = () => {
    if (!dashboardData?.statistics?.courses) return 0
    return Math.round((dashboardData.statistics.courses_with_lecturers / dashboardData.statistics.courses) * 100)
  }

  if (loading) {
    return (
      <DashboardLayout title="HOD Dashboard" role="hod" sidebarItems={sidebarItems}>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 rounded-xl lg:col-span-2" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error && !department) {
    return (
      <DashboardLayout title="Error" role="hod" sidebarItems={sidebarItems}>
        <div className="h-[60vh] flex items-center justify-center">
          <Card className="max-w-md w-full border-red-200 shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="h-7 w-7 text-red-600" />
              </div>
              <CardTitle className="text-red-900">Dashboard Unavailable</CardTitle>
              <CardDescription>We encountered an issue loading your department data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive" className="bg-red-50 border-red-100 text-red-800">
                <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
              </Alert>
              <Button onClick={fetchDashboardData} className="w-full bg-red-600 hover:bg-red-700">
                <RefreshCw className="h-4 w-4 mr-2" /> Retry Connection
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const stats = dashboardData?.statistics
  const coveragePercentage = calculateCoveragePercentage()

  return (
    <DashboardLayout title={`${department?.code} Dashboard`} role="hod" sidebarItems={sidebarItems}>
      <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* --- Header Section --- */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-teal-50 rounded-xl border border-teal-100 flex items-center justify-center shadow-inner">
              <Building2 className="h-7 w-7 text-teal-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{department?.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 font-medium">
                  Code: {department?.code}
                </Badge>
                <span className="text-slate-300">|</span>
                <div className="flex items-center text-sm text-slate-500">
                  <UserCheck className="w-4 h-4 mr-1.5 text-slate-400" />
                  <span>HOD: {department?.hod?.name || "Pending"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Session</span>
              <span className="text-sm font-bold text-slate-700">{dashboardData?.current_semester?.session || "N/A"}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="border-slate-200 hover:bg-slate-50">
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>

        {/* --- Stats Grid --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          {/* Students Stat */}
          <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Total Students</p>
                  <p className="text-3xl font-bold text-slate-800 mt-2">{stats?.students?.toLocaleString() || 0}</p>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><GraduationCap className="h-5 w-5" /></div>
              </div>
              <div className="mt-4 flex items-center text-xs text-slate-500">
                <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" /> Active Enrollments
              </div>
            </CardContent>
          </Card>

          {/* Lecturers Stat */}
          <Card className="border-l-4 border-l-teal-500 shadow-sm hover:shadow-md transition-all">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Faculty Staff</p>
                  <p className="text-3xl font-bold text-slate-800 mt-2">{stats?.lecturers?.toLocaleString() || 0}</p>
                </div>
                <div className="p-2 bg-teal-50 rounded-lg text-teal-600"><UserCheck className="h-5 w-5" /></div>
              </div>
              <div className="mt-4 text-xs text-slate-500">Department Lecturers</div>
            </CardContent>
          </Card>

          {/* Courses Stat */}
          <Card className="border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-all">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Active Courses</p>
                  <p className="text-3xl font-bold text-slate-800 mt-2">{stats?.courses?.toLocaleString() || 0}</p>
                </div>
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><BookOpen className="h-5 w-5" /></div>
              </div>
              <div className="mt-4 text-xs text-slate-500">{dashboardData?.current_semester?.semester} Semester</div>
            </CardContent>
          </Card>

          {/* Coverage Stat */}
          <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-all">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Staffing Coverage</p>
                  <p className="text-3xl font-bold text-slate-800 mt-2">{coveragePercentage}%</p>
                </div>
                <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><BarChart3 className="h-5 w-5" /></div>
              </div>
              <Progress value={coveragePercentage} className="h-1.5 mt-4 bg-orange-100" />
            </CardContent>
          </Card>
        </div>

        {/* --- Main Content Split --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Lists */}
          <div className="lg:col-span-2 space-y-6">

            {/* Courses Summary Table */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-4 bg-slate-50/50 border-b border-slate-100">
                <div className="space-y-1">
                  <CardTitle className="text-lg text-slate-800">Course Assignments</CardTitle>
                  <CardDescription>Overview of active courses and lecturer allocation</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/hod/courses')} className="text-slate-600">
                  Manage Courses <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {dashboardData?.courses_summary?.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p>No courses active this semester.</p>
                    </div>
                  ) : (
                    dashboardData?.courses_summary?.slice(0, 5).map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-teal-200 hover:shadow-sm transition-all group">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors">
                            {course.code.split(' ')[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-slate-800">{course.code} - {course.title}</div>
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded">{course.credits} Units</span>
                              <span>•</span>
                              <span>{course.level} Level</span>
                            </div>
                          </div>
                        </div>
                        {course.lecturer === 'Unassigned' ? (
                          <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 font-medium">
                            Unassigned
                          </Badge>
                        ) : (
                          <div className="text-xs font-medium text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100 flex items-center">
                            <UserCheck className="w-3 h-3 mr-1" />
                            {course.lecturer}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Students */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-4 bg-slate-50/50 border-b border-slate-100">
                <div className="space-y-1">
                  <CardTitle className="text-lg text-slate-800">Recent Students</CardTitle>
                  <CardDescription>Newest admissions to the department</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/hod/students')} className="text-slate-500 hover:text-teal-700">
                  View All <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {dashboardData?.recent_students?.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">No recent students found.</div>
                  ) : (
                    dashboardData?.recent_students?.slice(0, 5).map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-slate-200">
                            <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs">
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm text-slate-900">{student.name}</p>
                            <p className="text-xs text-slate-500 font-mono">{student.matric_number}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs font-normal bg-white text-slate-600 border-slate-200">
                          {student.level} Level
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Info & Actions */}
          <div className="space-y-6">

            {/* Quick Actions Panel */}
            <Card className="bg-slate-50 border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-200/60">
                <CardTitle className="text-base text-slate-800">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 pt-4">
                <Button className="w-full justify-start bg-white text-slate-700 border border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 shadow-sm h-auto py-3" onClick={() => router.push('/dashboard/hod/approvals')}>
                  <div className="bg-blue-100 p-2 rounded mr-3 text-blue-600">
                    <FileCheck className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-sm">Approve Results</span>
                    <span className="text-xs text-slate-400 font-normal">Review graded courses</span>
                  </div>
                  {dashboardData?.statistics?.pending_approvals ? (
                    <Badge className="ml-auto bg-red-500 text-white hover:bg-red-600">{dashboardData.statistics.pending_approvals}</Badge>
                  ) : null}
                </Button>

                <Button className="w-full justify-start bg-white text-slate-700 border border-slate-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 shadow-sm h-auto py-3" onClick={() => router.push('/dashboard/hod/courses')}>
                  <div className="bg-purple-100 p-2 rounded mr-3 text-purple-600">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-sm">Assign Courses</span>
                    <span className="text-xs text-slate-400 font-normal">Allocate lecturers</span>
                  </div>
                </Button>

                <Button className="w-full justify-start bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 shadow-sm h-auto py-3" onClick={() => router.push('/dashboard/hod/students')}>
                  <div className="bg-emerald-100 p-2 rounded mr-3 text-emerald-600">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-sm">Student Directory</span>
                    <span className="text-xs text-slate-400 font-normal">Manage departmental students</span>
                  </div>
                </Button>
              </CardContent>
            </Card>

            {/* Department Info */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3 bg-slate-50/30 border-b border-slate-100">
                <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-slate-500" /> Department Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-4 text-sm">
                <div>
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">HOD Contact</div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 bg-slate-50 rounded border border-slate-100">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-700 font-medium truncate">{user?.email}</span>
                    </div>
                    {user?.phone && (
                      <div className="flex items-center gap-3 p-2 bg-slate-50 rounded border border-slate-100">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-700 font-medium">{user.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {department?.description && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">About</div>
                      <p className="text-slate-600 leading-relaxed text-xs bg-slate-50 p-3 rounded border border-slate-100">
                        {department.description}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Semester Info */}
            <Card className="bg-blue-600 text-white border-none shadow-md overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <CalendarDays className="h-24 w-24" />
              </div>
              <CardContent className="p-5 flex gap-4 items-center relative z-10">
                <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                  <CalendarDays className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">{dashboardData?.current_semester?.semester || "Unknown"} Semester</h4>
                  <p className="text-blue-100 text-sm opacity-90">
                    Session: {dashboardData?.current_semester?.session || "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}