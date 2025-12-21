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
  FileSpreadsheet,
  ArrowRight,
  Loader2,
  Calendar,
  Clock,
  Library
} from "lucide-react"
import { lecturerAPI } from "@/lib/api"
import { toast } from "sonner"

export default function MyCoursesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<any[]>([])

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await lecturerAPI.getCourses()
        if (Array.isArray(data)) {
          setCourses(data)
        } else if (data?.results) {
          setCourses(data.results)
        }
      } catch (error) {
        console.error("Failed to load courses")
        toast.error("Failed to load course list")
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [])

  if (loading) {
    return (
      <DashboardLayout title="My Courses" role="lecturer">
        <div className="flex flex-col gap-4 justify-center items-center h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
          <p className="text-slate-500 text-sm animate-pulse">Loading Course List...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="My Courses" role="lecturer">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Assigned Courses</h1>
            <p className="text-slate-500">Manage curriculum, view student rosters, and input grades for the current session.</p>
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.length > 0 ? (
            courses.map((course: any) => (
              <Card
                key={course.id}
                className="flex flex-col border-slate-200 shadow-sm hover:shadow-lg hover:border-teal-300 transition-all cursor-pointer group bg-white"
                onClick={() => router.push(`/dashboard/lecturer/courses/${course.course_id || course.id}`)}
              >
                <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/30">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="font-mono bg-teal-50 text-teal-700 border-teal-100 group-hover:bg-teal-100 transition-colors">
                      {course.code}
                    </Badge>
                    <Badge variant="secondary" className="bg-white text-slate-500 border border-slate-200 pointer-events-none">
                      {course.credits} Units
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-800 line-clamp-2 min-h-[3.5rem] group-hover:text-teal-700 transition-colors leading-tight">
                    {course.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-3 text-xs mt-1">
                    <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      <Calendar className="h-3 w-3" />
                      {course.semester === 'first' ? '1st' : '2nd'} Sem
                    </span>
                    <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      <Library className="h-3 w-3" />
                      Lvl {course.level}
                    </span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 pt-4">
                  <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 group-hover:bg-teal-50/30 group-hover:border-teal-100 transition-colors">
                    <div className="p-2 bg-white rounded-full shadow-sm">
                      <Users className="h-4 w-4 text-teal-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 text-lg leading-none">
                        {course.enrolled_students || 0}
                      </span>
                      <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">Students Enrolled</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="grid grid-cols-2 gap-3 pt-0 pb-5 px-5">
                  {/* StopPropagation ensures clicking the button doesn't trigger the card's onClick */}
                  <Button
                    variant="outline"
                    className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/lecturer/courses/${course.course_id || course.id}/students`);
                    }}
                  >
                    <Users className="mr-2 h-4 w-4" /> Class List
                  </Button>
                  <Button
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/lecturer/courses/${course.course_id || course.id}`);
                    }}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Grades
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-center">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No courses assigned</h3>
              <p className="text-slate-500 max-w-sm mt-1">
                You currently have no courses assigned for this semester. If you believe this is an error, please contact your Head of Department.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}