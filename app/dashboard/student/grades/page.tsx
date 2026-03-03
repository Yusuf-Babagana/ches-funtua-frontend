"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, GraduationCap, ChevronDown, ChevronUp, Home, BookOpen, Settings, Printer } from "lucide-react"
import { academicsAPI } from "@/lib/api"
import { toast } from "sonner"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export default function StudentGradesPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [openSemesters, setOpenSemesters] = useState<number[]>([0]) // Open first (latest) semester by default

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await academicsAPI.getStudentHistory()
        setData(response)
      } catch (error) {
        console.error("Failed to load grades", error)
        toast.error("Failed to load academic record")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const toggleSemester = (index: number) => {
    setOpenSemesters(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  const sidebarItems = [
    { href: "/dashboard/student", label: "Overview", icon: Home, active: false },
    { href: "/dashboard/student/courses", label: "My Courses", icon: BookOpen, active: false },
    { href: "/dashboard/student/grades", label: "Results", icon: GraduationCap, active: true },
    { href: "/dashboard/student/settings", label: "Settings", icon: Settings, active: false }
  ]

  if (loading) {
    return (
      <DashboardLayout title="My Results" role="student" sidebarItems={sidebarItems}>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="My Results" role="student" sidebarItems={sidebarItems}>
      <div className="space-y-6 max-w-5xl mx-auto print:max-w-none">

        <div className="flex justify-between items-center print:hidden">
          <h2 className="text-xl font-bold text-slate-800">Academic Record</h2>
          <Button
            onClick={() => window.print()}
            className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
          >
            <Printer className="mr-2 h-4 w-4" /> Download / Print
          </Button>
        </div>

        {/* CGPA Card */}
        <div className="bg-gradient-to-r from-teal-800 to-teal-600 rounded-xl p-6 text-white shadow-lg flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{data?.student_info?.name}</h1>
            <p className="text-teal-100 opacity-90 font-mono text-sm mt-1">{data?.student_info?.matric}</p>
            <p className="text-teal-100 text-sm mt-0.5">{data?.student_info?.department}</p>
          </div>
          <div className="text-right bg-white/10 p-3 rounded-lg backdrop-blur-sm">
            <p className="text-teal-100 text-xs font-medium uppercase tracking-wider mb-1">Current CGPA</p>
            <div className="text-4xl font-bold tracking-tight">{data?.current_cgpa}</div>
          </div>
        </div>

        {/* Results List */}
        {!data?.history || data.history.length === 0 ? (
          <Card className="border-dashed border-2 bg-slate-50">
            <CardContent className="py-16 text-center text-slate-500">
              <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-lg font-medium">No results published yet.</p>
              <p className="text-sm">Check back after exams are concluded and approved.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {data.history.map((semester: any, index: number) => (
              <Collapsible
                key={index}
                open={openSemesters.includes(index)}
                onOpenChange={() => toggleSemester(index)}
                className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSemester(index)}>
                  <div className="flex items-center gap-4">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 h-8 w-8 hover:bg-slate-200 rounded-full">
                        {openSemesters.includes(index) ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
                      </Button>
                    </CollapsibleTrigger>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{semester.session} Session</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs uppercase font-medium bg-slate-100 text-slate-600 border-slate-200">
                          {semester.semester} Semester
                        </Badge>
                        <span className="text-xs text-slate-400">• {semester.total_units} Units</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 pr-2">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">GPA</p>
                      <p className="font-bold text-xl text-teal-700">{semester.gpa}</p>
                    </div>
                  </div>
                </div>

                <CollapsibleContent>
                  <div className="border-t border-slate-100">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50/50 text-xs text-slate-500 uppercase font-semibold">
                          <tr>
                            <th className="px-6 py-3 min-w-[200px]">Course</th>
                            <th className="px-4 py-3 text-center w-20">Unit</th>
                            <th className="px-4 py-3 text-center w-20">Score</th>
                            <th className="px-4 py-3 text-center w-20">Grade</th>
                            <th className="px-4 py-3 text-center w-20">Points</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {semester.courses.map((course: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-800">{course.course_code}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{course.course_title}</div>
                              </td>
                              <td className="px-4 py-4 text-center text-slate-600 font-medium">{course.credits}</td>
                              <td className="px-4 py-4 text-center font-medium text-slate-900">{Number(course.score).toFixed(0)}</td>
                              <td className="px-4 py-4 text-center">
                                <Badge className={`
                                                            ${course.grade === 'A' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200' : ''}
                                                            ${course.grade === 'B' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200' : ''}
                                                            ${course.grade === 'C' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200' : ''}
                                                            ${course.grade === 'D' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200' : ''}
                                                            ${course.grade === 'F' ? 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200' : ''}
                                                            w-8 h-8 flex items-center justify-center mx-auto text-sm font-bold shadow-none
                                                        `}>
                                  {course.grade}
                                </Badge>
                              </td>
                              <td className="px-4 py-4 text-center text-slate-600 font-mono">{course.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}