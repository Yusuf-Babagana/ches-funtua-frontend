"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  FileBarChart,
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Search,
  BookOpen,
  Users,
  Clock,
  TrendingUp,
  FileCheck,
  CalendarDays,
  MoreHorizontal,
  GraduationCap
} from "lucide-react"
import { examOfficerAPI } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"

// Helper for consistent input styling
const inputClassName = "flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-600 disabled:cursor-not-allowed disabled:opacity-50"

export default function ExamOfficerDashboard() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await examOfficerAPI.getDashboard()
        setData(response)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <DashboardLayout title="Examination Office" role="exam_officer">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Fallback objects to prevent crashes
  const stats = data?.statistics || {}
  const examStats = data?.exam_statistics || {}
  const semester = data?.current_semester || {}
  const deadlines = data?.upcoming_deadlines || []
  const activities = data?.recent_activities || []

  return (
    <DashboardLayout title="Examination Office" role="exam_officer">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Examination Overview</h2>
            <p className="text-slate-500 flex items-center gap-2 mt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {semester.session ? `${semester.session} Session • ${semester.semester}` : 'No Active Session'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push('/dashboard/exam-officer/timetable')} className="border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-teal-50">
              <CalendarDays className="mr-2 h-4 w-4" /> Timetable
            </Button>
            <Button onClick={() => router.push('/dashboard/exam-officer/results')} className="bg-teal-600 hover:bg-teal-700 shadow-sm">
              <FileCheck className="mr-2 h-4 w-4" /> Verify Results
            </Button>
          </div>
        </div>

        {/* --- Key Statistics Cards --- */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-orange-100 shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-orange-50/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Pending Results</CardTitle>
              <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                <AlertCircle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{stats.courses_pending_results || 0}</div>
              <p className="text-xs text-orange-600/80 font-medium mt-1">Awaiting verification</p>
            </CardContent>
          </Card>

          <Card className="border-blue-100 shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-blue-50/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Pending Registrations</CardTitle>
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{stats.pending_registrations || 0}</div>
              <p className="text-xs text-blue-600/80 font-medium mt-1">Students awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-emerald-50/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Processed Results</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{examStats.completed_courses || 0}</div>
              <p className="text-xs text-emerald-600/80 font-medium mt-1">
                {examStats.completion_rate || 0}% Completion Rate
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-100 shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-purple-50/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Courses</CardTitle>
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <BookOpen className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{stats.total_courses || 0}</div>
              <p className="text-xs text-purple-600/80 font-medium mt-1">Across {stats.total_departments || 0} depts</p>
            </CardContent>
          </Card>
        </div>

        {/* --- Main Content Grid --- */}
        <div className="grid gap-6 md:grid-cols-7">
          
          {/* Left Column: Recent Activity & Deadlines */}
          <div className="md:col-span-4 space-y-6">
            
            {/* Quick Actions Panel */}
            {data?.quick_actions && (
                <div className="grid grid-cols-2 gap-4">
                    {data.quick_actions.map((action: any, idx: number) => (
                        <Card key={idx} className="bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border-dashed">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none text-slate-700">{action.label}</p>
                                    <p className="text-xs text-slate-500">{action.count} Items</p>
                                </div>
                                {(action.count > 0) && <Badge variant="destructive" className="ml-2">{action.count}</Badge>}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Card className="col-span-4 border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg text-slate-800">Recent Activity</CardTitle>
                        <CardDescription>Latest system events regarding exams and grades</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-white text-slate-600">Live Feed</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-6 pl-2">
                        {activities.length === 0 ? (
                            <p className="text-sm text-center text-slate-400 py-8">No recent activity found.</p>
                        ) : (
                            activities.map((activity: any, index: number) => (
                                <div key={index} className="relative flex gap-4 group">
                                     {/* Timeline line */}
                                     {index !== activities.length - 1 && (
                                        <div className="absolute left-[19px] top-10 bottom-[-24px] w-px bg-slate-100 group-hover:bg-slate-200 transition-colors" />
                                      )}

                                    <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-sm transition-colors ${
                                        activity.type === 'grade_upload' ? 'bg-blue-50 border-blue-100 text-blue-600' : 
                                        activity.type === 'registration_approved' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-slate-50 border-slate-100 text-slate-500'
                                    }`}>
                                        {activity.type === 'grade_upload' ? <TrendingUp className="h-5 w-5" /> : <FileCheck className="h-5 w-5" />}
                                    </div>
                                    <div className="flex-1 space-y-1 pt-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-slate-800">{activity.title}</p>
                                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                                {activity.timestamp ? format(new Date(activity.timestamp), "MMM d, h:mm a") : 'Just now'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-md border border-slate-100">
                                            {activity.details}
                                        </p>
                                        <p className="text-xs text-slate-400 pl-1">
                                            {activity.course_code && <span className="font-mono text-slate-500 bg-slate-100 px-1 rounded mr-2">{activity.course_code}</span>}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Deadlines & Search */}
          <div className="md:col-span-3 space-y-6">
             <Card className="border-red-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-red-50/50 border-b border-red-100 pb-4">
                    <CardTitle className="text-base flex items-center gap-2 text-red-900">
                        <Clock className="h-5 w-5 text-red-600" /> Upcoming Deadlines
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                    {deadlines.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No immediate deadlines.</p>
                    ) : (
                        deadlines.map((deadline: any, idx: number) => (
                            <div key={idx} className="flex items-start justify-between border-l-[3px] border-l-red-500 bg-white shadow-sm border border-slate-100 p-3 rounded-r-md hover:bg-red-50/30 transition-colors">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-800">{deadline.title}</p>
                                    <p className="text-xs font-medium text-red-600 flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> 
                                        {deadline.days_left} days remaining
                                    </p>
                                </div>
                                <div className="text-center bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                    <span className="block text-[10px] text-slate-500 uppercase">{format(new Date(deadline.date), "MMM")}</span>
                                    <span className="block text-lg font-bold text-slate-800 leading-none">{format(new Date(deadline.date), "d")}</span>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
             </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                    <Search className="h-4 w-4 text-slate-500" /> 
                    Student Result Lookup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <GraduationCap className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input placeholder="Enter Matric Number..." className={inputClassName + " pl-9"} />
                  </div>
                  <Button size="icon" className="bg-teal-600 hover:bg-teal-700 shrink-0"><Search className="h-4 w-4" /></Button>
                </div>
                <p className="mt-3 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                  Quickly view individual student transcripts, CGPA standing, and academic history.
                </p>
              </CardContent>
            </Card>

            {/* Exam Stats Mini View */}
            <Card className="bg-teal-900 text-white border-none shadow-md overflow-hidden relative">
                {/* Background pattern */}
                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/3 -translate-y-1/3">
                    <FileBarChart className="h-40 w-40" />
                </div>

                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-teal-100 uppercase tracking-wider">Session Pass Rate</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="py-2">
                        <div className="text-5xl font-bold tracking-tight">{examStats.pass_rate || 0}%</div>
                        <p className="text-xs text-teal-200 mt-2 font-medium">Average across all departments</p>
                    </div>
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}