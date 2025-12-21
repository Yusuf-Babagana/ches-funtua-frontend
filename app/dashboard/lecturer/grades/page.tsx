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
import { lecturerAPI } from "@/lib/api"
import { Plus, Loader2 } from "lucide-react"

export default function GradesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [courses, setCourses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])

  const [loadingCourses, setLoadingCourses] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "lecturer") {
        router.push("/login")
      } else {
        fetchCourses()
      }
    }
  }, [user, authLoading, router])

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true)
      const response = await lecturerAPI.getCourses()
      if (response && !response.error) {
        // Handle paginated or list response
        const courseList = Array.isArray(response) ? response : response.results || []
        setCourses(courseList)
      } else {
        console.error("Failed to fetch courses", response)
      }
    } catch (err) {
      console.error("Error fetching courses:", err)
    } finally {
      setLoadingCourses(false)
    }
  }

  const fetchCourseData = async (courseId: string) => {
    try {
      setLoadingData(true)
      setError(null)

      // Fetch both students and grades in parallel
      const [studentsRes, gradesRes] = await Promise.all([
        lecturerAPI.getCourseStudents(parseInt(courseId)),
        lecturerAPI.getCourseGrades(parseInt(courseId))
      ])

      if (studentsRes && !studentsRes.error) {
        let rawData = []
        if (Array.isArray(studentsRes)) {
          rawData = studentsRes
        } else if (studentsRes.students && Array.isArray(studentsRes.students)) {
          rawData = studentsRes.students
        } else if (studentsRes.results && Array.isArray(studentsRes.results)) {
          rawData = studentsRes.results
        } else if (studentsRes.data && Array.isArray(studentsRes.data)) {
          rawData = studentsRes.data
        }

        // Normalize data
        const studentList = rawData.map((item: any) => {
          if (item.student && typeof item.student === 'object') {
            return {
              ...item.student,
              id: item.student.id, // Ensure ID is top level
              registration_id: item.id
            }
          }
          return item
        })

        setStudents(studentList)
      }

      if (gradesRes && !gradesRes.error) {
        const gradesList = Array.isArray(gradesRes) ? gradesRes : gradesRes.results || []
        setGrades(gradesList)
      }

    } catch (err) {
      console.error("Error fetching course data:", err)
      setError("Failed to load course data. Please try again.")
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseData(selectedCourse)
    } else {
      setStudents([])
      setGrades([])
    }
  }, [selectedCourse])

  const getStudentGrades = (studentId: number) => {
    return grades.filter((g) => g.student === studentId)
  }

  const calculateAverage = (studentId: number) => {
    const studentGrades = getStudentGrades(studentId)
    if (studentGrades.length === 0) return 0
    // Assuming score is out of 100 for simplicity, strict logic depends on assessments config
    const total = studentGrades.reduce((sum, g) => sum + (g.score || 0), 0)
    // For now, let's just show total score or simple average if multiple assessments
    // This logic might need refinement based on how many assessments constitute 100%
    return Math.round(total / (studentGrades.length || 1))
  }

  if (authLoading || !user) return null

  return (
    <DashboardLayout title="Grades" role="lecturer">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder={loadingCourses ? "Loading courses..." : "Select a course"} />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.code} - {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCourse && (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Assessment
            </Button>
          )}
        </div>

        {selectedCourse ? (
          <Card>
            <CardHeader>
              <CardTitle>Student Grades</CardTitle>
              <CardDescription>View and manage student assessments</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
              ) : students.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No students registered for this course yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matric No.</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Assessments</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      // Student object structure might vary based on API return (nested user object or direct fields)
                      const studentId = student.id
                      const studentName = student.full_name || student.user?.full_name || "Unknown"
                      const matricNo = student.matric_number || "N/A"

                      const studentGrades = getStudentGrades(studentId)
                      // Calculate total score assuming grades are additive parts of 100
                      const totalScore = studentGrades.reduce((sum, g) => sum + Number(g.score), 0)

                      const gradeColor =
                        totalScore >= 70
                          ? "bg-green-100 text-green-800"
                          : totalScore >= 50
                            ? "bg-orange-100 text-orange-800"
                            : "bg-red-100 text-red-800"

                      let gradeLetter = "F"
                      if (totalScore >= 70) gradeLetter = "A"
                      else if (totalScore >= 60) gradeLetter = "B"
                      else if (totalScore >= 50) gradeLetter = "C"
                      else if (totalScore >= 45) gradeLetter = "D"

                      return (
                        <TableRow key={studentId}>
                          <TableCell className="font-medium">{matricNo}</TableCell>
                          <TableCell>{studentName}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {studentGrades.map((grade) => (
                                <Badge key={grade.id} variant="secondary">
                                  {grade.type || "Test"}: {grade.score}
                                </Badge>
                              ))}
                              {studentGrades.length === 0 && (
                                <span className="text-sm text-muted-foreground">No assessments</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-bold">{totalScore}</TableCell>
                          <TableCell>
                            <Badge className={gradeColor} variant="secondary">
                              {gradeLetter}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">Select a course to view grades</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
