"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Printer, FileText, Download } from "lucide-react"
import { transcriptAPI } from "@/lib/api"
import { toast } from "sonner"

export default function StudentTranscriptPage() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await transcriptAPI.getMyTranscript()
                setData(response)
            } catch (error) {
                console.error("Failed to load transcript", error)
                toast.error("Failed to load transcript")
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const handlePrint = () => {
        window.print()
    }

    if (loading) {
        return (
            <DashboardLayout title="Academic Transcript" role="student">
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
                </div>
            </DashboardLayout>
        )
    }

    // Check for student_info instead of student based on backend structure
    if (!data || !data.student_info) {
        return (
            <DashboardLayout title="Academic Transcript" role="student">
                <div className="flex h-[60vh] flex-col items-center justify-center text-muted-foreground">
                    <FileText className="h-16 w-16 mb-4 opacity-20" />
                    <p>No transcript data available yet.</p>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout title="Academic Transcript" role="student">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Actions Header */}
                <div className="flex justify-end gap-3 print:hidden">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" /> Print Transcript
                    </Button>
                </div>

                {/* Transcript Document */}
                <Card className="print:shadow-none print:border-none">
                    <CardContent className="p-10 space-y-8 min-h-[800px] print:p-0">

                        {/* Header */}
                        <div className="text-center border-b pb-6">
                            <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">Official Transcript</h1>
                            <p className="text-slate-500 text-sm mt-1">College Management System</p>
                        </div>

                        {/* Student Details */}
                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                            <div>
                                <p className="text-slate-500">Student Name</p>
                                <p className="font-semibold text-base">{data.student_info.full_name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-500">Matric Number</p>
                                <p className="font-mono font-semibold text-base">{data.student_info.matric_number}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Department</p>
                                <p className="font-semibold">{data.student_info.department}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-500">Current Level</p>
                                <p className="font-semibold">{data.student_info.level}</p>
                            </div>
                        </div>

                        {/* Academic Record */}
                        <div className="space-y-8">
                            {/* Mapped from academic_history instead of transcript */}
                            {data.academic_history.map((session: any, index: number) => (
                                <div key={index}>
                                    <div className="flex justify-between items-end mb-2 border-b border-slate-100 pb-1">
                                        <h3 className="font-bold text-slate-800 uppercase text-sm">
                                            {session.session} | {session.semester} Semester
                                        </h3>
                                        <span className="text-xs text-slate-400 font-mono">
                                            {/* Using stats.gpa from backend structure */}
                                            GPA: {session.stats.gpa}
                                        </span>
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-xs text-slate-400 uppercase">
                                                <th className="font-medium py-1">Code</th>
                                                <th className="font-medium py-1 w-1/2">Course Title</th>
                                                <th className="font-medium py-1 text-center">Unit</th>
                                                <th className="font-medium py-1 text-center">Grade</th>
                                                <th className="font-medium py-1 text-right">Points</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {session.courses.map((course: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td className="py-2 font-mono text-xs">{course.code}</td>
                                                    <td className="py-2">{course.title}</td>
                                                    {/* mapped to credit_unit from backend */}
                                                    <td className="py-2 text-center text-slate-500">{course.credit_unit}</td>
                                                    <td className="py-2 text-center font-bold">{course.grade}</td>
                                                    <td className="py-2 text-right text-slate-500">{course.points}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>

                        {/* Footer Summary */}
                        <div className="border-t pt-6 mt-auto">
                            <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg">
                                <div className="text-center">
                                    <p className="text-xs text-slate-500 uppercase">Total Units</p>
                                    {/* Mapped to total_credits_completed */}
                                    <p className="text-xl font-bold text-slate-800">{data.summary.total_credits_completed}</p>
                                </div>
                                <div className="text-center border-l border-slate-200">
                                    <p className="text-xs text-slate-500 uppercase">CGPA</p>
                                    {/* Mapped to cumulative_gpa */}
                                    <p className="text-xl font-bold text-blue-600">{data.summary.cumulative_gpa}</p>
                                </div>
                                <div className="text-center border-l border-slate-200">
                                    <p className="text-xs text-slate-500 uppercase">Class</p>
                                    {/* Mapped to degree_class */}
                                    <p className="text-sm font-bold text-slate-800 mt-1">{data.summary.degree_class}</p>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-between items-end">
                                <div className="text-xs text-slate-400">
                                    <p>Generated on: {new Date().toLocaleString()}</p>
                                    <p>This is an unofficial transcript.</p>
                                </div>
                                <div className="text-center w-32">
                                    <div className="border-b border-slate-300 mb-2"></div>
                                    <p className="text-xs font-bold text-slate-600 uppercase">Registrar</p>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}