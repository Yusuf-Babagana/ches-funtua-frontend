"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Lock, Home, BookOpen, GraduationCap, FileText, CreditCard, Settings } from "lucide-react"
import { authAPI } from "@/lib/api"
import { toast } from "sonner"

export default function StudentSettings() {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        old_password: "",
        new_password: "",
        confirm_password: "",
    })

    const sidebarItems = [
        { href: "/dashboard/student", label: "Dashboard", icon: Home, active: false },
        { href: "/dashboard/student/courses", label: "My Courses", icon: BookOpen, active: false },
        { href: "/dashboard/student/grades", label: "Results", icon: GraduationCap, active: false },
        { href: "/dashboard/student/transcript", label: "Transcript", icon: FileText, active: false },
        { href: "/dashboard/student/payments", label: "Finances", icon: CreditCard, active: false },
        { href: "/dashboard/student/settings", label: "Settings", icon: Settings, active: true },
    ]

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.new_password !== formData.confirm_password) {
            return toast.error("New passwords do not match")
        }

        setLoading(true)
        try {
            // Ensure your authAPI.changePassword matches the endpoint /api/users/change-password/
            const res = await authAPI.changePassword(formData)
            if (res.error) {
                toast.error(res.error.detail || "Failed to update password")
            } else {
                toast.success("Password changed successfully")
                setFormData({ old_password: "", new_password: "", confirm_password: "" })
            }
        } catch (err) {
            toast.error("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <DashboardLayout title="Account Settings" role="student" sidebarItems={sidebarItems}>
            <div className="max-w-2xl mx-auto space-y-6">
                <Card className="border-none shadow-lg">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-teal-600 mb-2">
                            <Lock className="h-5 w-5" />
                            <CardTitle>Security</CardTitle>
                        </div>
                        <CardDescription>Update your password to keep your account secure.</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <form onSubmit={handleChangePassword} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="old_password">Current Password</Label>
                                    <Input
                                        id="old_password"
                                        type="password"
                                        required
                                        value={formData.old_password}
                                        onChange={(e) => setFormData({ ...formData, old_password: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new_password">New Password</Label>
                                    <Input
                                        id="new_password"
                                        type="password"
                                        required
                                        value={formData.new_password}
                                        onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                                    <Input
                                        id="confirm_password"
                                        type="password"
                                        required
                                        value={formData.confirm_password}
                                        onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium cursor-pointer relative z-20"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Update Password
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
