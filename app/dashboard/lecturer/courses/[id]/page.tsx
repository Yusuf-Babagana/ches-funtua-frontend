"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Loader2,
    Save,
    ArrowLeft,
    Send,
    Search,
    CheckCircle2,
    EyeOff,
    FileSpreadsheet,
    Clock,
    Lock,
    AlertCircle,
    UserCheck
} from "lucide-react"
import { lecturerAPI } from "@/lib/api"
import { toast } from "sonner"

// Configuration
const MAX_CA_SCORE = 40;
const MAX_EXAM_SCORE = 60;

// Helper Styles
const inputClassName = "text-center h-9 font-mono border-slate-200 focus:border-teal-500 focus:ring-teal-500 disabled:bg-slate-50 disabled:text-slate-400 transition-colors";

export default function GradebookPage() {
    const params = useParams()
    const router = useRouter()
    const courseId = Number(params.id)

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [courseData, setCourseData] = useState<any>(null)
    const [students, setStudents] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState("")

    // 1. Fetch Data
    const fetchStudents = useCallback(async () => {
        try {
            setLoading(true)
            const response = await lecturerAPI.getCourseStudents(courseId)

            if (response && !response.error) {
                if (response.course) {
                    setCourseData(response.course)
                }

                // Handle Data Extraction
                let rawData: any[] = []
                if (response.grades && Array.isArray(response.grades)) {
                    rawData = response.grades
                } else if (response.students && Array.isArray(response.students)) {
                    rawData = response.students
                } else if (Array.isArray(response)) {
                    rawData = response
                }

                // Map to Flat Structure
                const mapped = rawData.map((item: any) => {
                    const s = item.student || item
                    const g = item.grade || {}

                    const ca = g.ca_score ?? s.ca_score ?? 0
                    const exam = g.exam_score ?? s.exam_score ?? 0
                    const total = g.score ?? s.total_score ?? 0
                    const letter = g.grade_letter ?? s.grade_letter ?? '-'
                    const status = g.status || s.status || 'new'
                    const isLocked = g.is_locked ?? false

                    return {
                        student_id: s.id || s.student_id,
                        name: s.full_name || s.name || "Unknown Student",
                        matric: s.matric_number || s.matric || "NO-MATRIC",
                        level: s.level || "N/A",
                        ca: ca > 0 ? ca : '',
                        exam: exam > 0 ? exam : '',
                        total: total,
                        grade_letter: letter,
                        status: status,
                        is_locked: isLocked,
                        has_grade: g.has_grade || false
                    }
                })

                setStudents(mapped)
            } else {
                console.warn("⚠️ API returned error or empty response")
            }
        } catch (error) {
            console.error("❌ Error loading gradebook:", error)
            toast.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }, [courseId])

    useEffect(() => {
        if (courseId) fetchStudents()
    }, [courseId, fetchStudents])

    // 2. Handle Input Changes
    const handleScoreChange = (id: number, field: 'ca' | 'exam', value: string) => {
        const student = students.find(s => s.student_id === id)
        if (student?.is_locked) {
            toast.error("This result is locked and cannot be edited.")
            return
        }

        if (value !== '' && isNaN(Number(value))) return

        setStudents(prev => prev.map(s => {
            if (s.student_id === id) {
                const caVal = field === 'ca' ? value : s.ca
                const examVal = field === 'exam' ? value : s.exam

                const caNum = Number(caVal) || 0
                const examNum = Number(examVal) || 0

                if (field === 'ca' && caNum > MAX_CA_SCORE) return s
                if (field === 'exam' && examNum > MAX_EXAM_SCORE) return s

                const newTotal = caNum + examNum

                return {
                    ...s,
                    [field]: value,
                    total: newTotal,
                    grade_letter: calculateGrade(newTotal),
                    status: s.status === 'new' ? 'draft' : s.status
                }
            }
            return s
        }))
    }

    const calculateGrade = (total: number) => {
        if (total >= 70) return 'A';
        if (total >= 60) return 'B';
        if (total >= 50) return 'C';
        if (total >= 45) return 'D';
        if (total >= 40) return 'E';
        return 'F';
    }

    // 3. Save / Submit
    const handleSave = async (submitToHod: boolean) => {
        setSubmitting(true)
        try {
            const payload = {
                course_id: courseId,
                action: submitToHod ? 'submit' : 'draft',
                grades: students
                    .filter(s => (Number(s.ca) > 0 || Number(s.exam) > 0 || s.has_grade))
                    .map(s => ({
                        student_id: s.student_id,
                        ca_score: Number(s.ca) || 0,
                        exam_score: Number(s.exam) || 0,
                        score: Number(s.total) || 0
                    }))
            }

            if (payload.grades.length === 0) {
                toast.info("No scores to save.")
                setSubmitting(false)
                return
            }

            await lecturerAPI.bulkEnterGrades(payload)

            if (submitToHod) {
                toast.success("Submitted to HOD successfully!")
                setStudents(prev => prev.map(s => (Number(s.total) > 0 && !s.is_locked) ? { ...s, status: 'submitted', is_locked: true } : s))
            } else {
                toast.success("Draft Saved")
            }

            setTimeout(() => { fetchStudents() }, 800)

        } catch (error) {
            console.error("Save Error:", error)
            toast.error("Failed to save")
        } finally {
            setSubmitting(false)
        }
    }

    // Filter Logic
    const filteredStudents = students.filter(student => {
        const nameMatch = (student.name || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matricMatch = (student.matric || "").toLowerCase().includes(searchQuery.toLowerCase());
        return nameMatch || matricMatch;
    });

    const getStatusBadge = (status: string) => {
        const s = (status || 'draft').toLowerCase();
        if (s === 'published') return <Badge className="bg-emerald-600 hover:bg-emerald-700 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Published</Badge>
        if (s === 'verified') return <Badge className="bg-teal-500 hover:bg-teal-600 border-teal-200">Verified</Badge>
        if (s === 'hod_approved') return <Badge className="bg-blue-500 hover:bg-blue-600 border-blue-200">Approved</Badge>
        if (s === 'submitted') return <Badge className="bg-indigo-500 hover:bg-indigo-600 border-indigo-200"><Clock className="w-3 h-3 mr-1" /> Submitted</Badge>
        return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50"><EyeOff className="w-3 h-3 mr-1" /> Draft</Badge>
    }

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-teal-600 h-10 w-10" />
            <p className="text-slate-500 text-sm animate-pulse">Loading Gradebook...</p>
        </div>
    )

    return (
        <DashboardLayout title="Gradebook" role="lecturer">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

                {/* Sticky Header Section */}
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 p-4 -mx-4 md:-mx-8 px-4 md:px-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full h-10 w-10">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                {courseData?.code || "Course"}
                                <span className="text-slate-300 font-light hidden sm:inline">|</span>
                                <span className="text-sm font-normal text-slate-500 hidden sm:inline">{courseData?.title}</span>
                            </h1>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                <Badge variant="secondary" className="text-[10px] h-5 bg-slate-100 text-slate-600 border-slate-200">
                                    {students.length} Students
                                </Badge>
                                <span className="hidden sm:inline">•</span>
                                <span className="hidden sm:inline">Max CA: {MAX_CA_SCORE}</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="hidden sm:inline">Max Exam: {MAX_EXAM_SCORE}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <Button variant="outline" onClick={() => handleSave(false)} disabled={submitting} className="flex-1 md:flex-none border-slate-300 text-slate-700 hover:bg-slate-50">
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4 text-slate-500" />}
                            Save Draft
                        </Button>
                        <Button onClick={() => handleSave(true)} disabled={submitting} className="flex-1 md:flex-none bg-teal-600 hover:bg-teal-700 text-white shadow-sm">
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Submit to HOD
                        </Button>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="relative max-w-md mx-auto md:mx-0 mb-6">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Filter by name or matric number..."
                        className="pl-10 border-slate-200 focus:ring-teal-500 focus:border-teal-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Grade Table Card */}
                <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50/80 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 min-w-[250px] font-semibold text-slate-600">Student Identity</th>
                                        <th className="px-2 py-4 w-24 text-center font-semibold text-slate-600">
                                            C.A <span className="text-[10px] text-slate-400 font-normal block">/ {MAX_CA_SCORE}</span>
                                        </th>
                                        <th className="px-2 py-4 w-24 text-center font-semibold text-slate-600">
                                            Exam <span className="text-[10px] text-slate-400 font-normal block">/ {MAX_EXAM_SCORE}</span>
                                        </th>
                                        <th className="px-4 py-4 w-20 text-center font-semibold text-slate-600">Total</th>
                                        <th className="px-4 py-4 w-20 text-center font-semibold text-slate-600">Grade</th>
                                        <th className="px-6 py-4 w-32 text-right font-semibold text-slate-600">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredStudents.length > 0 ? (
                                        filteredStudents.map((student) => (
                                            <tr key={student.student_id} className={`group transition-colors ${student.is_locked ? 'bg-slate-50/30' : 'hover:bg-slate-50/50'}`}>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${student.is_locked ? 'bg-slate-200 text-slate-500' : 'bg-teal-50 text-teal-700'}`}>
                                                            {student.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className={`font-medium ${student.is_locked ? 'text-slate-500' : 'text-slate-900'}`}>{student.name}</div>
                                                            <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                                                                {student.matric}
                                                                {student.is_locked && <Lock className="h-3 w-3 text-slate-400" />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-3">
                                                    <Input
                                                        className={`${inputClassName} ${Number(student.ca) > MAX_CA_SCORE ? 'border-red-300 text-red-600 bg-red-50' : ''}`}
                                                        value={student.ca}
                                                        onChange={(e) => handleScoreChange(student.student_id, 'ca', e.target.value)}
                                                        disabled={student.is_locked}
                                                        placeholder="-"
                                                    />
                                                </td>
                                                <td className="px-2 py-3">
                                                    <Input
                                                        className={`${inputClassName} ${Number(student.exam) > MAX_EXAM_SCORE ? 'border-red-300 text-red-600 bg-red-50' : ''}`}
                                                        value={student.exam}
                                                        onChange={(e) => handleScoreChange(student.student_id, 'exam', e.target.value)}
                                                        disabled={student.is_locked}
                                                        placeholder="-"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className={`font-bold text-lg ${student.total >= 50 ? 'text-slate-700' : 'text-red-500'}`}>
                                                        {student.total || "-"}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {student.total > 0 ? (
                                                        <Badge variant="outline" className={`font-mono ${student.grade_letter === 'F' ? 'bg-red-50 text-red-600 border-red-200' :
                                                                student.grade_letter === 'A' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                                    'bg-white text-slate-600 border-slate-200'
                                                            }`}>
                                                            {student.grade_letter}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    {getStatusBadge(student.status)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="text-center py-20">
                                                <div className="flex flex-col items-center justify-center text-slate-400">
                                                    <FileSpreadsheet className="h-12 w-12 mb-3 opacity-20" />
                                                    <p className="text-lg font-medium text-slate-500">No students found.</p>
                                                    <p className="text-sm mt-1 max-w-xs mx-auto">
                                                        Try adjusting your search query or contact ICT if the student list seems empty.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}