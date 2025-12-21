"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Printer, AlertTriangle, QrCode, FileText, User } from "lucide-react"
import { academicsAPI } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ExamCardPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await academicsAPI.getExamCard()

                if (response.error) {
                    setError(response.error)
                } else {
                    setData(response)
                }
            } catch (error: any) {
                console.error("Failed to load exam card", error)
                // If it's a payment required error (402), specific message
                if (error?.status === 402) {
                    setError("Outstanding fees. Please clear your balance to view Exam Card.")
                } else {
                    setError("Failed to generate Exam Card. Ensure you are registered.")
                }
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
            <DashboardLayout title="Exam Card" role="student">
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
                </div>
            </DashboardLayout>
        )
    }

    if (error) {
        return (
            <DashboardLayout title="Exam Card" role="student">
                <div className="flex h-[60vh] flex-col items-center justify-center text-center max-w-md mx-auto">
                    <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                        <AlertTriangle className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h3>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <div className="flex gap-3">
                        <Button onClick={() => router.push('/dashboard/student/payments')} variant="outline">
                            View Finances
                        </Button>
                        <Button onClick={() => router.push('/dashboard/student')}>
                            Back to Dashboard
                        </Button>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout title="Exam Card" role="student">
            <div className="max-w-xl mx-auto space-y-6 pb-10">
                {/* Print styles for A5 sizing */}
                <style type="text/css" media="print">
                    {`
                        @page { size: A5 portrait; margin: 0; }
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    `}
                </style>

                <div className="flex justify-end gap-3 print:hidden">
                    <Button
                        variant="outline"
                        onClick={handlePrint}
                        className="bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white border-none shadow-md"
                    >
                        <Printer className="mr-2 h-4 w-4" /> Print Card
                    </Button>
                </div>

                {/* Exam Card Design - Configured for A5 Print */}
                <Card className="print:shadow-none print:border-2 border-slate-300 overflow-hidden bg-white shadow-2xl rounded-xl print:w-[148mm] print:mx-auto print:my-0 print:rounded-none">
                    <CardContent className="p-0">

                        {/* Header with Green Gradient */}
                        <div className="bg-gradient-to-r from-emerald-800 to-teal-600 text-white p-6 flex items-center justify-between print:bg-white print:text-black print:border-b-2 print:border-black">
                            <div className="flex items-center gap-4">
                                {/* Logo Placeholder */}
                                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-lg text-emerald-800 font-serif font-bold text-2xl border-4 border-emerald-100 print:border-black print:text-black">
                                    C
                                </div>
                                <div>
                                    <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight leading-tight">CHES Funtua</h1>
                                    <p className="text-emerald-100 text-xs md:text-sm font-medium tracking-wide mt-0.5 print:text-black">Health & Environmental Sciences</p>
                                    <div className="mt-2 inline-block bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider print:border print:border-black print:text-black">
                                        Examination Pass
                                    </div>
                                </div>
                            </div>
                            <div className="text-right hidden sm:block print:block">
                                <p className="text-xl font-black text-white/90 print:text-black">{data.semester.session}</p>
                                <p className="text-emerald-100 text-xs font-medium uppercase tracking-widest mt-0.5 print:text-black">{data.semester.name} Semester</p>
                            </div>
                        </div>

                        {/* Watermark Background Container */}
                        <div className="relative p-6 md:p-8">
                            {/* Watermark */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden">
                                <div className="transform -rotate-12 text-7xl font-black uppercase text-slate-900 whitespace-nowrap">
                                    Exam Pass
                                </div>
                            </div>

                            {/* Student Profile Section */}
                            <div className="relative z-10 flex flex-row gap-6 mb-6 border-b border-dashed border-slate-300 pb-6">
                                <div className="shrink-0 flex flex-col items-center">
                                    <Avatar className="h-28 w-28 rounded-lg border-4 border-white shadow-lg ring-1 ring-slate-200">
                                        <AvatarImage src={data.student.passport_url} alt={data.student.name} className="object-cover" />
                                        <AvatarFallback className="rounded-lg bg-slate-100 text-slate-400">
                                            <User size={48} />
                                        </AvatarFallback>
                                    </Avatar>
                                    <p className="text-center text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded">Authorized Photo</p>
                                </div>

                                <div className="flex-1 grid grid-cols-2 gap-y-4 gap-x-4 content-center">
                                    <div className="border-l-2 border-emerald-500 pl-3">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Full Name</p>
                                        <p className="text-sm font-bold text-slate-900 leading-tight">{data.student.name}</p>
                                    </div>
                                    <div className="border-l-2 border-emerald-500 pl-3">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Matric Number</p>
                                        <p className="text-sm font-mono font-bold text-slate-900 tracking-tight">{data.student.matric_number}</p>
                                    </div>
                                    <div className="border-l-2 border-emerald-500 pl-3">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Department</p>
                                        <p className="text-sm font-semibold text-slate-800">{data.student.department}</p>
                                    </div>
                                    <div className="border-l-2 border-emerald-500 pl-3">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Level</p>
                                        <p className="text-sm font-semibold text-slate-800">{data.student.level} Level</p>
                                    </div>
                                </div>

                                <div className="hidden sm:flex flex-col items-center justify-center border-l border-slate-200 pl-4">
                                    <div className="bg-white p-1 rounded-lg border border-slate-100 shadow-sm">
                                        <QrCode className="h-20 w-20 text-slate-900" />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 font-medium uppercase tracking-widest">Scan</p>
                                </div>
                            </div>

                            {/* Registered Courses */}
                            <div className="relative z-10">
                                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                                    <div className="p-1 bg-emerald-100 rounded text-emerald-700">
                                        <FileText className="h-3 w-3" />
                                    </div>
                                    Registered Courses
                                </h3>
                                <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-bold text-slate-600 w-20 uppercase tracking-wider">Code</th>
                                                <th className="px-3 py-2 text-left font-bold text-slate-600 uppercase tracking-wider">Course Title</th>
                                                <th className="px-3 py-2 text-center font-bold text-slate-600 w-12 uppercase tracking-wider">Unit</th>
                                                <th className="px-3 py-2 text-center font-bold text-slate-600 w-24 uppercase tracking-wider border-l border-slate-200">Sign</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {data.courses.map((course: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-slate-50/50">
                                                    <td className="px-3 py-2 font-mono font-bold text-emerald-700">{course.code}</td>
                                                    <td className="px-3 py-2 text-slate-700 font-medium">{course.title}</td>
                                                    <td className="px-3 py-2 text-center text-slate-600">{course.unit}</td>
                                                    <td className="px-3 py-2 border-l border-slate-100"></td>
                                                </tr>
                                            ))}
                                            <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                                                <td className="px-3 py-2 text-right text-slate-600 uppercase tracking-wider" colSpan={2}>Total Units</td>
                                                <td className="px-3 py-2 text-center text-emerald-700">{data.total_units}</td>
                                                <td className="border-l border-slate-200"></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Footer / Disclaimer */}
                            <div className="relative z-10 mt-8 pt-4 border-t-2 border-slate-100 flex flex-col sm:flex-row justify-between items-end gap-6">
                                <div className="text-[10px] text-slate-500 max-w-xs bg-yellow-50/50 p-3 rounded-lg border border-yellow-100">
                                    <p className="font-bold text-yellow-800 mb-1 uppercase tracking-wide flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" /> Examination Rules:
                                    </p>
                                    <ul className="list-disc pl-3 space-y-0.5 text-slate-600 leading-tight">
                                        <li>Bring this card to exams.</li>
                                        <li>Do not write on this card.</li>
                                        <li>No malpractice allowed.</li>
                                    </ul>
                                </div>
                                <div className="text-center w-40">
                                    <div className="h-10 border-b-2 border-slate-800 mb-1 relative">
                                        {/* Optional: Add a signature image here */}
                                        {/* <img src="/signature.png" alt="Signature" className="absolute bottom-0 left-1/2 -translate-x-1/2 h-14 opacity-80" /> */}
                                    </div>
                                    <p className="text-[10px] uppercase font-bold text-slate-900 tracking-widest">Exam Officer</p>
                                    <p className="text-[9px] text-slate-400">Date: {new Date(data.generated_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Decorative Bottom Bar */}
                        <div className="h-2 bg-gradient-to-r from-emerald-600 to-teal-800 print:bg-black"></div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}