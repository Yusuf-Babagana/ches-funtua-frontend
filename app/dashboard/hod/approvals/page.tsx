"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
    Loader2,
    CheckCircle,
    XCircle,
    FileText,
    User,
    ChevronRight,
    AlertCircle,
    BookOpen,
    GraduationCap,
    Clock
} from "lucide-react"
import { workflowAPI } from "@/lib/api"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

export default function HODApprovalsPage() {
    const [loading, setLoading] = useState(true)
    const [courses, setCourses] = useState<any[]>([])

    // Modal State
    const [selectedCourse, setSelectedCourse] = useState<any>(null)
    const [detailsLoading, setDetailsLoading] = useState(false)
    const [courseDetails, setCourseDetails] = useState<any>(null)
    const [rejectionReason, setRejectionReason] = useState("")
    const [actionLoading, setActionLoading] = useState(false)

    // Fetch Pending Reviews
    const fetchPending = async () => {
        try {
            setLoading(true)
            const data = await workflowAPI.getPendingHODReviews()
            setCourses(Array.isArray(data) ? data : [])
        } catch (error) {
            toast.error("Failed to load pending reviews")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPending()
    }, [])

    // Open Review Modal
    const openReview = async (course: any) => {
        setSelectedCourse(course)
        setDetailsLoading(true)
        setCourseDetails(null) // Reset previous details
        try {
            const details = await workflowAPI.getCourseDetailsForHOD(course.course_id)
            setCourseDetails(details)
        } catch (error) {
            toast.error("Failed to load details")
            setSelectedCourse(null)
        } finally {
            setDetailsLoading(false)
        }
    }

    // Handle Approve
    const handleApprove = async () => {
        setActionLoading(true)
        try {
            await workflowAPI.approveResultHOD(selectedCourse.course_id)
            toast.success("Results approved and sent to Exam Officer")
            setSelectedCourse(null)
            fetchPending() // Refresh list
        } catch (error) {
            toast.error("Approval failed")
        } finally {
            setActionLoading(false)
        }
    }

    // Handle Reject
    const handleReject = async () => {
        if (!rejectionReason) return toast.warning("Please provide a reason for rejection")
        setActionLoading(true)
        try {
            await workflowAPI.rejectResultHOD(selectedCourse.course_id, rejectionReason)
            toast.success("Results returned to Lecturer")
            setSelectedCourse(null)
            setRejectionReason("")
            fetchPending()
        } catch (error) {
            toast.error("Rejection failed")
        } finally {
            setActionLoading(false)
        }
    }

    if (loading) return (
        <DashboardLayout title="Result Approvals" role="hod">
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
                <p className="text-slate-500 text-sm animate-pulse">Checking for pending results...</p>
            </div>
        </DashboardLayout>
    )

    return (
        <DashboardLayout title="Result Approvals" role="hod">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Pending Approvals</h1>
                        <p className="text-slate-500">Review and approve course results submitted by lecturers.</p>
                    </div>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200 px-3 py-1 text-sm">
                        {courses.length} Pending Review
                    </Badge>
                </div>

                {/* Course Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {courses.length === 0 ? (
                        <Card className="col-span-full border-dashed border-2 bg-slate-50/50 shadow-none">
                            <CardContent className="py-16 text-center text-slate-500 flex flex-col items-center">
                                <div className="h-16 w-16 bg-white rounded-full border-2 border-slate-200 flex items-center justify-center mb-4">
                                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-800">All Caught Up!</h3>
                                <p className="max-w-sm mt-1">There are no pending results requiring your approval at this time.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        courses.map((course, index) => (
                            <Card key={`${course.course_id}-${index}`} className="group border-slate-200 shadow-sm hover:shadow-md hover:border-teal-200 transition-all cursor-pointer bg-white overflow-hidden relative">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400 group-hover:bg-teal-500 transition-colors" />
                                <CardHeader className="pb-3 pl-6">
                                    <div className="flex justify-between items-start">
                                        <Badge variant="outline" className="bg-slate-50 text-slate-600 font-mono border-slate-200">
                                            {course.course_code}
                                        </Badge>
                                        <Badge className="bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-100 font-normal text-xs">
                                            Awaiting Action
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-lg font-bold text-slate-800 mt-2 line-clamp-1">
                                        {course.course_title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pl-6 pb-4 space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <User className="h-4 w-4 text-slate-400" />
                                        <span className="font-medium">{course.lecturer}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                            <FileText className="h-3 w-3 text-teal-600" />
                                            <span>{course.pending_count} Grades</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                            <Clock className="h-3 w-3 text-orange-600" />
                                            <span>Just now</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pl-6 pt-0 pb-5">
                                    <Button
                                        onClick={() => openReview(course)}
                                        className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 shadow-sm"
                                    >
                                        Review Results <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </div>

                {/* Review Dialog */}
                <Dialog open={!!selectedCourse} onOpenChange={(open) => !open && setSelectedCourse(null)}>
                    <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0 bg-white shadow-2xl border-slate-200">

                        {/* Modal Header */}
                        <DialogHeader className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                                    <BookOpen className="h-6 w-6 text-teal-600" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl text-slate-800 flex items-center gap-2">
                                        {selectedCourse?.course_code}
                                        <span className="text-slate-300 font-light">|</span>
                                        <span className="font-normal text-slate-600 text-lg">{selectedCourse?.course_title}</span>
                                    </DialogTitle>
                                    <DialogDescription className="mt-1 flex items-center gap-2">
                                        Submitted by <span className="font-medium text-slate-700">{selectedCourse?.lecturer}</span>
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-hidden relative">
                            {detailsLoading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                                    <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
                                    <p className="mt-2 text-sm text-slate-500 font-medium">Retrieving grade data...</p>
                                </div>
                            ) : (
                                <ScrollArea className="h-full">
                                    <div className="p-6 space-y-6">

                                        {/* Summary Stats Strip */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                                                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Students</div>
                                                <div className="text-2xl font-bold text-slate-800 mt-1">{courseDetails?.grades?.length || 0}</div>
                                            </div>
                                            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-center">
                                                <div className="text-xs text-emerald-600 uppercase tracking-wider font-semibold">Passed</div>
                                                <div className="text-2xl font-bold text-emerald-700 mt-1">
                                                    {courseDetails?.grades?.filter((g: any) => g.grade !== 'F').length || 0}
                                                </div>
                                            </div>
                                            <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-center">
                                                <div className="text-xs text-red-600 uppercase tracking-wider font-semibold">Failed</div>
                                                <div className="text-2xl font-bold text-red-700 mt-1">
                                                    {courseDetails?.grades?.filter((g: any) => g.grade === 'F').length || 0}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Grade Table */}
                                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-4 py-3 font-semibold text-slate-600">Student Name</th>
                                                        <th className="px-4 py-3 font-semibold text-slate-600 font-mono">Matric No.</th>
                                                        <th className="px-4 py-3 font-semibold text-slate-600 text-center">CA</th>
                                                        <th className="px-4 py-3 font-semibold text-slate-600 text-center">Exam</th>
                                                        <th className="px-4 py-3 font-semibold text-slate-600 text-center">Total</th>
                                                        <th className="px-4 py-3 font-semibold text-slate-600 text-center">Grade</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {courseDetails?.grades?.map((g: any, i: number) => (
                                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-4 py-2.5 font-medium text-slate-700">{g.student_name}</td>
                                                            <td className="px-4 py-2.5 font-mono text-slate-500 text-xs">{g.matric}</td>
                                                            <td className="px-4 py-2.5 text-center text-slate-600">{g.ca_score || '-'}</td>
                                                            <td className="px-4 py-2.5 text-center text-slate-600">{g.exam_score || '-'}</td>
                                                            <td className="px-4 py-2.5 text-center font-bold text-slate-800">{g.total}</td>
                                                            <td className="px-4 py-2.5 text-center">
                                                                <Badge variant={g.grade === 'F' ? "destructive" : "outline"} className={g.grade === 'F' ? "" : "bg-emerald-50 text-emerald-700 border-emerald-200"}>
                                                                    {g.grade}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <Separator />

                                        {/* Rejection Section */}
                                        <div className="space-y-3 bg-red-50/50 p-4 rounded-lg border border-red-100">
                                            <div className="flex items-center gap-2 text-red-800">
                                                <AlertCircle className="h-4 w-4" />
                                                <h4 className="text-sm font-semibold">Feedback / Rejection Reason</h4>
                                            </div>
                                            <Textarea
                                                placeholder="If rejecting, please provide specific details on what needs to be corrected (e.g., 'Missing CA scores for 3 students', 'Calculation error in totals')..."
                                                className="min-h-[80px] bg-white border-red-200 focus:ring-red-500 focus:border-red-500 placeholder:text-slate-400"
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </ScrollArea>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-row justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedCourse(null)}
                                disabled={actionLoading}
                                className="border-slate-300 text-slate-600 hover:bg-white"
                            >
                                Cancel
                            </Button>

                            <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={actionLoading}
                                className="bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shadow-sm"
                            >
                                {actionLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
                                Return to Lecturer
                            </Button>

                            <Button
                                onClick={handleApprove}
                                disabled={actionLoading}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200"
                            >
                                {actionLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                Approve & Forward
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    )
}