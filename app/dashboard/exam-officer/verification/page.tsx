"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, Search, FileCheck } from "lucide-react"
import { workflowAPI } from "@/lib/api"
import { toast } from "sonner"

export default function VerificationPage() {
    const [loading, setLoading] = useState(true)
    const [courses, setCourses] = useState<any[]>([])
    const [processingId, setProcessingId] = useState<number | null>(null)

    const fetchData = async () => {
        try {
            setLoading(true)
            const data = await workflowAPI.getPendingVerification()
            setCourses(data || [])
        } catch (e) { toast.error("Failed to load list") }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchData() }, [])

    const handleVerify = async (id: number) => {
        if (!confirm("Confirm verification? This will forward results to the Registrar.")) return
        setProcessingId(id)
        try {
            await workflowAPI.verifyResult(id)
            toast.success("Verified successfully")
            fetchData()
        } catch (e) { toast.error("Action failed") }
        finally { setProcessingId(null) }
    }

    if (loading) return <div className="h-screen flex justify-center items-center"><Loader2 className="animate-spin" /></div>

    return (
        <DashboardLayout title="Result Verification" role="exam_officer"> {/* Ensure role matches your auth context */}
            <div className="space-y-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FileCheck className="text-blue-600" /> Pending Verification
                </h1>

                <div className="grid gap-4">
                    {courses.length === 0 ? (
                        <p className="text-center text-gray-500 py-10">No results waiting for verification.</p>
                    ) : (
                        courses.map(course => (
                            <Card key={course.course_id}>
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg">{course.course_code}</h3>
                                        <p className="text-gray-500">{course.course_title}</p>
                                        <p className="text-xs text-green-600 mt-1">Approved by HOD: {course.hod_name || 'HOD'}</p>
                                    </div>
                                    <Button
                                        onClick={() => handleVerify(course.course_id)}
                                        disabled={processingId === course.course_id}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {processingId === course.course_id ? <Loader2 className="animate-spin" /> : "Verify"}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}