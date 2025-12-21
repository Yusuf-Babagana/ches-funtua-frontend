"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"

export default function AttendancePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [courses, setCourses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("")

  // Redirect if user is not lecturer
  useEffect(() => {
    if (!loading && (!user || user.role !== "lecturer")) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Fetch courses for lecturer
  useEffect(() => {
    if (!user) return

    const fetchCourses = async () => {
      const res = await fetch(`/api/courses?lecturer_id=${user.id}`)
      const data = await res.json()
      setCourses(data || [])
    }

    fetchCourses()
  }, [user])

  // When a course is selected, fetch its students + attendance
  useEffect(() => {
    if (!selectedCourse) return

    const fetchData = async () => {
      const studentRes = await fetch(`/api/course-registrations?course_id=${selectedCourse}`)
      const studentData = await studentRes.json()

      const attendanceRes = await fetch(`/api/attendance?course_id=${selectedCourse}`)
      const attendanceData = await attendanceRes.json()

      setStudents(studentData || [])
      setAttendance(attendanceData || [])
    }

    fetchData()
  }, [selectedCourse])

  if (loading || !user) return null

  // Compute attendance stats
  const getAttendance = (studentId: string) => {
    const records = attendance.filter((a) => a.student_id === studentId)
    const present = records.filter((r) => r.status === "present").length
    const total = records.length
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0

    return { present, total, percentage }
  }

  return (
    <DashboardLayout title="Attendance" role="lecturer">
      <div className="space-y-6">

        {/* Course Selector */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.code} - {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedCourse && (
            <Button onClick={() => router.push(`/dashboard/lecturer/attendance/mark?course=${selectedCourse}`)}>
              <Calendar className="mr-2 h-4 w-4" />
              Mark Attendance
            </Button>
          )}
        </div>

        {/* Attendance Table */}
        {selectedCourse ? (
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>View and manage student attendance</CardDescription>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Present</TableHead>
                    <TableHead>Total Classes</TableHead>
                    <TableHead>Attendance %</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {students.map((student: any) => {
                    const data = getAttendance(student.id)
                    const statusColor =
                      data.percentage >= 75
                        ? "bg-green-100 text-green-800"
                        : data.percentage >= 50
                          ? "bg-orange-100 text-orange-800"
                          : "bg-red-100 text-red-800"

                    return (
                      <TableRow key={student.id}>
                        <TableCell>{student.student_id}</TableCell>
                        <TableCell>{student.full_name}</TableCell>
                        <TableCell>{data.present}</TableCell>
                        <TableCell>{data.total}</TableCell>
                        <TableCell>{data.percentage}%</TableCell>
                        <TableCell>
                          <Badge className={statusColor} variant="secondary">
                            {data.percentage >= 75 ? "Good" : data.percentage >= 50 ? "Fair" : "Poor"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">
                Select a course to view attendance records
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
