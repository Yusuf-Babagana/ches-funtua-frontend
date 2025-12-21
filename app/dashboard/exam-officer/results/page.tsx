"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { examOfficerAPI } from "@/lib/api"
import {
    Loader2,
    Eye,
    CheckCircle,
    AlertTriangle,
    FileSpreadsheet,
    BookOpen,
    User,
    GraduationCap,
    TrendingUp,
    BarChart3,
    AlertOctagon
} from "lucide-react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function ResultsProcessingPage() {
    const [courses, setCourses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCourse, setSelectedCourse] = useState<any>(null)
    const [courseDetails, setCourseDetails] = useState<any>(null)
    const [detailsLoading, setDetailsLoading] = useState(false)
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    useEffect(() => {
        fetchPendingCourses()
    }, [])

    const fetchPendingCourses = async () => {
        try {
            setLoading(true)
            const data = await examOfficerAPI.getCoursesPendingResults()
            if (Array.isArray(data)) {
                setCourses(data)
            }
        } catch (error) {
            toast.error("Failed to load pending results")
        } finally {
            setLoading(false)
        }
    }

    const openCourseDetails = async (course: any) => {
        setSelectedCourse(course)
        setIsDetailOpen(true)
        setDetailsLoading(true)
        try {
            const data = await examOfficerAPI.getCourseResultsDetail(course.id)
            setCourseDetails(data)
        } catch (error) {
            toast.error("Failed to load result details")
        } finally {
            setDetailsLoading(false)
        }
    }

    const handleVerify = async () => {
        if (!selectedCourse) return
        try {
            const hasAnomalies = courseDetails?.anomalies?.length > 0
            const response = await examOfficerAPI.verifyCourseResults(selectedCourse.id, hasAnomalies)

            if (response.has_anomalies && !hasAnomalies) {
                toast.warning("New anomalies detected during verification. Please review.")
                // In a real app, we might re-fetch details here to show the new anomalies
            } else {
                toast.success("Results verified and published successfully!")
                setIsDetailOpen(false)
                fetchPendingCourses()
            }
        } catch (error: any) {
            toast.error("Verification failed")
        }
    }

    return (
        <DashboardLayout title="Result Processing" role="exam-officer">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Result Compilation</h1>
                        <p className="text-slate-500">Review submitted scores, check for anomalies, and publish results.</p>
                    </div>
                </div>

                <Card className="border-slate-200 shadow-md shadow-slate-200/50">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg text-slate-800">Pending Verification</CardTitle>
                                <CardDescription>Courses submitted by lecturers awaiting your approval.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                                <Loader2 className="animate-spin h-8 w-8 mb-2 text-teal-600" />
                                <p>Loading pending results...</p>
                            </div>
                        ) : courses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-16 text-slate-500">
                                <CheckCircle className="h-12 w-12 mb-3 text-emerald-200" />
                                <p className="text-lg font-medium">All caught up!</p>
                                <p className="text-sm">No pending results waiting for verification.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow>
                                        <TableHead className="pl-6">Course Details</TableHead>
                                        <TableHead>Lecturer</TableHead>
                                        <TableHead className="text-center">Enrollment</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right pr-6">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {courses.map((course) => (
                                        <TableRow key={course.id} className="hover:bg-slate-50/50 group transition-colors">
                                            <TableCell className="pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 font-bold text-xs border border-teal-100">
                                                        {course.code.split(' ')[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-800">{course.code}</div>
                                                        <div className="text-xs text-slate-500 max-w-[200px] truncate">{course.title}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <User className="h-3 w-3 text-slate-400" />
                                                    {course.lecturer}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                                    {course.enrolled_students} Students
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-medium text-slate-700">{course.completion_percentage}% Graded</span>
                                                        <div className="h-1.5 w-24 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                            <div
                                                                className="h-full bg-teal-500 rounded-full"
                                                                style={{ width: `${course.completion_percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    {course.has_anomalies && (
                                                        <div title="Potential Anomalies Detected" className="cursor-help">
                                                            <AlertOctagon className="h-4 w-4 text-orange-500 animate-pulse" />
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Button size="sm" className="bg-white border-slate-200 text-slate-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-all shadow-sm" variant="outline" onClick={() => openCourseDetails(course)}>
                                                    <Eye className="mr-2 h-3 w-3" /> Review
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Detail Dialog */}
                <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                    <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden gap-0">
                        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                                    <BookOpen className="h-5 w-5 text-teal-600" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl text-slate-800">Result Review: {selectedCourse?.code}</DialogTitle>
                                    <DialogDescription className="mt-1">
                                        Verify scores before publishing to student portals.
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="flex-1 overflow-hidden relative bg-slate-50/30">
                            {detailsLoading ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                    <Loader2 className="animate-spin h-10 w-10 mb-2 text-teal-600" />
                                    <p>Analyzing results...</p>
                                </div>
                            ) : courseDetails ? (
                                <ScrollArea className="h-full">
                                    <div className="p-6 space-y-6">

                                        {/* Statistics Cards */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <Card className="bg-white border-emerald-100 shadow-sm">
                                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                                    <div className="p-2 bg-emerald-50 rounded-full mb-2">
                                                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                                                    </div>
                                                    <div className="text-2xl font-bold text-slate-800">{courseDetails.statistics.pass_rate}%</div>
                                                    <div className="text-xs text-slate-500 font-medium">Pass Rate</div>
                                                </CardContent>
                                            </Card>
                                            <Card className="bg-white border-blue-100 shadow-sm">
                                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                                    <div className="p-2 bg-blue-50 rounded-full mb-2">
                                                        <BarChart3 className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <div className="text-2xl font-bold text-slate-800">{courseDetails.statistics.average_score}</div>
                                                    <div className="text-xs text-slate-500 font-medium">Average Score</div>
                                                </CardContent>
                                            </Card>
                                            <Card className="bg-white border-purple-100 shadow-sm">
                                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                                    <div className="p-2 bg-purple-50 rounded-full mb-2">
                                                        <GraduationCap className="h-4 w-4 text-purple-600" />
                                                    </div>
                                                    <div className="text-2xl font-bold text-slate-800">{courseDetails.statistics.highest_score}</div>
                                                    <div className="text-xs text-slate-500 font-medium">Highest Score</div>
                                                </CardContent>
                                            </Card>
                                            <Card className="bg-white border-slate-200 shadow-sm">
                                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                                    <div className="p-2 bg-slate-100 rounded-full mb-2">
                                                        <User className="h-4 w-4 text-slate-600" />
                                                    </div>
                                                    <div className="text-2xl font-bold text-slate-800">{courseDetails.grades.length}</div>
                                                    <div className="text-xs text-slate-500 font-medium">Total Students</div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Anomalies Warning - Prominent */}
                                        {courseDetails.anomalies && courseDetails.anomalies.length > 0 && (
                                            <div className="bg-orange-50 border-l-4 border-l-orange-500 border border-orange-200 rounded-r-md p-4 shadow-sm animate-in zoom-in-95 duration-300">
                                                <div className="flex items-start gap-3">
                                                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                                                    <div className="space-y-2 w-full">
                                                        <div>
                                                            <h4 className="font-bold text-orange-900 text-sm">Potential Anomalies Detected</h4>
                                                            <p className="text-xs text-orange-800 mt-1">
                                                                The system flagged the following issues. Approving this will override these warnings.
                                                            </p>
                                                        </div>
                                                        <div className="bg-white/60 rounded border border-orange-200/50 p-2 max-h-32 overflow-y-auto text-xs text-orange-900 font-mono">
                                                            <ul className="list-disc pl-4 space-y-1">
                                                                {courseDetails.anomalies.map((a: any, i: number) => (
                                                                    <li key={i}>
                                                                        <span className="font-bold">{a.student}</span>: {a.reason} (Score: {a.score})
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Grade Table */}
                                        <Card className="border-slate-200 shadow-sm overflow-hidden">
                                            <Table>
                                                <TableHeader className="bg-slate-50">
                                                    <TableRow>
                                                        <TableHead className="w-[180px]">Matric No</TableHead>
                                                        <TableHead className="text-center">Score</TableHead>
                                                        <TableHead className="text-center">Grade</TableHead>
                                                        <TableHead className="text-center">Points</TableHead>
                                                        <TableHead>Remarks</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {courseDetails.grades.map((grade: any) => (
                                                        <TableRow key={grade.id} className={grade.needs_review ? "bg-orange-50/50" : "hover:bg-slate-50/50"}>
                                                            <TableCell className="font-mono text-xs font-medium text-slate-600">
                                                                {grade.student.matric_number}
                                                            </TableCell>
                                                            <TableCell className="text-center font-bold text-slate-800">
                                                                {grade.score}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge variant={grade.grade_letter === 'F' ? 'destructive' : 'outline'} className={grade.grade_letter === 'F' ? '' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}>
                                                                    {grade.grade_letter}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-center text-slate-500">
                                                                {grade.grade_points}
                                                            </TableCell>
                                                            <TableCell className="text-xs text-slate-500">
                                                                {grade.needs_review ? (
                                                                    <span className="flex items-center text-orange-600 font-medium">
                                                                        <AlertOctagon className="w-3 h-3 mr-1" /> Review Needed
                                                                    </span>
                                                                ) : "Satisfactory"}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </Card>
                                    </div>
                                </ScrollArea>
                            ) : null}
                        </div>

                        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
                            <div className="flex w-full justify-between items-center">
                                <Button variant="ghost" onClick={() => setIsDetailOpen(false)} className="text-slate-500">
                                    Cancel
                                </Button>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/academics/exam-officer/results/${selectedCourse?.id}/generate_master_sheet/`, '_blank')}
                                        variant="outline"
                                        className="border-slate-200 text-slate-700"
                                    >
                                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Master Sheet
                                    </Button>
                                    <Button
                                        onClick={handleVerify}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200"
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" /> Verify & Publish Results
                                    </Button>
                                </div>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    )
}