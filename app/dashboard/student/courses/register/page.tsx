"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { registrationAPI } from "@/lib/api"
import { toast } from "sonner"
import { Loader2, BookOpen, AlertCircle, CheckCircle2, Info, ArrowLeft } from "lucide-react"

export default function CourseRegistrationPage() {
    const router = useRouter()

    // State
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [status, setStatus] = useState<any>(null)
    const [availableCourses, setAvailableCourses] = useState<any[]>([])
    const [selectedCourses, setSelectedCourses] = useState<number[]>([])

    // Initial Load
    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)

            // 1. Check Status
            const statusRes = await registrationAPI.getRegistrationStatus()
            console.log("Status Response:", statusRes) // Debugging
            setStatus(statusRes)

            // 2. Check Eligibility (Handle both nested and flat structures)
            const isEligible = statusRes?.can_register || statusRes?.registration_status?.can_register

            if (isEligible) {
                const coursesRes = await registrationAPI.getAvailableCoursesForRegistration()
                if (Array.isArray(coursesRes)) {
                    setAvailableCourses(coursesRes)
                }
            }
        } catch (error) {
            console.error("Failed to load registration data", error)
            toast.error("Failed to load registration data")
        } finally {
            setLoading(false)
        }
    }

    // Handle Checkbox Toggle
    const toggleCourse = (courseId: number) => {
        setSelectedCourses(prev =>
            prev.includes(courseId)
                ? prev.filter(id => id !== courseId)
                : [...prev, courseId]
        )
    }

    // Handle Submit
    const handleSubmit = async () => {
        if (selectedCourses.length === 0) {
            toast.error("Please select at least one course")
            return
        }

        setSubmitting(true)
        try {
            const response = await registrationAPI.registerCourses(selectedCourses)

            if (response && (response.successful?.length > 0 || !response.error)) {
                toast.success("Courses registered successfully!")
                router.push('/dashboard/student')
            } else {
                if (response.errors && response.errors.length > 0) {
                    toast.error(`Failed: ${response.errors[0]}`)
                } else {
                    toast.error("Registration failed")
                }
            }
        } catch (error: any) {
            toast.error("An unexpected error occurred")
        } finally {
            setSubmitting(false)
        }
    }

    // Loading State
    if (loading) {
        return (
            <DashboardLayout title="Course Registration" role="student">
                <div className="flex h-[50vh] items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
                </div>
            </DashboardLayout>
        )
    }

    // ✅ FIX: Check both top-level and nested 'can_register'
    const canRegister = status?.can_register || status?.registration_status?.can_register

    if (!canRegister) {
        return (
            <DashboardLayout title="Course Registration" role="student">
                <Card className="max-w-2xl mx-auto border-red-200 bg-red-50 mt-8">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-red-700">
                            <AlertCircle className="h-6 w-6" />
                            <CardTitle>Registration Closed</CardTitle>
                        </div>
                        <CardDescription className="text-red-600">
                            You are currently not eligible to register courses.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-sm text-red-800 p-4 border border-red-200 rounded bg-white/50">
                            <p className="font-semibold">Debug Info:</p>
                            <p>Paid Fees: {status?.registration_status?.has_paid_fees ? 'Yes' : 'No'}</p>
                            <p>Portal Open: {status?.current_semester?.is_registration_active ? 'Yes' : 'No'}</p>
                            <p>Deadline: {status?.current_semester?.registration_deadline}</p>
                        </div>
                        <Button onClick={() => router.push('/dashboard/student')} variant="outline">
                            Back to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </DashboardLayout>
        )
    }

    // Calculation for Summary
    const selectedCount = selectedCourses.length
    const totalCredits = availableCourses
        .filter(c => selectedCourses.includes(c.id))
        .reduce((sum, c) => sum + c.course_credits, 0)

    return (
        <DashboardLayout title="Course Registration" role="student">
            <div className="space-y-6 max-w-7xl mx-auto">

                <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-teal-700" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-blue-900">
                            {status?.current_semester?.session} Session
                        </h2>
                        <p className="text-blue-700 text-sm">
                            {status?.current_semester?.semester} Semester
                        </p>
                    </div>
                    <div className="flex gap-4 text-sm">
                        <div className="bg-white px-3 py-1 rounded border border-blue-100 shadow-sm">
                            <span className="text-muted-foreground">Registered: </span>
                            <span className="font-bold">{status?.registration_status?.registered_courses || 0} Courses</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Course List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-teal-600" />
                            Available Courses
                        </h3>

                        {availableCourses.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center text-muted-foreground">
                                    No new courses available. You may have registered all courses for your level.
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {availableCourses.map((offering) => (
                                    <Card
                                        key={offering.id}
                                        className={`transition-all duration-200 cursor-pointer ${selectedCourses.includes(offering.id) ? 'border-teal-500 ring-1 ring-teal-500 bg-teal-50/30' : 'hover:border-slate-300'}`}
                                        onClick={() => toggleCourse(offering.id)}
                                    >
                                        <div className="p-4 flex items-start gap-4">
                                            <Checkbox
                                                id={`course-${offering.id}`}
                                                checked={selectedCourses.includes(offering.id)}
                                                onCheckedChange={() => toggleCourse(offering.id)}
                                                className="mt-1 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                                            />
                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between items-start">
                                                    <label className="font-semibold text-gray-900 cursor-pointer">
                                                        {offering.course_code}: {offering.course_title}
                                                    </label>
                                                    <Badge variant="outline" className="ml-2 bg-white">
                                                        {offering.course_credits} Units
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-500 line-clamp-1">{offering.department_name}</p>
                                                <div className="text-xs text-gray-400 pt-1 flex gap-3">
                                                    <span>Lecturer: {offering.lecturer_name || "TBA"}</span>
                                                    <span>•</span>
                                                    <span>Slots: {offering.available_slots}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-6 border-teal-100 shadow-md">
                            <CardHeader className="bg-slate-50 border-b pb-4">
                                <CardTitle className="text-lg">Selection Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Selected Courses:</span>
                                    <span className="font-semibold">{selectedCount}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Total Units:</span>
                                    <span className="font-semibold">{totalCredits}</span>
                                </div>

                                {selectedCount > 0 && (
                                    <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded mt-2 flex gap-2">
                                        <Info className="h-4 w-4 shrink-0" />
                                        <span>
                                            These courses will be added to your academic record immediately.
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="pt-0">
                                <Button
                                    className="w-full bg-teal-600 hover:bg-teal-700"
                                    size="lg"
                                    disabled={selectedCount === 0 || submitting}
                                    onClick={handleSubmit}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" /> Register Courses
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}