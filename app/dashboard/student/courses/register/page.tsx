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
import { Loader2, BookOpen, AlertCircle, CheckCircle2, Info, ArrowLeft, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"

export default function CourseRegistrationPage() {
    const router = useRouter()
    const { user } = useAuth()

    // State
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [status, setStatus] = useState<any>(null)
    const [availableCourses, setAvailableCourses] = useState<any[]>([])
    const [selectedCourses, setSelectedCourses] = useState<number[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedDepartment, setSelectedDepartment] = useState("all")
    const [showConfirmModal, setShowConfirmModal] = useState(false)

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

            // 2. Fetch Invoice (Fallback check)
            const invRes = await financeAPI.getCurrentInvoice()
            const currentInvoice = (invRes && !invRes.error) ? invRes : null

            // 3. Check Eligibility (Handle both nested and flat structures)
            const isRegActive = statusRes?.can_register || statusRes?.registration_status?.can_register
            const isPaid = statusRes?.registration_status?.has_paid_fees || (currentInvoice && Number(currentInvoice.balance) <= 0)

            if (isRegActive && isPaid) {
                const coursesRes = await registrationAPI.getAvailableCoursesForRegistration()
                if (Array.isArray(coursesRes)) {
                    setAvailableCourses(coursesRes)
                }
            }

            // Store invoice for the render check if needed, though we check balance directly here
            setStatus({ ...statusRes, currentInvoice })
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
        setSubmitting(true)
        try {
            const response = await registrationAPI.registerCourses(selectedCourses)

            if (response && (response.successful?.length > 0 || (!response.error && !response.errors))) {
                toast.success("Courses registered successfully!")
                router.push('/dashboard/student')
            } else {
                const errorMsg = response?.error?.error || response?.error?.detail || response?.errors?.[0] || "Registration failed"
                toast.error(errorMsg)
            }
        } catch (error: any) {
            // If the API call itself fails (e.g., network error), 'response' won't be defined.
            // In such cases, we use a generic error message.
            // If 'error' contains a response from the server (e.g., axios error), we can try to extract it.
            const errorMsg = error?.response?.data?.detail || error?.message || "An unexpected error occurred"
            toast.error(errorMsg)
        } finally {
            setSubmitting(false)
            setShowConfirmModal(false)
        }
    }

    const handleRegisterClick = () => {
        if (selectedCourses.length === 0) {
            toast.error("Please select at least one course")
            return
        }
        setShowConfirmModal(true)
    }

    // Filtering Logic
    const departments = ["all", ...Array.from(new Set(availableCourses.map(c => c.department_name)))]

    const filteredCourses = availableCourses.filter(course => {
        const matchesSearch =
            course.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.course_title.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesDept = selectedDepartment === "all" || course.department_name === selectedDepartment
        return matchesSearch && matchesDept
    })

    const getCourseLevel = (code: string) => {
        const match = code.match(/\d/)
        return match ? `${match[0]}00 Level` : "N/A"
    }

    const selectedCourseObjects = availableCourses.filter(c => selectedCourses.includes(c.id))
    const hasExternalCourses = selectedCourseObjects.some(c => c.department_name !== (user?.department_name || status?.student?.department_name))

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

    // ✅ FIX: Check both top-level and nested 'can_register', and explicitly check fee status
    // ✅ Robust Payment Check
    const isPaid = status?.registration_status?.has_paid_fees || (status?.currentInvoice && Number(status.currentInvoice.balance) <= 0)
    const canRegister = (status?.can_register || status?.registration_status?.can_register) && isPaid

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
                            {status?.registration_status?.has_paid_fees === false
                                ? "Full tuition payment is required before you can register for courses."
                                : "You are currently not eligible to register courses."}
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

                <div className="flex justify-between items-center bg-transparent p-0">
                    <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-teal-700" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchData}
                        disabled={loading}
                        className="border-teal-100 text-teal-700"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Status
                    </Button>
                </div>

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

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                    <div className="lg:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by course code or title..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="lg:col-span-2 flex gap-2">
                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                            <SelectTrigger className="w-full">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-muted-foreground" />
                                    <SelectValue placeholder="All Departments" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map((dept) => (
                                    <SelectItem key={dept} value={dept || "unknown"}>
                                        {dept === "all" ? "All Departments" : dept}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Course List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-teal-600" />
                                Available Courses
                            </h3>
                            <span className="text-sm text-muted-foreground">
                                Showing {filteredCourses.length} of {availableCourses.length}
                            </span>
                        </div>

                        {filteredCourses.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center text-muted-foreground">
                                    {availableCourses.length === 0
                                        ? "No new courses available. You may have registered all courses for your level."
                                        : "No courses match your search or filter criteria."}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {filteredCourses.map((offering) => (
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
                                                    <div className="flex flex-col">
                                                        <label className="font-semibold text-gray-900 cursor-pointer">
                                                            {offering.course_code}: {offering.course_title}
                                                        </label>
                                                        <div className="flex gap-2 items-center mt-1">
                                                            <Badge variant="secondary" className="text-[10px] h-5 bg-slate-100 text-slate-700 font-medium">
                                                                {getCourseLevel(offering.course_code)}
                                                            </Badge>
                                                            {offering.department_name !== (user?.department_name || status?.student?.department_name) && (
                                                                <Badge variant="outline" className="text-[10px] h-5 bg-amber-50 text-amber-700 border-amber-200 font-medium">
                                                                    External Dept
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="ml-2 bg-white">
                                                        {offering.course_credits} Units
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-teal-700 font-medium pt-1">{offering.department_name}</p>
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
                                    onClick={handleRegisterClick}
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

                {/* Confirmation Modal */}
                <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Confirm Registration</DialogTitle>
                            <DialogDescription>
                                Please review your selected courses before finalizing.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4 space-y-4">
                            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                                {selectedCourseObjects.map(course => (
                                    <div key={course.id} className="flex justify-between items-start p-2 border rounded-md text-sm">
                                        <div>
                                            <p className="font-medium">{course.course_code}: {course.course_title}</p>
                                            <p className={`text-[11px] ${course.department_name !== (user?.department_name || status?.student?.department_name) ? 'text-amber-600 font-bold' : 'text-muted-foreground'}`}>
                                                {course.department_name}
                                                {course.department_name !== (user?.department_name || status?.student?.department_name) && " (External)"}
                                            </p>
                                        </div>
                                        <span className="text-xs font-mono">{course.course_credits} Units</span>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-slate-50 p-3 rounded-lg space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Courses:</span>
                                    <span className="font-bold">{selectedCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Units:</span>
                                    <span className="font-bold">{totalCredits}</span>
                                </div>
                            </div>

                            {hasExternalCourses && (
                                <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                                    <Info className="h-4 w-4 text-amber-600" />
                                    <AlertDescription className="text-xs">
                                        You have selected courses from other departments. Please ensure you have approval where necessary.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" onClick={() => setShowConfirmModal(false)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleSubmit} disabled={submitting}>
                                {submitting ? "Processing..." : "Confirm & Register"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    )
}