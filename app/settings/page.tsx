"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Lock, Shield, Mail, Phone, Hash, Loader2 } from "lucide-react"
import { authAPI } from "@/lib/api"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export default function SettingsPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [profile, setProfile] = useState<any>(null)

    // Password State
    const [passwords, setPasswords] = useState({
        old_password: "",
        new_password: "",
        confirm_password: ""
    })

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const res = await authAPI.getCurrentUser()
            setProfile(res)
        } catch (e) {
            console.error(e)
        }
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        if (passwords.new_password !== passwords.confirm_password) {
            return toast.error("New passwords do not match")
        }

        setLoading(true)
        try {
            const res = await authAPI.changePassword(passwords)
            if (res && !res.error) {
                toast.success("Password changed successfully")
                setPasswords({ old_password: "", new_password: "", confirm_password: "" })
            } else {
                const errorMsg = res.error?.confirm_password?.[0] || res.error?.error || "Failed to update password"
                toast.error(errorMsg)
            }
        } catch (e) {
            toast.error("Network error")
        } finally {
            setLoading(false)
        }
    }

    if (!user) return null

    // Determine user-specific ID label
    const getIdentityLabel = () => {
        if (user.role === 'student') return "Matric Number"
        if (user.role === 'lecturer' || user.role === 'hod') return "Staff ID"
        return "System ID"
    }

    const getIdentityValue = () => {
        if (!profile?.profile) return "Loading..."
        if (user.role === 'student') return profile.profile.matric_number
        return profile.profile.staff_id
    }

    return (
        <DashboardLayout title="Account Settings" role={user.role as any}>
            <div className="max-w-4xl mx-auto space-y-6">

                <h1 className="text-3xl font-bold text-slate-900">Settings</h1>

                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="security">Security</TabsTrigger>
                    </TabsList>

                    {/* --- PROFILE TAB --- */}
                    <TabsContent value="profile" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>View your basic account details.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">

                                <div className="flex items-center gap-6">
                                    <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border-2 border-slate-200">
                                        <User className="h-10 w-10" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">{user.first_name} {user.last_name}</h3>
                                        <p className="text-slate-500 capitalize">{user.role.replace('-', ' ')}</p>
                                        <Badge className="mt-2 bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
                                            Active Account
                                        </Badge>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-slate-500">Email Address</Label>
                                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-md border text-sm">
                                            <Mail className="h-4 w-4 text-slate-400" />
                                            {user.email}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-500">{getIdentityLabel()}</Label>
                                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-md border text-sm font-mono">
                                            <Hash className="h-4 w-4 text-slate-400" />
                                            {getIdentityValue()}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-500">Phone Number</Label>
                                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-md border text-sm">
                                            <Phone className="h-4 w-4 text-slate-400" />
                                            {user.phone || "Not set"}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-500">Department</Label>
                                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-md border text-sm">
                                            <Shield className="h-4 w-4 text-slate-400" />
                                            {profile?.profile?.department_name || profile?.profile?.department || "N/A"}
                                        </div>
                                    </div>
                                </div>

                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* --- SECURITY TAB --- */}
                    <TabsContent value="security" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Password</CardTitle>
                                <CardDescription>Change your password to keep your account secure.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
                                    <div className="space-y-2">
                                        <Label>Current Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                type="password"
                                                className="pl-9"
                                                value={passwords.old_password}
                                                onChange={e => setPasswords({ ...passwords, old_password: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>New Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                type="password"
                                                className="pl-9"
                                                value={passwords.new_password}
                                                onChange={e => setPasswords({ ...passwords, new_password: e.target.value })}
                                                required
                                                minLength={8}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Confirm New Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                type="password"
                                                className="pl-9"
                                                value={passwords.confirm_password}
                                                onChange={e => setPasswords({ ...passwords, confirm_password: e.target.value })}
                                                required
                                                minLength={8}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <Button type="submit" disabled={loading}>
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Update Password
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}