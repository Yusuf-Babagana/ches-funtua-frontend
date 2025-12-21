"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, FileText, Printer, Loader2, Download } from "lucide-react"
import { userAPI, transcriptAPI } from "@/lib/api"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function RegistrarTranscriptPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [searching, setSearching] = useState(false)
    const [students, setStudents] = useState<any[]>([])

    // Selected Student State
    const [selectedStudent, setSelectedStudent] = useState<any>(null)
    const [loadingTranscript, setLoadingTranscript] = useState(false)
    const [transcriptData, setTranscriptData] = useState<any>(null)

    const handleSearch = async () => {
        if (!searchQuery) return
        setSearching(true)
        setSelectedStudent(null)
        setTranscriptData(null)

        try {
            // Search for users with role='student'
            const response = await userAPI.getUsers({ search: searchQuery, role: 'student' })
            if (response && Array.isArray(response)) {
                // Filter to ensure they have a student profile
                const validStudents = response.filter((u: any) => u.student_profile)
                setStudents(validStudents)
            } else if (response && response.results) {
                setStudents(response.results.filter((u: any) => u.student_profile))
            } else {
                setStudents([])
            }
        } catch (error) {
            toast.error("Search failed")
        } finally {
            setSearching(false)
        }
    }

    const generateTranscript = async (student: any) => {
        setSelectedStudent(student)
        setLoadingTranscript(true)
        try {
            // We need the Student ID (Profile ID), not User ID
            const studentProfileId = student.student_profile?.id

            if (!studentProfileId) {
                toast.error("Incomplete student profile")
                return
            }

            const data = await transcriptAPI.generateTranscript(studentProfileId)
            setTranscriptData(data)
        } catch (error) {
            toast.error("Failed to generate transcript")
        } finally {
            setLoadingTranscript(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <DashboardLayout title="Transcript Generation" role="registrar">
            <div className="space-y-6 max-w-6xl mx-auto">

                {/* Search Section */}
                <Card className="print:hidden">
                    <CardHeader>
                        <CardTitle>Find Student</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Enter Name, Email, or Matric Number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Button onClick={handleSearch} disabled={searching}>
                                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                Search
                            </Button>
                        </div>

                        {/* Search Results */}
                        {students.length > 0 && !selectedStudent && (
                            <div className="border rounded-md divide-y">
                                {students.map((student) => (
                                    <div key={student.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{student.first_name[0]}{student.last_name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm">{student.first_name} {student.last_name}</p>
                                                <p className="text-xs text-muted-foreground">{student.student_profile?.matric_number}</p>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={() => generateTranscript(student)}>
                                            Generate
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Loading State */}
                {loadingTranscript && (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                )}

                {/* Transcript Display */}
                {transcriptData && (
                    <div className="space-y-4">
                        <div className="flex justify-end gap-2 print:hidden">
                            <Button onClick={() => setSelectedStudent(null)} variant="outline">Close</Button>
                            <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Official Copy</Button>
                        </div>

                        <Card className="print:shadow-none print:border-none border-2 border-slate-200">
                            <CardContent className="p-12 space-y-8 min-h-[1000px] print:p-0">
                                {/* Header */}
                                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6">
                                    <div className="text-center w-full">
                                        <h1 className="text-3xl font-black uppercase tracking-widest text-slate-900">Official Transcript</h1>
                                        <p className="text-slate-600 font-serif text-lg mt-1">College of Health Technology</p>
                                    </div>
                                </div>

                                {/* Student Details */}
                                <div className="grid grid-cols-2 gap-y-2 text-sm bg-slate-50 p-6 rounded-lg print:bg-transparent print:p-0">
                                    <div className="grid grid-cols-3 gap-4">
                                        <span className="text-slate-500 font-medium">Name:</span>
                                        <span className="col-span-2 font-bold uppercase">{transcriptData.student.name}</span>

                                        <span className="text-slate-500 font-medium">Matric No:</span>
                                        <span className="col-span-2 font-mono font-bold">{transcriptData.student.matric_number}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <span className="text-slate-500 font-medium">Department:</span>
                                        <span className="col-span-2 font-bold uppercase">{transcriptData.student.department}</span>

                                        <span className="text-slate-500 font-medium">Graduation:</span>
                                        <span className="col-span-2">-</span>
                                    </div>
                                </div>

                                {/* Academic Record */}
                                <div className="space-y-8">
                                    {transcriptData.transcript.map((session: any, index: number) => (
                                        <div key={index} className="break-inside-avoid">
                                            <div className="flex justify-between items-center bg-slate-100 p-2 px-4 rounded mb-2 print:bg-transparent print:border-b print:border-slate-400 print:rounded-none">
                                                <h3 className="font-bold text-slate-900 text-sm uppercase">
                                                    {session.session} / {session.semester} Semester
                                                </h3>
                                            </div>
                                            <table className="w-full text-sm border-collapse">
                                                <thead>
                                                    <tr className="text-left text-xs uppercase border-b-2 border-slate-800">
                                                        <th className="font-bold py-1 w-24">Code</th>
                                                        <th className="font-bold py-1">Course Title</th>
                                                        <th className="font-bold py-1 w-16 text-center">Unit</th>
                                                        <th className="font-bold py-1 w-16 text-center">Grade</th>
                                                        <th className="font-bold py-1 w-16 text-right">Points</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {session.courses.map((course: any, idx: number) => (
                                                        <tr key={idx}>
                                                            <td className="py-1.5 font-mono text-xs">{course.code}</td>
                                                            <td className="py-1.5">{course.title}</td>
                                                            <td className="py-1.5 text-center">{course.unit}</td>
                                                            <td className="py-1.5 text-center font-bold">{course.grade}</td>
                                                            <td className="py-1.5 text-right">{course.points}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <div className="flex justify-end gap-6 text-xs font-bold mt-2 pt-2 border-t border-slate-300">
                                                <span>TCP: {session.semester_stats.total_points}</span>
                                                <span>TNU: {session.semester_stats.total_units}</span>
                                                <span>GPA: {session.semester_stats.gpa}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer Summary */}
                                <div className="mt-auto pt-12 break-inside-avoid">
                                    <div className="border-2 border-slate-800 p-4 flex justify-around items-center">
                                        <div className="text-center">
                                            <p className="text-xs uppercase font-bold text-slate-500">Cumulative GPA</p>
                                            <p className="text-3xl font-black">{transcriptData.summary.cgpa}</p>
                                        </div>
                                        <div className="h-10 w-px bg-slate-300"></div>
                                        <div className="text-center">
                                            <p className="text-xs uppercase font-bold text-slate-500">Class of Degree</p>
                                            <p className="text-xl font-bold uppercase">{transcriptData.summary.class_of_degree}</p>
                                        </div>
                                    </div>

                                    <div className="mt-16 flex justify-between items-end">
                                        <div className="text-center w-48">
                                            <div className="h-24 w-24 mx-auto border-4 border-double border-slate-300 rounded-full flex items-center justify-center mb-2">
                                                <span className="text-[10px] text-slate-300 font-bold uppercase -rotate-12">Official Seal</span>
                                            </div>
                                        </div>
                                        <div className="text-center w-64">
                                            <div className="border-b border-slate-800 mb-2"></div>
                                            <p className="text-xs font-bold uppercase tracking-wider">Registrar Signature</p>
                                            <p className="text-[10px] text-slate-500">{new Date().toDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}