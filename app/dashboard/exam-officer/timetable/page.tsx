"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Loader2, Calendar, Clock, MapPin,
    Wand2, Save, Send, AlertCircle, FileText
} from "lucide-react"
import { examOfficerAPI } from "@/lib/api"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { format } from "date-fns"

export default function ExamTimetablePage() {
    const [loading, setLoading] = useState(true)
    const [timetable, setTimetable] = useState<any[]>([])
    const [meta, setMeta] = useState<any>(null)

    // Generation State
    const [showGenerateModal, setShowGenerateModal] = useState(false)
    const [genLoading, setGenLoading] = useState(false)
    const [genParams, setGenParams] = useState({
        exam_start_date: "",
        exam_end_date: "",
        exams_per_day: 2
    })

    // Fetch Data
    const fetchTimetable = async () => {
        try {
            setLoading(true)
            const res = await examOfficerAPI.getCurrentTimetable()
            if (res && !res.error) {
                setTimetable(res.timetable || [])
                setMeta(res.semester)
            }
        } catch (error) {
            toast.error("Failed to load timetable")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTimetable()
    }, [])

    // Handle Generate
    const handleGenerate = async () => {
        if (!genParams.exam_start_date || !genParams.exam_end_date) {
            return toast.error("Please select start and end dates")
        }

        setGenLoading(true)
        try {
            const res = await examOfficerAPI.generateTimetable(genParams)
            if (res && !res.error) {
                setTimetable(res.timetable)
                toast.success(`Generated schedule for ${res.timetable.length} exams`)
                setShowGenerateModal(false)
            } else {
                toast.error(res.error || "Generation failed")
            }
        } catch (error) {
            toast.error("Network error")
        } finally {
            setGenLoading(false)
        }
    }

    // Handle Publish
    const handlePublish = async () => {
        if (timetable.length === 0) return toast.error("No timetable to publish")

        try {
            await examOfficerAPI.publishTimetable(timetable)
            toast.success("Timetable published to students!")
            // Update local state to reflect published status if backend supported it
            // For now we just notify
        } catch (error) {
            toast.error("Failed to publish")
        }
    }

    if (loading) {
        return (
            <DashboardLayout title="Exam Timetable" role="exam_officer">
                <div className="h-[60vh] flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout title="Exam Timetable" role="exam_officer">
            <div className="space-y-6 max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Exam Timetable</h1>
                        <p className="text-gray-500">
                            {meta ? `${meta.session} - ${meta.semester}` : "Manage Examination Schedule"}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                                    <Wand2 className="mr-2 h-4 w-4" /> Generate Auto
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Generate Exam Timetable</DialogTitle>
                                    <DialogDescription>
                                        Automatically schedule exams for all active courses in the current semester.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Start Date</Label>
                                            <Input
                                                type="date"
                                                value={genParams.exam_start_date}
                                                onChange={(e) => setGenParams({ ...genParams, exam_start_date: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>End Date</Label>
                                            <Input
                                                type="date"
                                                value={genParams.exam_end_date}
                                                onChange={(e) => setGenParams({ ...genParams, exam_end_date: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Exams Per Day</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={4}
                                            value={genParams.exams_per_day}
                                            onChange={(e) => setGenParams({ ...genParams, exams_per_day: parseInt(e.target.value) })}
                                        />
                                        <p className="text-xs text-gray-500">Maximum number of slots per day (e.g., Morning, Afternoon)</p>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setShowGenerateModal(false)}>Cancel</Button>
                                    <Button onClick={handleGenerate} disabled={genLoading}>
                                        {genLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Generate Schedule
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Button onClick={handlePublish} disabled={timetable.length === 0} className="bg-green-600 hover:bg-green-700">
                            <Send className="mr-2 h-4 w-4" /> Publish Timetable
                        </Button>
                    </div>
                </div>

                {/* Timetable View */}
                {timetable.length === 0 ? (
                    <Card className="border-dashed border-2">
                        <CardContent className="py-16 text-center text-gray-500">
                            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-lg font-medium">No exams scheduled yet.</p>
                            <p className="text-sm mt-1">Use the "Generate Auto" button to create a schedule.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {timetable.map((exam, idx) => (
                            <Card key={idx} className="hover:shadow-md transition-shadow border-slate-200">
                                <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <Badge variant="outline" className="bg-white font-mono text-xs mb-1">
                                                {exam.course_code}
                                            </Badge>
                                            <CardTitle className="text-base font-semibold leading-tight">
                                                {exam.course_title}
                                            </CardTitle>
                                        </div>
                                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 text-[10px]">
                                            {exam.department}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-3 text-sm">
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <Calendar className="h-4 w-4 text-blue-500" />
                                        <span className="font-medium">
                                            {format(new Date(exam.exam_date), "EEEE, MMMM do, yyyy")}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <Clock className="h-4 w-4 text-orange-500" />
                                        <span>{exam.exam_time} ({exam.duration})</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <MapPin className="h-4 w-4 text-red-500" />
                                        <span>{exam.venue}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}