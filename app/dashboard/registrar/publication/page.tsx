"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Globe, Send } from "lucide-react"
import { workflowAPI } from "@/lib/api"
import { toast } from "sonner"

export default function PublicationPage() {
    const [loading, setLoading] = useState(true)
    const [courses, setCourses] = useState<any[]>([])
    const [processingId, setProcessingId] = useState<number | null>(null)

    const fetchData = async () => {
        try {
            setLoading(true)
            const data = await workflowAPI.getPendingPublication()
            setCourses(data || [])
        } catch (e) { toast.error("Failed to load list") }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchData() }, [])

    const handlePublish = async (id: number) => {
        if (!confirm("Are you sure? This will make results visible to all students.")) return
        setProcessingId(id)
        try {
            await workflowAPI.publishResult(id)
            toast.success("Results Published Successfully!")
            fetchData()
        } catch (e) { toast.error("Publication failed") }
        finally { setProcessingId(null) }
    }

    if (loading) return <div className="h-screen flex justify-center items-center"><Loader2 className="animate-spin" /></div>

    return (
        <DashboardLayout title="Result Publication" role="registrar">
            <div className="space-y-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Globe className="text-green-600" /> Pending Publication
                </h1>

                <div className="grid gap-4">
                    {courses.length === 0 ? (
                        <p className="text-center text-gray-500 py-10">No verified results waiting for publication.</p>
                    ) : (
                        courses.map(course => (
                            <Card key={course.course_id} className="border-l-4 border-l-green-500">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg">{course.course_code}</h3>
                                        <p className="text-gray-500">{course.course_title}</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Verified by Exam Officer</span>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => handlePublish(course.course_id)}
                                        disabled={processingId === course.course_id}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        {processingId === course.course_id ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                                        Publish to Portal
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