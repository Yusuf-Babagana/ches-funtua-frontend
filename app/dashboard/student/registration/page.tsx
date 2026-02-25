"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { academicsAPI, financeAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, CheckCircle, BookOpen } from "lucide-react"
import { toast } from "sonner" // Assuming you use sonner or similar for toasts

interface CourseOffering {
  id: number
  course_code: string
  course_title: string
  course_credits: number
  lecturer_name: string
  department_name: string
  available_slots: number
  is_registration_open: boolean
}

export default function CourseRegistrationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [canRegister, setCanRegister] = useState(false)
  const [courses, setCourses] = useState<CourseOffering[]>([])
  const [selectedCourses, setSelectedCourses] = useState<number[]>([])
  const [statusMessage, setStatusMessage] = useState("")

  // Fetch Data on Load
  // Fetch Data on Load
  useEffect(() => {
    const init = async () => {
      try {
        // 1. Check if eligible
        const statusRes = await academicsAPI.getRegistrationStatus()

        console.log("🔍 Debug Registration Status:", statusRes) // Add this to see what you get

        // CASE 1: Handle API Errors (if your api.ts returns { error: ... } on failure)
        if (statusRes.error) {
          setStatusMessage(statusRes.error.detail || "Failed to check registration status.")
          setCanRegister(false)
          setLoading(false)
          return
        }

        // 2. Fetch Invoice (Source of truth for financial status)
        const invRes = await financeAPI.getCurrentInvoice()
        const currentInvoice = (invRes && !invRes.error) ? invRes : null

        // CASE 2: No Current Semester (Backend specific response)
        if (statusRes.has_current_semester === false) {
          setStatusMessage(statusRes.message || "No active semester found.")
          setCanRegister(false)
          setLoading(false)
          return
        }

        // CASE 3: Valid Response but missing data
        if (!statusRes.registration_status) {
          setStatusMessage("Invalid server response. Please contact support.")
          setCanRegister(false)
          setLoading(false)
          return
        }

        // CASE 4: Success path
        const status = statusRes.registration_status

        // Robust check: registration status flag OR invoice balance
        const isPaid = status.has_paid_fees || (currentInvoice && Number(currentInvoice.balance) <= 0)

        if (!status.can_register && !isPaid) {
          setCanRegister(false)
          setStatusMessage("You must pay your fees before registering.")
          setLoading(false)
          return
        }

        setCanRegister(true)

        // 3. Get Available Courses
        const coursesRes = await academicsAPI.getAvailableCourses()
        // Safety check for courses response
        if (Array.isArray(coursesRes)) {
          setCourses(coursesRes)
        } else {
          console.error("Courses response is not an array:", coursesRes)
          setCourses([]) // Fallback to empty array
        }

      } catch (error) {
        console.error("Failed to load registration data", error)
        setStatusMessage("Failed to load course data. Please check your network.")
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])


  // Handle Checkbox Toggle
  const toggleCourse = (courseId: number) => {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  // Handle Submission
  const handleSubmit = async () => {
    if (selectedCourses.length === 0) {
      toast.error("Please select at least one course")
      return
    }

    if (selectedCourses.length > 6) {
      toast.error("You cannot register more than 6 courses")
      return
    }

    setSubmitting(true)
    try {
      // Use the bulk method we added to api.ts
      await academicsAPI.registerCourses(selectedCourses)

      toast.success("Courses registered successfully!")
      router.push('/dashboard/student') // Redirect to dashboard to see schedule

    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Registration failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // --- RENDER HELPERS ---

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Checking eligibility...</span>
      </div>
    )
  }

  if (!canRegister) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Registration Locked</AlertTitle>
          <AlertDescription>{statusMessage}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/dashboard/student')}
        >
          Back to Dashboard
        </Button>
      </div>
    )
  }

  const totalSelectedCredits = courses
    .filter(c => selectedCourses.includes(c.id))
    .reduce((sum, c) => sum + c.course_credits, 0)

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Course Registration</h1>
          <p className="text-muted-foreground">Select courses for the current semester.</p>
        </div>
        <div className="flex items-center gap-4 bg-secondary/50 px-4 py-2 rounded-lg border">
          <div className="text-sm">
            <span className="text-muted-foreground">Selected:</span>
            <span className="ml-1 font-bold text-primary">{selectedCourses.length}/6</span>
          </div>
          <div className="h-4 w-[1px] bg-border" />
          <div className="text-sm">
            <span className="text-muted-foreground">Credits:</span>
            <span className="ml-1 font-bold text-primary">{totalSelectedCredits}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {courses.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No available courses found for your level and department.
            </CardContent>
          </Card>
        ) : (
          courses.map((course) => (
            <Card key={course.id} className={`transition-all ${selectedCourses.includes(course.id) ? 'border-primary ring-1 ring-primary/20' : ''}`}>
              <CardContent className="flex items-start gap-4 p-4">
                <Checkbox
                  id={`course-${course.id}`}
                  checked={selectedCourses.includes(course.id)}
                  onCheckedChange={() => toggleCourse(course.id)}
                  className="mt-1"
                />
                <div className="grid gap-1 flex-1">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={`course-${course.id}`}
                      className="font-semibold cursor-pointer hover:text-primary transition-colors"
                    >
                      {course.course_code}: {course.course_title}
                    </label>
                    <Badge variant="outline">{course.course_credits} Units</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {course.department_name}
                    </span>
                    <span>•</span>
                    <span>Lecturer: {course.lecturer_name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={course.available_slots > 10 ? "secondary" : "destructive"} className="text-xs">
                      {course.available_slots} slots left
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 lg:pl-[280px]">
        <div className="max-w-5xl mx-auto flex justify-end gap-4">
          <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedCourses.length === 0 || submitting}
            className="min-w-[150px]"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Register Selected
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}