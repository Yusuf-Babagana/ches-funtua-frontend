"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Printer, ArrowLeft, GraduationCap } from "lucide-react"
import { registrationAPI, authAPI, academicsAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"

export default function PrintSchedule() {
    const { user } = useAuth()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [student, setStudent] = useState<any>(null)
    const [myCourses, setMyCourses] = useState<any[]>([])
    const [academicData, setAcademicData] = useState<any>(null)

    useEffect(() => {
        const initData = async () => {
            try {
                // 1. Get Profile
                const userRes = await authAPI.getCurrentUser()
                if (userRes) {
                    let deptName = "Unassigned"
                    let facultyName = "Unassigned"
                    if (userRes.profile?.department && typeof userRes.profile.department === 'object') {
                        deptName = userRes.profile.department.name
                        facultyName = userRes.profile.department.faculty?.name || facultyName
                    } else if (userRes.profile?.department) {
                        deptName = `Dept ID: ${userRes.profile.department}`
                    }

                    setStudent({
                        name: userRes.user.full_name || `${userRes.user.first_name} ${userRes.user.last_name}`,
                        matric: userRes.profile?.matric_number,
                        level: userRes.profile?.level,
                        dept: deptName,
                        faculty: facultyName
                    })
                }

                // 2. Get Courses
                const scheduleRes = await registrationAPI.getCurrentRegistrations()
                if (Array.isArray(scheduleRes)) setMyCourses(scheduleRes)
                else if (scheduleRes && scheduleRes.results) setMyCourses(scheduleRes.results)
                else setMyCourses([])

                // 3. Get Academic Data (for session info if needed)
                const historyRes = await academicsAPI.getStudentHistory()
                setAcademicData(historyRes)

            } catch (e) {
                console.error("Failed to load print data", e)
            } finally {
                setLoading(false)
            }
        }

        initData()
    }, [])

    const handlePrint = () => {
        window.print()
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="h-10 w-10 animate-spin text-teal-600 mb-4" />
                <p className="text-gray-500 font-medium">Preparing document...</p>
            </div>
        )
    }

    const totalCredits = myCourses.reduce((sum, item) => sum + (item.course_credits || 0), 0)
    const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    const currentSession = sessionCookie() || "Current Session" // Simple fallback if not explicit from API

    return (
        <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">

            {/* Non-printable Action Bar */}
            <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center px-4 print:hidden">
                <Button variant="outline" onClick={() => router.back()} className="bg-white">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
                </Button>
                <Button onClick={handlePrint} className="bg-teal-600 hover:bg-teal-700 text-white">
                    <Printer className="h-4 w-4 mr-2" /> Print Document
                </Button>
            </div>

            {/* Printable Area */}
            <div className="max-w-4xl mx-auto bg-white p-12 shadow-md rounded-sm print:shadow-none print:p-0 print:max-w-none">

                {/* Header */}
                <div className="text-center pb-6 border-b-2 border-gray-900 mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 bg-teal-50 rounded-full flex items-center justify-center border-2 border-teal-600">
                            <GraduationCap className="h-8 w-8 text-teal-600" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold uppercase tracking-wider text-gray-900 mb-1">Funtua Institution</h1>
                    <h2 className="text-lg font-semibold text-gray-700 uppercase">Course Registration Form</h2>
                    <p className="text-sm text-gray-500 mt-2">Generated on {currentDate}</p>
                </div>

                {/* Student Information */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold uppercase text-gray-400 border-b border-gray-200 pb-2 mb-4 tracking-widest">Student Information</h3>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Full Name</p>
                            <p className="text-base font-bold text-gray-900">{student?.name || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Matriculation Number</p>
                            <p className="text-base font-bold text-gray-900 uppercase">{student?.matric || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Department</p>
                            <p className="text-base font-bold text-gray-900">{student?.dept || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Level</p>
                            <p className="text-base font-bold text-gray-900">{student?.level || "N/A"} Level</p>
                        </div>
                        {/* <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Faculty</p>
              <p className="text-base font-bold text-gray-900">{student?.faculty || "N/A"}</p>
            </div> */}
                    </div>
                </div>

                {/* Registered Courses Table */}
                <div className="mb-12">
                    <h3 className="text-sm font-bold uppercase text-gray-400 border-b border-gray-200 pb-2 mb-4 tracking-widest">Registered Courses</h3>

                    {myCourses.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                            No courses registered for this session.
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="py-3 px-4 border border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-700 w-16">S/N</th>
                                    <th className="py-3 px-4 border border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-700 w-32">Course Code</th>
                                    <th className="py-3 px-4 border border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-700">Course Title</th>
                                    <th className="py-3 px-4 border border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-700 w-24 text-center">Units</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myCourses.map((course, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="py-3 px-4 border border-gray-200 text-sm text-gray-600 text-center">{index + 1}</td>
                                        <td className="py-3 px-4 border border-gray-200 text-sm font-bold text-gray-900">{course.course_code}</td>
                                        <td className="py-3 px-4 border border-gray-200 text-sm text-gray-800">{course.course_title}</td>
                                        <td className="py-3 px-4 border border-gray-200 text-sm font-bold text-gray-900 text-center">{course.course_credits}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50 font-bold">
                                    <td colSpan={3} className="py-3 px-4 border border-gray-200 text-right text-gray-700 uppercase text-xs tracking-wider">Total Units Registered:</td>
                                    <td className="py-3 px-4 border border-gray-200 text-center text-teal-700">{totalCredits}</td>
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>

                {/* Signatures */}
                <div className="mt-24 grid grid-cols-2 gap-16">
                    <div className="text-center">
                        <div className="border-b border-gray-400 w-full mb-2 h-12"></div>
                        <p className="text-xs uppercase font-bold text-gray-600">Student's Signature & Date</p>
                    </div>
                    <div className="text-center">
                        <div className="border-b border-gray-400 w-full mb-2 h-12"></div>
                        <p className="text-xs uppercase font-bold text-gray-600">HOD's Signature / Stamp</p>
                    </div>
                </div>

                {/* Footer info */}
                <div className="mt-16 text-center text-[10px] text-gray-400 border-t border-gray-200 pt-4">
                    Document securely generated by Funtua Institution Portal. Valid only with official stamp.
                </div>
            </div>

        </div>
    )
}

function sessionCookie() {
    return "2024/2025" // Mock for now, alternatively derive from academic history
}
