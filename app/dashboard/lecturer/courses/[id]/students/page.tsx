"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { lecturerAPI } from "@/lib/api"
import {
    Loader2,
    ArrowLeft,
    User,
    Search,
    Download,
    Users,
    FileSpreadsheet,
    GraduationCap
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

// Helper to generate initials
const getInitials = (name: string) => {
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}

export default function CourseStudentsPage() {
    const params = useParams()
    const router = useRouter()
    const courseId = Number(params.id)

    const [loading, setLoading] = useState(true)
    const [course, setCourse] = useState<any>(null)
    const [students, setStudents] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        if (courseId) {
            fetchData()
        }
    }, [courseId])

    const fetchData = async () => {
        try {
            setLoading(true)

            // 1. Fetch Students for this specific course
            const response = await lecturerAPI.getCourseStudents(courseId)

            if (response && !response.error) {
                let rawData: any[] = []

                // Handle the 'grades' key structure from the updated backend
                if (response.grades && Array.isArray(response.grades)) {
                    rawData = response.grades.map((item: any) => ({
                        ...item.student,
                        registration_id: item.enrollment_id || item.id,
                        status: 'active'
                    }))

                    // Set course info if available
                    if (response.course) {
                        setCourse({
                            title: response.course.title,
                            code: response.course.code,
                            session: response.course.session
                        })
                    }
                }
                // Fallback for other structures
                else if (response.students && Array.isArray(response.students)) {
                    rawData = response.students
                    setCourse(response.course)
                } else if (Array.isArray(response)) {
                    rawData = response
                } else if (response.results) {
                    rawData = response.results
                }

                setStudents(rawData)
            } else {
                toast.error("Failed to load students")
            }

            // 2. Fetch course info separately if missing (Fallback)
            if (!course && !response?.course) {
                const coursesRes = await lecturerAPI.getCourses()
                if (Array.isArray(coursesRes)) {
                    const current = coursesRes.find((c: any) => c.course_id === courseId || c.id === courseId)
                    if (current) setCourse(current)
                }
            }

        } catch (error) {
            console.error(error)
            toast.error("Error loading course data")
        } finally {
            setLoading(false)
        }
    }

    // Filter students based on search
    const filteredStudents = students.filter(student => {
        const name = student.name || student.full_name || student.username || ""
        const matric = student.matric || student.matric_number || student.reg_number || ""
        const query = searchQuery.toLowerCase()
        return name.toLowerCase().includes(query) || matric.toLowerCase().includes(query)
    })

    if (loading) {
        return (
            <DashboardLayout title="Enrolled Students" role="lecturer">
                <div className="flex flex-col gap-4 h-[60vh] items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
                    <p className="text-slate-500 text-sm animate-pulse">Loading Class List...</p>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout title="Enrolled Students" role="lecturer">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Header Section */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mt-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="text-teal-700 bg-teal-50 border-teal-200 text-base px-3 py-1 rounded-md">
                                    {course?.code || "Course"}
                                </Badge>
                                <span className="text-slate-300">|</span>
                                <span className="text-slate-500 font-medium text-sm flex items-center gap-1">
                                    <Users className="h-4 w-4" /> {students.length} Students
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-slate-800 mt-2">
                                {course?.title}
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">
                                Verified list of registered students for the current academic session.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center">
                        <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50">
                            <Download className="mr-2 h-4 w-4" /> Export CSV
                        </Button>
                        <Button
                            onClick={() => router.push(`/dashboard/lecturer/courses/${courseId}`)}
                            className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-200"
                        >
                            <FileSpreadsheet className="mr-2 h-4 w-4" /> Manage Grades
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <Card className="border-slate-200 shadow-md shadow-slate-200/50">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="space-y-1">
                                <CardTitle className="text-lg text-slate-800">Class Roster</CardTitle>
                                <CardDescription>Search and filter registered students.</CardDescription>
                            </div>
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Search name or matric number..."
                                    className="pl-10 bg-white border-slate-200 focus:ring-teal-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {filteredStudents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                <div className="bg-slate-100 p-4 rounded-full mb-3">
                                    <Users className="h-8 w-8 text-slate-300" />
                                </div>
                                <p className="text-lg font-medium text-slate-600">No students found</p>
                                <p className="text-sm">Try adjusting your search criteria.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow>
                                        <TableHead className="w-[80px] text-center">S/N</TableHead>
                                        <TableHead>Student Name</TableHead>
                                        <TableHead>Matric Number</TableHead>
                                        <TableHead>Level</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead className="text-right pr-6">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStudents.map((student, index) => {
                                        const fullName = student.full_name || student.name || "Unknown";
                                        return (
                                            <TableRow key={student.id || student.student_id || index} className="hover:bg-slate-50/60 transition-colors group">
                                                <TableCell className="text-center font-medium text-slate-500">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-xs">
                                                            {getInitials(fullName)}
                                                        </div>
                                                        <span className="font-semibold text-slate-700 group-hover:text-teal-700 transition-colors">
                                                            {fullName}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-sm text-slate-600 bg-slate-50/50 rounded px-2 py-1 w-fit">
                                                    {student.matric_number || student.matric || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5 text-slate-600">
                                                        <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                                                        {student.level || "N/A"}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-600">
                                                    {typeof student.department === 'object' ? student.department?.name : (student.department || "N/A")}
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm">
                                                        Registered
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
            </div>
        </DashboardLayout>
    )
}