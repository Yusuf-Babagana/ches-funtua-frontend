"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, ArrowLeft, Calculator } from "lucide-react"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"

export default function GradebookPage() {
    const params = useParams()
    const router = useRouter()
    const courseId = params.id

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [courseData, setCourseData] = useState<any>(null)

    // Students state with local score inputs
    const [students, setStudents] = useState<any[]>([])

    useEffect(() => {
        fetchStudents()
    }, [])

    const fetchStudents = async () => {
        try {
            // Call the specific endpoint we made in Step 1
            const response = await apiClient.get(`/academics/lecturer/courses/${courseId}/students/`)

            if (response.data) {
                setCourseData({
                    title: response.data.course_title,
                    code: response.data.course_code
                })

                // Initialize student rows
                const mapped = response.data.students.map((s: any) => ({
                    ...s,
                    // If backend sends a total score, we put it in Exam for now, 
                    // or leave blank if 0. You can refine this later to split fields.
                    ca: '',
                    exam: s.ca_score || '', // Using the score from DB
                    total: s.ca_score || 0
                }))
                setStudents(mapped)
            }
        } catch (error) {
            toast.error("Failed to load student list")
        } finally {
            setLoading(false)
        }
    }

    // Calculation Logic
    const handleScoreChange = (id: number, field: 'ca' | 'exam', value: string) => {
        // Allow empty or numbers
        if (value !== '' && isNaN(Number(value))) return

        setStudents(prev => prev.map(s => {
            if (s.student_id === id) {
                const newVal = value
                const otherVal = field === 'ca' ? s.exam : s.ca

                const caNum = field === 'ca' ? Number(newVal) : Number(s.ca)
                const examNum = field === 'exam' ? Number(newVal) : Number(s.exam)

                // Limits
                if (field === 'ca' && caNum > 40) return s // Max 40 for CA
                if (field === 'exam' && examNum > 60) return s // Max 60 for Exam

                return {
                    ...s,
                    [field]: newVal,
                    total: caNum + examNum
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

    const handleSave = async () => {
        setSubmitting(true)
        try {
            const payload = {
                course_id: courseId,
                grades: students.map(s => ({
                    student_id: s.student_id,
                    total_score: s.total
                }))
            }

            // Post to the bulk_save endpoint
            await apiClient.post('/academics/lecturer/grades/bulk_save/', payload)

            toast.success("Grades saved successfully")
            router.refresh() // Optional
        } catch (error) {
            toast.error("Failed to save grades")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>

    return (
        <DashboardLayout title="Gradebook" role="lecturer">
            <div className="space-y-6">

                {/* Header */}
                <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
                    <div>
                        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-1 pl-0 hover:bg-transparent">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <h1 className="text-2xl font-bold text-gray-900">{courseData?.code}</h1>
                        <p className="text-gray-500">{courseData?.title}</p>
                    </div>
                    <div className="text-right">
                        <Button onClick={handleSave} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Results
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3">Student Info</th>
                                        <th className="px-6 py-3 w-32 text-center">C.A (40)</th>
                                        <th className="px-6 py-3 w-32 text-center">Exam (60)</th>
                                        <th className="px-6 py-3 w-24 text-center">Total</th>
                                        <th className="px-6 py-3 w-24 text-center">Grade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {students.map((student) => (
                                        <tr key={student.student_id} className="bg-white hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                <div className="font-bold">{student.name}</div>
                                                <div className="text-xs text-gray-500 font-mono">{student.matric}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Input
                                                    type="number"
                                                    className="text-center"
                                                    value={student.ca}
                                                    onChange={(e) => handleScoreChange(student.student_id, 'ca', e.target.value)}
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <Input
                                                    type="number"
                                                    className="text-center"
                                                    value={student.exam}
                                                    onChange={(e) => handleScoreChange(student.student_id, 'exam', e.target.value)}
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-lg">
                                                {student.total}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge variant="outline" className={
                                                    student.total >= 50 ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                                                }>
                                                    {calculateGrade(student.total)}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                    {students.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center py-8 text-gray-500">
                                                No students have registered for this course yet.
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