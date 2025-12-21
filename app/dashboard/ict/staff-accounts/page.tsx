
"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ictAPI, academicsAPI } from "@/lib/api"
import { toast } from "sonner"
import {
    Loader2,
    UserPlus,
    CheckCircle,
    Building2,
    User,
    Mail,
    Phone,
    Briefcase,
    GraduationCap,
    BadgeCheck,
    Users
} from "lucide-react"

// Unified Theme Styles
const inputClassName = "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:bg-slate-50";
const selectTriggerClassName = "flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:bg-slate-50"

export default function StaffCreationPage() {
    const [loading, setLoading] = useState(false)
    const [departments, setDepartments] = useState<any[]>([])

    // Form States
    const [role, setRole] = useState("lecturer")
    const [formData, setFormData] = useState({
        email: "",
        first_name: "",
        last_name: "",
        phone: "",
        staff_id: "",
        department: "", // For Lecturer/HOD
        designation: "lecturer_1", // For Lecturer
        position: "", // For generic staff
    })

    useEffect(() => {
        fetchDepartments()
    }, [])

    const fetchDepartments = async () => {
        try {
            const res = await academicsAPI.getDepartments()
            if (Array.isArray(res)) setDepartments(res)
            else if (res.results) setDepartments(res.results)
        } catch (e) {
            console.error("Failed to load departments")
            toast.error("Failed to load departments")
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData({ ...formData, [name]: value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            let response;

            if (role === "lecturer") {
                response = await ictAPI.createLecturer({
                    email: formData.email,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone,
                    staff_id: formData.staff_id,
                    department: parseInt(formData.department),
                    designation: formData.designation
                })
            } else if (role === "hod") {
                response = await ictAPI.createHOD({
                    user_data: {
                        email: formData.email,
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        phone: formData.phone,
                        password: "Password@123", // Consider making this dynamic or generic
                        password_confirm: "Password@123"
                    },
                    department_id: parseInt(formData.department),
                    staff_id: formData.staff_id,
                    designation: formData.designation
                })
            } else {
                // Other staff (Bursar, Registrar, etc)
                response = await ictAPI.createStaff(role, {
                    email: formData.email,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone,
                    staff_id: formData.staff_id,
                    position: formData.position || role.replace('-', ' ').toUpperCase()
                })
            }

            if (response && !response.error) {
                toast.success(`${role.toUpperCase().replace('-', ' ')} account created successfully!`)
                // Reset form
                setFormData({ ...formData, email: "", first_name: "", last_name: "", phone: "", staff_id: "" })
            } else {
                toast.error(response?.error?.detail || "Failed to create account")
            }
        } catch (error: any) {
            toast.error(error.message || "An error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <DashboardLayout title="Staff Provisioning" role="ict">
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Create Staff Account</h1>
                        <p className="text-slate-500">Provision secure accounts for academic and administrative staff.</p>
                    </div>
                </div>

                <Tabs defaultValue="lecturer" onValueChange={setRole} className="w-full space-y-6">

                    {/* Custom Styled Tabs List */}
                    <div className="flex justify-center">
                        <TabsList className="grid w-full max-w-2xl grid-cols-3 h-12 bg-slate-100/80 p-1 rounded-xl">
                            <TabsTrigger value="lecturer" className="data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm rounded-lg transition-all duration-200">
                                <GraduationCap className="w-4 h-4 mr-2" /> Lecturer
                            </TabsTrigger>
                            <TabsTrigger value="hod" className="data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm rounded-lg transition-all duration-200">
                                <Building2 className="w-4 h-4 mr-2" /> HOD
                            </TabsTrigger>
                            <TabsTrigger value="admin" className="data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm rounded-lg transition-all duration-200">
                                <Briefcase className="w-4 h-4 mr-2" /> Admin Staff
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <Card className="border-slate-200 shadow-lg shadow-slate-200/50">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-xl">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${role === 'admin' ? 'bg-orange-100 text-orange-600' : 'bg-teal-100 text-teal-600'}`}>
                                    {role === 'lecturer' && <GraduationCap className="w-6 h-6" />}
                                    {role === 'hod' && <Building2 className="w-6 h-6" />}
                                    {role === 'admin' && <Briefcase className="w-6 h-6" />}
                                </div>
                                <div>
                                    <CardTitle className="capitalize text-xl text-slate-800">
                                        New {role === 'admin' ? 'Administrative Staff' : role === 'hod' ? 'Head of Department' : 'Lecturer'} Profile
                                    </CardTitle>
                                    <CardDescription>
                                        Enter the staff member's details. A temporary password will be generated automatically.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 md:p-8">
                            <form onSubmit={handleSubmit} className="space-y-8">

                                {/* --- Admin Role Selector (Conditional) --- */}
                                {role === 'admin' && (
                                    <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 mb-6 animate-in fade-in slide-in-from-top-2">
                                        <div className="space-y-2 max-w-md">
                                            <Label className="text-orange-900 font-semibold flex items-center gap-2">
                                                <BadgeCheck className="w-4 h-4" /> Select Specific Admin Role
                                            </Label>
                                            <Select onValueChange={(val) => setRole(val)}>
                                                <SelectTrigger className="bg-white border-orange-200 focus:ring-orange-500">
                                                    <SelectValue placeholder="Choose Role..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="registrar">Registrar</SelectItem>
                                                    <SelectItem value="bursar">Bursar</SelectItem>
                                                    <SelectItem value="exam-officer">Exam Officer</SelectItem>
                                                    <SelectItem value="desk-officer">Desk Officer</SelectItem>
                                                    <SelectItem value="ict">ICT Officer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}

                                {/* --- Section 1: Personal Details --- */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-teal-800 font-semibold border-b border-teal-100 pb-2">
                                        <User className="w-5 h-5" />
                                        <h3>Personal Information</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="first_name" className="text-slate-600">First Name <span className="text-red-500">*</span></Label>
                                            <Input id="first_name" required name="first_name" value={formData.first_name} onChange={handleChange} placeholder="e.g. Ibrahim" className={inputClassName} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="last_name" className="text-slate-600">Last Name <span className="text-red-500">*</span></Label>
                                            <Input id="last_name" required name="last_name" value={formData.last_name} onChange={handleChange} placeholder="e.g. Musa" className={inputClassName} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-slate-600">Email Address <span className="text-red-500">*</span></Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                                <Input id="email" required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="staff@school.edu.ng" className={`${inputClassName} pl-9`} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-slate-600">Phone Number</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+234..." className={`${inputClassName} pl-9`} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* --- Section 2: Role Configuration --- */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-teal-800 font-semibold border-b border-teal-100 pb-2">
                                        <Users className="w-5 h-5" />
                                        <h3>Role Configuration</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="staff_id" className="text-slate-600">Staff ID <span className="text-red-500">*</span></Label>
                                            <Input id="staff_id" required name="staff_id" value={formData.staff_id} onChange={handleChange}
                                                placeholder={`e.g. ${role === 'admin' ? 'STAFF' : role.toUpperCase().substring(0, 3)}/001`}
                                                className={`${inputClassName} font-mono bg-slate-50`}
                                            />
                                        </div>

                                        {/* Department is only for Lecturers/HODs */}
                                        {(role === 'lecturer' || role === 'hod') && (
                                            <div className="space-y-2">
                                                <Label className="text-slate-600">Department <span className="text-red-500">*</span></Label>
                                                <Select onValueChange={(val) => handleSelectChange('department', val)}>
                                                    <SelectTrigger className={selectTriggerClassName}>
                                                        <SelectValue placeholder="Select Department" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {departments.map((dept) => (
                                                            <SelectItem key={dept.id} value={dept.id.toString()}>
                                                                {dept.name} ({dept.code})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {/* Position for Admin Staff */}
                                        {role !== 'lecturer' && role !== 'hod' && (
                                            <div className="space-y-2">
                                                <Label className="text-slate-600">Official Title / Position</Label>
                                                <Input name="position" value={formData.position} onChange={handleChange} placeholder="e.g. Chief Accountant" className={inputClassName} />
                                            </div>
                                        )}
                                    </div>

                                    {(role === 'lecturer' || role === 'hod') && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <Label className="text-slate-600">Academic Rank</Label>
                                                <Select onValueChange={(val) => handleSelectChange('designation', val)} defaultValue="lecturer_1">
                                                    <SelectTrigger className={selectTriggerClassName}>
                                                        <SelectValue placeholder="Select Designation" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="professor">Professor</SelectItem>
                                                        <SelectItem value="senior_lecturer">Senior Lecturer</SelectItem>
                                                        <SelectItem value="lecturer_1">Lecturer I</SelectItem>
                                                        <SelectItem value="lecturer_2">Lecturer II</SelectItem>
                                                        <SelectItem value="assistant_lecturer">Assistant Lecturer</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="pt-6 border-t border-slate-100">
                                    <Button type="submit" size="lg" className="w-full bg-teal-600 hover:bg-teal-700 text-lg font-medium shadow-lg shadow-teal-700/20 transition-all duration-300" disabled={loading}>
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating Account...
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="mr-2 h-5 w-5" /> Provision Account
                                            </>
                                        )}
                                    </Button>
                                </div>

                            </form>
                        </CardContent>
                    </Card>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
