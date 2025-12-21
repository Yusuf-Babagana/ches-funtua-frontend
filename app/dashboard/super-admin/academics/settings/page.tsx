"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Calendar, GraduationCap, ArrowRight, Loader2, AlertTriangle } from "lucide-react"
import { academicsAPI } from "@/lib/api"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function AcademicSettingsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [sessionName, setSessionName] = useState("")
    const [startDate, setStartDate] = useState("")

    const handleCreateSession = async () => {
        if (!sessionName || !startDate) return toast.error("Please enter session name and start date")

        if (!confirm(`Are you sure you want to start the ${sessionName} session? This will reset active semesters.`)) return

        setLoading(true)
        try {
            await academicsAPI.startNewSession({
                session: sessionName,
                start_date: startDate
            })
            toast.success(`Session ${sessionName} started successfully!`)
            setSessionName("")
            setStartDate("")
        } catch (e: any) {
            toast.error(e.response?.data?.error || "Failed to start session")
        } finally {
            setLoading(false)
        }
    }

    const handlePromotion = async () => {
        const confirmed = confirm(
            "⚠️ CRITICAL ACTION: Automatic Promotion\n\n" +
            "This will:\n" +
            "1. Graduate Level 300 Students\n" +
            "2. Promote Level 200 -> 300\n" +
            "3. Promote Level 100 -> 200\n\n" +
            "Are you absolutely sure you want to proceed?"
        )

        if (!confirmed) return

        setLoading(true)
        try {
            const res = await academicsAPI.promoteStudents({ confirm: true })

            toast.success(
                <div className="flex flex-col gap-1">
                    <span className="font-bold">Promotion Complete!</span>
                    <span className="text-xs">Graduated: {res.summary.graduated}</span>
                    <span className="text-xs">Promoted to L300: {res.summary.promoted_to_level_300}</span>
                    <span className="text-xs">Promoted to L200: {res.summary.promoted_to_level_200}</span>
                </div>
            )
        } catch (e: any) {
            toast.error("Promotion failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <DashboardLayout title="Academic Settings" role="super-admin">
            <div className="max-w-4xl mx-auto space-y-8">

                <div className="flex items-center gap-2 text-gray-500 mb-4 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => router.back()}>
                    <ArrowRight className="h-4 w-4 rotate-180" /> Back to Dashboard
                </div>

                {/* SESSION MANAGEMENT */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            Start New Academic Session
                        </CardTitle>
                        <CardDescription>
                            Begin a new school year (e.g., 2025/2026). This resets current semester flags.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Session Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 2025/2026"
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={sessionName}
                                    onChange={e => setSessionName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Start Date</label>
                                <input
                                    type="date"
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button onClick={handleCreateSession} disabled={loading} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Start New Session
                        </Button>
                    </CardContent>
                </Card>

                {/* PROMOTION MANAGEMENT */}
                <Card className="border-l-4 border-l-red-600 bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-700">
                            <GraduationCap className="h-6 w-6" />
                            End of Session Promotion
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                            Automatically promote students to the next level. Run this <b>only once</b> at the end of the academic year.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-6">
                            <h4 className="font-bold text-sm mb-2 flex items-center gap-2 text-red-800">
                                <AlertCircle className="h-4 w-4" /> What will happen:
                            </h4>
                            <ul className="list-disc pl-8 text-sm text-red-700 space-y-1">
                                <li>Level <b>300</b> students will be marked as <b>Graduated</b>.</li>
                                <li>Level <b>200</b> students will be moved to <b>Level 300</b>.</li>
                                <li>Level <b>100</b> students will be moved to <b>Level 200</b>.</li>
                            </ul>
                        </div>

                        {/* ✅ UPDATED BUTTON STYLE FOR HIGH VISIBILITY */}
                        <Button
                            className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-bold shadow-md transition-all active:scale-95"
                            onClick={handlePromotion}
                            disabled={loading}
                            size="lg"
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <AlertTriangle className="mr-2 h-5 w-5" />
                            )}
                            Run Automatic Promotion
                        </Button>
                    </CardContent>
                </Card>

            </div>
        </DashboardLayout>
    )
}