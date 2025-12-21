"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Save, Search, User, Filter, AlertCircle, CheckCircle2 } from "lucide-react"
import { hodAPI } from "@/lib/api"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function HODCoursesPage() {
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<any[]>([])
  const [lecturers, setLecturers] = useState<any[]>([])

  // State for tracking changes: { courseId: lecturerId }
  const [assignments, setAssignments] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [levelFilter, setLevelFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all") // all, assigned, unassigned

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [coursesRes, lecturersRes] = await Promise.all([
        hodAPI.getDepartmentCourses({ page_size: 100 }), // Fetch all for easy management
        hodAPI.getDepartmentLecturers({ page_size: 100 })
      ])

      // Handle Courses Response
      if (Array.isArray(coursesRes)) {
        setCourses(coursesRes)
      } else if (coursesRes.results) {
        setCourses(coursesRes.results)
      }

      // Handle Lecturers Response
      if (Array.isArray(lecturersRes)) {
        setLecturers(lecturersRes)
      } else if (lecturersRes.results) {
        setLecturers(lecturersRes.results)
      }

    } catch (error) {
      console.error("Failed to load data", error)
      toast.error("Failed to load department data")
    } finally {
      setLoading(false)
    }
  }

  // Handle Dropdown Change
  const handleAssignmentChange = (courseId: number, lecturerId: string) => {
    setAssignments(prev => ({
      ...prev,
      [courseId]: lecturerId
    }))
  }

  // Handle Save
  const handleSave = async () => {
    const updates = Object.entries(assignments).map(([cId, lId]) => ({
      course_id: Number(cId),
      lecturer_id: Number(lId)
    }))

    if (updates.length === 0) {
      return toast.info("No changes to save")
    }

    setSaving(true)
    try {
      const res = await hodAPI.bulkAssignCourses(updates)

      if (res && !res.error) {
        toast.success(`Successfully assigned ${res.total_successful} courses`)
        setAssignments({}) // Clear changes
        fetchData() // Refresh data
      } else {
        toast.error("Failed to save assignments")
      }
    } catch (error) {
      toast.error("Network error occurred")
    } finally {
      setSaving(false)
    }
  }

  // Filter Logic
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesLevel = levelFilter === "all" || course.level === levelFilter

    const isAssigned = course.lecturer !== null
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "assigned" && isAssigned) ||
      (statusFilter === "unassigned" && !isAssigned)

    return matchesSearch && matchesLevel && matchesStatus
  })

  const getLecturerName = (lec: any) => {
    if (lec.user?.full_name) return lec.user.full_name
    if (lec.name) return lec.name
    if (lec.user?.first_name && lec.user?.last_name) return `${lec.user.first_name} ${lec.user.last_name}`
    if (lec.user?.username) return lec.user.username
    return "Unknown Lecturer"
  }

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2) : "??"

  if (loading) {
    return (
      <DashboardLayout title="Course Allocation" role="hod">
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    )
  }

  const hasUnsavedChanges = Object.keys(assignments).length > 0

  return (
    <DashboardLayout title="Course Allocation" role="hod">
      <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Course Allocation</h1>
            <p className="text-gray-500">Assign lecturers to courses for the current academic session.</p>
          </div>

          {hasUnsavedChanges && (
            <div className="flex items-center gap-4 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200 animate-in slide-in-from-right-10">
              <span className="text-sm text-amber-800 font-medium">
                {Object.keys(assignments).length} unsaved changes
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setAssignments({})} className="text-amber-700 hover:text-amber-900 hover:bg-amber-100">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white border-none">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by course code or title..."
                  className="pl-9 bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-[140px] bg-white border-slate-200">
                    <Filter className="mr-2 h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-lg z-50">
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="100">100 Level</SelectItem>
                    <SelectItem value="200">200 Level</SelectItem>
                    <SelectItem value="300">300 Level</SelectItem>
                    <SelectItem value="400">400 Level</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px] bg-white border-slate-200">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-lg z-50">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="unassigned">Unassigned Only</SelectItem>
                    <SelectItem value="assigned">Assigned Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course List */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[100px]">Code</TableHead>
                  <TableHead className="min-w-[200px]">Course Title</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead className="w-[300px]">Assigned Lecturer</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                      No courses found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCourses.map((course) => {
                    // Determine current value: Pending assignment > Existing DB value > Unassigned
                    const currentAssignment = assignments[course.id]
                    const dbLecturerId = course.lecturer?.id?.toString()
                    const value = currentAssignment || dbLecturerId || "unassigned"
                    const isDirty = currentAssignment !== undefined && currentAssignment !== dbLecturerId

                    return (
                      <TableRow key={course.id} className={isDirty ? "bg-amber-50/30" : ""}>
                        <TableCell className="font-bold text-slate-700">{course.code}</TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-900">{course.title}</div>
                          <div className="text-xs text-slate-500 hidden sm:block">{course.semester_display}</div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{course.level}</Badge></TableCell>
                        <TableCell>{course.credits}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={value}
                              onValueChange={(val) => handleAssignmentChange(course.id, val)}
                            >
                              <SelectTrigger className={`w-full border-slate-200 bg-white ${isDirty ? 'border-amber-400 ring-1 ring-amber-400' : ''}`}>
                                <SelectValue placeholder="Select Lecturer" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-slate-200 shadow-lg z-50">
                                <SelectItem value="unassigned" className="text-red-500 font-medium">
                                  🚫 Unassigned
                                </SelectItem>
                                {lecturers.map((lec) => {
                                  const lecturerName = getLecturerName(lec)
                                  return (
                                    <SelectItem key={lec.id} value={lec.id.toString()}>
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-5 w-5">
                                          <AvatarFallback className="text-[9px]">
                                            {getInitials(lecturerName)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span>{lecturerName}</span>
                                      </div>
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {isDirty ? (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
                              Pending Save
                            </Badge>
                          ) : value !== "unassigned" ? (
                            <div className="flex items-center justify-end gap-1 text-green-600 text-xs font-medium">
                              <CheckCircle2 className="h-3 w-3" /> Assigned
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1 text-red-500 text-xs font-medium">
                              <AlertCircle className="h-3 w-3" /> Required
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}