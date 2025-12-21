"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Loader2, Calendar, Users, AlertTriangle,
    RefreshCw, Server, ShieldCheck, Database, Lock, CheckCircle2
} from "lucide-react"
import { academicsAPI, ictAPI } from "@/lib/api"
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

export default function SystemConfigPage() {
    const [loading, setLoading] = useState(true)
    const [config, setConfig] = useState<any>(null)

    // Actions State
    const [actionLoading, setActionLoading] = useState(false)
    const [newSessionData, setNewSessionData] = useState({ session: "", start_date: "" })
    const [showSessionModal, setShowSessionModal] = useState(false)
    const [showPromoteModal, setShowPromoteModal] = useState(false)

    // Generate next 5 years for dropdown
    const currentYear = new Date().getFullYear()
    const nextSessions = Array.from({ length: 5 }, (_, i) => {
        const year = currentYear + i;
        return `${year}/${year + 1}`;
    });

    // Load Configuration
    const loadConfig = async () => {
        try {
            setLoading(true)
            const data = await ictAPI.getCurrentConfiguration()
            setConfig(data)
        } catch (error) {
            toast.error("Failed to load system configuration")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadConfig()
    }, [])

    // 1. Toggle Registration
    const handleToggleRegistration = async (checked: boolean) => {
        try {
            // Optimistic update
            setConfig((prev: any) => ({
                ...prev,
                academic_settings: { ...prev.academic_settings, is_registration_active: checked }
            }))

            await ictAPI.updateSystemSettings({ registration_enabled: checked })
            toast.success(`Registration ${checked ? 'Opened' : 'Closed'}`)
        } catch (error) {
            toast.error("Failed to update settings")
            loadConfig() // Revert
        }
    }

    // 2. Start New Session
    const handleStartSession = async () => {
        if (!newSessionData.session || !newSessionData.start_date) {
            return toast.error("Please fill all fields")
        }

        setActionLoading(true)
        try {
            await academicsAPI.startNewSession(newSessionData)
            toast.success(`New Session ${newSessionData.session} Started!`)
            setShowSessionModal(false)
            loadConfig()
        } catch (error) {
            toast.error("Failed to start session")
        } finally {
            setActionLoading(false)
        }
    }

    // 3. Promote Students
    const handlePromoteStudents = async () => {
        setActionLoading(true)
        try {
            const res = await academicsAPI.promoteStudents({ confirm: true })
            toast.success(res.message || "Students promoted successfully")
            setShowPromoteModal(false)
        } catch (error) {
            toast.error("Promotion failed")
        } finally {
            setActionLoading(false)
        }
    }

    if (loading) {
        return (
            <DashboardLayout title="System Configuration" role="ict">
                <div className="h-[60vh] flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
                </div>
            </DashboardLayout>
        )
    }

    const currentSemester = config?.academic_settings || {}

    return (
        <DashboardLayout title="System Configuration" role="ict">
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">

                {/* Header */}
                <div className="flex justify-between items-center border-b border-gray-100 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">System Control Center</h1>
                        <p className="text-muted-foreground mt-1">Manage academic sessions, semesters, and core system settings.</p>
                    </div>
                    <Button variant="outline" onClick={loadConfig} className="border-teal-200 text-teal-700 hover:bg-teal-50">
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh Status
                    </Button>
                </div>

                {/* Current Status Card */}
                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-white to-blue-50/50 border-blue-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-blue-600 uppercase tracking-wider">Current Session</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">
                                {currentSemester.current_academic_year || "Not Set"}
                            </div>
                            <div className="flex items-center mt-2">
                                <Badge variant="outline" className="bg-white text-blue-600 border-blue-200">
                                    {currentSemester.current_semester || "No Active Semester"}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={`${currentSemester.registration_enabled ? "bg-gradient-to-br from-white to-green-50/50 border-green-100" : "bg-gradient-to-br from-white to-amber-50/50 border-amber-100"} shadow-sm`}>
                        <CardHeader className="pb-2">
                            <CardTitle className={`text-sm font-medium uppercase tracking-wider ${currentSemester.registration_enabled ? "text-green-600" : "text-amber-600"}`}>
                                Registration Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-3xl font-bold ${currentSemester.registration_enabled ? "text-green-900" : "text-amber-900"}`}>
                                {currentSemester.registration_enabled ? "OPEN" : "CLOSED"}
                            </div>
                            <p className={`text-xs mt-2 font-medium flex items-center ${currentSemester.registration_enabled ? "text-green-600" : "text-amber-600"}`}>
                                {currentSemester.registration_enabled ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                                {currentSemester.registration_enabled ? "Students can register courses" : "Registration is locked"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-white to-gray-50/50 border-gray-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">System Health</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">Healthy</div>
                            <div className="flex items-center gap-1 mt-2 text-xs text-green-600 font-medium bg-green-50 w-fit px-2 py-1 rounded-full border border-green-100">
                                <Server className="h-3 w-3" /> All services operational
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="academic" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-slate-100 p-1 rounded-lg">
                        <TabsTrigger value="academic" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">Academic Operations</TabsTrigger>
                        <TabsTrigger value="maintenance" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">Maintenance</TabsTrigger>
                    </TabsList>

                    {/* --- ACADEMIC OPERATIONS TAB --- */}
                    <TabsContent value="academic" className="space-y-6 mt-6">

                        {/* 1. Registration Toggle */}
                        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg text-gray-900">Course Registration</CardTitle>
                                        <CardDescription>Control access to course registration for all students.</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-medium ${currentSemester.registration_enabled ? 'text-green-600' : 'text-gray-500'}`}>
                                            {currentSemester.registration_enabled ? 'Active' : 'Inactive'}
                                        </span>
                                        <Switch
                                            checked={currentSemester.registration_enabled}
                                            onCheckedChange={handleToggleRegistration}
                                            className="data-[state=checked]:bg-blue-600"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* 2. New Session */}
                        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600 mt-1">
                                        <Calendar className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg text-gray-900">Start New Academic Session</CardTitle>
                                        <CardDescription>
                                            Create a new academic year (e.g., 2025/2026). This will archive the current session and reset registration.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardFooter className="bg-slate-50/50 border-t pt-4">
                                <Dialog open={showSessionModal} onOpenChange={setShowSessionModal}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                                            Start New Session
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-white/95 backdrop-blur-md">
                                        <DialogHeader>
                                            <DialogTitle>Start New Academic Session</DialogTitle>
                                            <DialogDescription>
                                                Enter details for the new academic year. Ensure the previous session is fully concluded.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-5 py-4">
                                            <div className="grid gap-2">
                                                <Label>Session Name</Label>
                                                {/* ✅ UPDATED: Dropdown (Select) for Session Name */}
                                                <Select
                                                    value={newSessionData.session}
                                                    onValueChange={(val) => setNewSessionData({ ...newSessionData, session: val })}
                                                >
                                                    <SelectTrigger className="bg-white border-slate-200 focus:ring-purple-500">
                                                        <SelectValue placeholder="Select Academic Year" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white border-slate-200">
                                                        {nextSessions.map(year => (
                                                            <SelectItem key={year} value={year} className="cursor-pointer hover:bg-purple-50 focus:bg-purple-50">
                                                                {year}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Start Date</Label>
                                                <Input
                                                    type="date"
                                                    className="bg-white border-slate-200 focus:ring-purple-500"
                                                    value={newSessionData.start_date}
                                                    onChange={(e) => setNewSessionData({ ...newSessionData, start_date: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setShowSessionModal(false)}>Cancel</Button>
                                            <Button onClick={handleStartSession} disabled={actionLoading} className="bg-purple-600 hover:bg-purple-700">
                                                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Create Session
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardFooter>
                        </Card>

                        {/* 3. Promote Students */}
                        <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600 mt-1">
                                        <Users className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg text-gray-900">Student Promotion</CardTitle>
                                        <CardDescription>
                                            Automatically promote students to the next level (100L → 200L, etc.). Final year students will be marked as Graduated.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardFooter className="bg-slate-50/50 border-t pt-4">
                                <Dialog open={showPromoteModal} onOpenChange={setShowPromoteModal}>
                                    <DialogTrigger asChild>
                                        <Button variant="destructive" className="bg-orange-600 hover:bg-orange-700 border-none">
                                            Promote All Students
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-white">
                                        <DialogHeader>
                                            <DialogTitle className="text-red-600 flex items-center gap-2">
                                                <AlertTriangle className="h-5 w-5" /> Warning: Irreversible Action
                                            </DialogTitle>
                                            <DialogDescription className="pt-2 text-slate-600">
                                                Are you sure you want to promote ALL active students?
                                                <ul className="list-disc pl-5 mt-3 space-y-1 text-slate-800 font-medium">
                                                    <li>100 Level → 200 Level</li>
                                                    <li>200 Level → 300 Level</li>
                                                    <li>300 Level → Graduated</li>
                                                </ul>
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setShowPromoteModal(false)}>Cancel</Button>
                                            <Button variant="destructive" onClick={handlePromoteStudents} disabled={actionLoading}>
                                                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Confirm Promotion
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardFooter>
                        </Card>

                    </TabsContent>

                    {/* --- MAINTENANCE TAB --- */}
                    <TabsContent value="maintenance">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                                        <ShieldCheck className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <CardTitle>System Maintenance</CardTitle>
                                        <CardDescription>Technical operations and logs.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-slate-50 transition-colors">
                                    <div>
                                        <h4 className="font-medium text-gray-900">Maintenance Mode</h4>
                                        <p className="text-sm text-muted-foreground">Disable access for all non-admin users.</p>
                                    </div>
                                    <Switch disabled />
                                </div>
                                <div className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-slate-50 transition-colors">
                                    <div>
                                        <h4 className="font-medium text-gray-900">Clear System Cache</h4>
                                        <p className="text-sm text-muted-foreground">Clear temporary data and cached files.</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Database className="h-4 w-4" /> Clear Cache
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

            </div>
        </DashboardLayout>
    )
}