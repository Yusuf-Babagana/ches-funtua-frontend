"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, UserCheck, UserX, Clock, AlertCircle, RefreshCw, FileText, BookOpen, Users, BarChart3, TrendingUp, CheckCircle, Megaphone } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { apiClient, userAPI } from "@/lib/api"
import { Badge } from "@/components/ui/badge"

interface DashboardStats {
  totalStudents: number
  activeStudents: number
  pendingStudents: number
  inactiveStudents: number
  totalLecturers: number
  totalDepartments: number
}

export interface Student {
  id: number
  email: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  matric_number: string
  level: string
  department?: {
    id: number
    name: string
    code: string
  } | null
  status: string
  created_at: string
}

export default function RegistrarDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeStudents: 0,
    pendingStudents: 0,
    inactiveStudents: 0,
    totalLecturers: 0,
    totalDepartments: 0
  })
  const [recentStudents, setRecentStudents] = useState<Student[]>([])
  // recentUsers state removed as it was redundant and causing type issues

  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!loading && (!user || user.role !== "registrar")) {
      router.push("/login")
      return
    }

    if (user && user.role === "registrar") {
      fetchRegistrarData()
    }
  }, [user, loading, router])

  const fetchRegistrarData = async () => {
    try {
      setLoadingData(true)
      setError("")

      console.log("🔄 Fetching registrar data...")

      // Fetch all users with student role using your userAPI
      const usersResponse = await userAPI.getUsers({ role: 'student', page_size: 100 })

      if (usersResponse && !usersResponse.error) {
        // Handle different response formats
        let usersData: any[] = []
        if (Array.isArray(usersResponse)) {
          usersData = usersResponse
        } else if (usersResponse.results) {
          usersData = usersResponse.results
        } else if (usersResponse.data) {
          usersData = usersResponse.data
        } else if (typeof usersResponse === 'object') {
          // If it's an object with student profiles
          usersData = Object.values(usersResponse)
        }

        console.log("📊 Users data:", usersData)

        // Calculate statistics
        const totalStudents = usersData.length
        const activeStudents = usersData.filter((u: any) => u.is_active).length
        const pendingStudents = usersData.filter((u: any) => !u.is_active).length
        const inactiveStudents = usersData.filter((u: any) => !u.is_active).length

        // Get recent students (last 5)
        const sortedUsers = usersData.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        const studentsData = sortedUsers.map((user: any) => ({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          matric_number: user.student_profile?.matric_number || 'N/A',
          level: user.student_profile?.level || 'N/A',
          department: user.student_profile?.department || null,
          status: user.is_active ? 'active' : 'inactive',
          created_at: user.created_at
        }))

        setRecentStudents(studentsData.slice(0, 5))

        // Fetch lecturers count
        const lecturersResponse = await userAPI.getUsers({ role: 'lecturer', page_size: 1 })
        let totalLecturers = 0
        if (lecturersResponse && !lecturersResponse.error) {
          if (Array.isArray(lecturersResponse)) {
            totalLecturers = lecturersResponse.length
          } else if (lecturersResponse.results) {
            totalLecturers = lecturersResponse.results.length
          } else if (lecturersResponse.count) {
            totalLecturers = lecturersResponse.count
          }
        }

        setStats({
          totalStudents,
          activeStudents,
          pendingStudents,
          inactiveStudents,
          totalLecturers,
          totalDepartments: 0 // You can fetch this from academicsAPI if needed
        })

      } else {
        console.warn("Users endpoint returned error:", usersResponse?.error)
        setError("Unable to fetch student data. Please try again.")
      }

    } catch (err: any) {
      console.error("Error fetching registrar data:", err)
      setError(err.message || "Failed to load dashboard data. Some features may be limited.")

      // Set placeholder data if API fails
      setStats({
        totalStudents: 0,
        activeStudents: 0,
        pendingStudents: 0,
        inactiveStudents: 0,
        totalLecturers: 0,
        totalDepartments: 0
      })
    } finally {
      setLoadingData(false)
    }
  }

  const handleRetry = () => {
    fetchRegistrarData()
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const dashboardStats = [
    {
      title: "Total Students",
      value: loadingData ? "..." : stats.totalStudents.toString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "All registered students"
    },
    {
      title: "Active Students",
      value: loadingData ? "..." : stats.activeStudents.toString(),
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "Currently active"
    },
    {
      title: "Pending Review",
      value: loadingData ? "..." : stats.pendingStudents.toString(),
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "Accounts pending activation"
    },
    {
      title: "Inactive",
      value: loadingData ? "..." : stats.inactiveStudents.toString(),
      icon: UserX,
      color: "text-red-600",
      bgColor: "bg-red-50",
      description: "Suspended or deactivated"
    },
    {
      title: "Lecturers",
      value: loadingData ? "..." : stats.totalLecturers.toString(),
      icon: GraduationCap,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "Teaching staff"
    },
    {
      title: "Departments",
      value: loadingData ? "..." : stats.totalDepartments.toString(),
      icon: BarChart3,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      description: "Academic departments"
    },
  ]

  return (
    <DashboardLayout title="Registrar Dashboard" role="registrar">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Registrar Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.first_name} {user.last_name}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRetry} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {dashboardStats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={cn("p-2 rounded-full", stat.bgColor)}>
                      <Icon className={cn("h-4 w-4", stat.color)} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Student Registrations */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Student Registrations</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Latest student accounts created</p>
              </div>
              <Badge variant="outline" className="text-sm">
                {loadingData ? "..." : `${recentStudents.length} total`}
              </Badge>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentStudents.length > 0 ? (
                <div className="space-y-3">
                  {recentStudents.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {user.first_name} {user.last_name}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={user.is_active ? "default" : "secondary"} className="text-xs">
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(user.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge variant="outline" className="text-xs capitalize">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-muted-foreground">No student records found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Student records will appear here once available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full justify-start" variant="outline" onClick={() => router.push('/dashboard/registrar/students')}>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Students
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => router.push('/dashboard/registrar/lecturers')}>
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Manage Lecturers
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => router.push('/dashboard/registrar/courses')}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Course Management
                </Button>
                {/* ✅ Added Publish Results Button */}
                <Button className="w-full justify-start" variant="outline" onClick={() => router.push('/dashboard/registrar/approvals')}>
                  <Megaphone className="h-4 w-4 mr-2" />
                  Publish Results
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => router.push('/dashboard/registrar/transcripts')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Transcripts
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => router.push('/dashboard/registrar/reports')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
              </div>

              {/* System Status */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  System Status
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">API Connection</span>
                    <Badge variant={error ? "destructive" : "default"} className="text-xs">
                      {error ? "Error" : "Connected"}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Data Last Updated</span>
                    <span className="font-medium">{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Registrar Functions */}
        <Card>
          <CardHeader>
            <CardTitle>Registrar's Office Functions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <h4 className="font-medium">Student Records</h4>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Maintain academic records</li>
                  <li>• Process student applications</li>
                  <li>• Manage enrollment status</li>
                  <li>• Handle transfer requests</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg hover:border-green-300 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <BookOpen className="h-5 w-5 text-green-600" />
                  </div>
                  <h4 className="font-medium">Course Management</h4>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Oversee course registration</li>
                  <li>• Manage academic calendar</li>
                  <li>• Handle timetable scheduling</li>
                  <li>• Coordinate exam schedules</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg hover:border-purple-300 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <GraduationCap className="h-5 w-5 text-purple-600" />
                  </div>
                  <h4 className="font-medium">Certification</h4>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Issue transcripts</li>
                  <li>• Award degrees</li>
                  <li>• Process graduation</li>
                  <li>• Verify credentials</li>
                </ul>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-4">Performance Metrics</h4>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.activeStudents}</div>
                  <p className="text-sm text-muted-foreground">Active Students</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.totalStudents > 0 ? Math.round((stats.activeStudents / stats.totalStudents) * 100) : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">Activation Rate</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.pendingStudents}</div>
                  <p className="text-sm text-muted-foreground">Pending Actions</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.totalLecturers}</div>
                  <p className="text-sm text-muted-foreground">Teaching Staff</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}