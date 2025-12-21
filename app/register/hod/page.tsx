"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, UserCog } from "lucide-react"
import Link from "next/link"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

interface Department {
    id: number
    name: string
    code: string
    current_hod: string | null
}

interface Designation {
    value: string
    label: string
}

const DESIGNATIONS: Designation[] = [
    { value: 'professor', label: 'Professor' },
    { value: 'associate_professor', label: 'Associate Professor' },
    { value: 'senior_lecturer', label: 'Senior Lecturer' },
    { value: 'lecturer_1', label: 'Lecturer I' },
    { value: 'lecturer_2', label: 'Lecturer II' },
    { value: 'assistant_lecturer', label: 'Assistant Lecturer' },
]

export default function HODRegistration() {
    const [formData, setFormData] = useState({
        // User data
        email: "",
        username: "",
        firstName: "",
        lastName: "",
        phone: "",
        password: "",
        confirmPassword: "",

        // Lecturer/HOD data
        staffId: "",
        departmentId: "",
        designation: "",
        specialization: "",
        qualifications: "",
        officeLocation: "",
        consultationHours: "",
    })

    const [departments, setDepartments] = useState<Department[]>([])
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
    const [errorMessage, setErrorMessage] = useState("")
    const [loadingDepartments, setLoadingDepartments] = useState(true)

    // Fetch departments for HOD registration
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                setLoadingDepartments(true)
                const response = await fetch(`${API_BASE}/auth/register/hod/`)

                if (response.ok) {
                    const data = await response.json()

                    if (data.available_departments) {
                        setDepartments(data.available_departments)
                    } else {
                        console.warn("No departments data in response")
                        setDepartments([])
                    }
                } else {
                    console.warn("Could not fetch departments")
                    setDepartments([])
                }
            } catch (error) {
                console.error("Failed to fetch departments:", error)
                setDepartments([])
            } finally {
                setLoadingDepartments(false)
            }
        }
        fetchDepartments()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus("loading")
        setErrorMessage("")

        // Validate password match
        if (formData.password !== formData.confirmPassword) {
            setErrorMessage("Passwords do not match")
            setStatus("error")
            return
        }

        // Validate required fields
        const requiredFields = ['email', 'username', 'firstName', 'lastName', 'password', 'staffId', 'departmentId', 'designation']
        const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData])

        if (missingFields.length > 0) {
            setErrorMessage(`Please fill in all required fields: ${missingFields.join(', ')}`)
            setStatus("error")
            return
        }

        try {
            // Prepare user data
            const userData = {
                email: formData.email,
                username: formData.username,
                first_name: formData.firstName,
                last_name: formData.lastName,
                phone: formData.phone || "",
                password: formData.password,
                password_confirm: formData.confirmPassword,
            }

            // Prepare HOD data
            const hodData = {
                user_data: userData,
                staff_id: formData.staffId,
                department_id: parseInt(formData.departmentId),
                designation: formData.designation,
                specialization: formData.specialization || "",
                qualifications: formData.qualifications || "",
                office_location: formData.officeLocation || "",
                consultation_hours: formData.consultationHours || "",
            }

            console.log("🎯 Sending HOD registration:", hodData)

            const response = await fetch(`${API_BASE}/auth/register/hod/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(hodData),
            })

            const responseText = await response.text()
            console.log("📥 Response:", responseText)

            if (!response.ok) {
                let errorData
                try {
                    errorData = JSON.parse(responseText)
                } catch {
                    errorData = { detail: responseText }
                }

                // Format error message
                const fieldErrors: string[] = []
                for (const [field, messages] of Object.entries(errorData)) {
                    if (Array.isArray(messages)) {
                        fieldErrors.push(`${field}: ${messages.join(', ')}`)
                    } else if (typeof messages === 'object') {
                        for (const [subField, subMessages] of Object.entries(messages)) {
                            fieldErrors.push(`${field}.${subField}: ${Array.isArray(subMessages) ? subMessages.join(', ') : subMessages}`)
                        }
                    } else {
                        fieldErrors.push(`${field}: ${messages}`)
                    }
                }

                throw new Error(fieldErrors.join('; ') || 'Registration failed')
            }

            const result = JSON.parse(responseText)
            console.log("✅ HOD REGISTRATION SUCCESS:", result)

            // Store tokens and user data
            localStorage.setItem('token', result.access)
            localStorage.setItem('user', JSON.stringify(result.user))
            localStorage.setItem('hod_department', JSON.stringify(result.department))

            console.log("🔐 Token stored, redirecting to HOD dashboard...")

            // Redirect to HOD dashboard
            setTimeout(() => {
                window.location.href = '/dashboard/hod'
            }, 1000)

        } catch (error: any) {
            console.error("❌ HOD Registration error:", error)
            setErrorMessage(error.message || "HOD registration failed. Please try again.")
            setStatus("error")
        }
    }

    // Generate username from email
    const handleEmailChange = (email: string) => {
        setFormData(prev => ({
            ...prev,
            email,
            username: email.split('@')[0]
        }))
    }

    // Generate staff ID
    const generateStaffId = () => {
        const timestamp = Date.now().toString().slice(-4)
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
        return `HOD/${timestamp}${randomNum}`
    }

    // Fill with test data
    const fillTestData = () => {
        const testData = {
            email: "hod.test@college.edu",
            username: "hodtest",
            firstName: "John",
            lastName: "Doe",
            phone: "+2348012345678",
            password: "HodPass123!",
            confirmPassword: "HodPass123!",
            staffId: generateStaffId(),
            departmentId: departments.length > 0 ? departments[0].id.toString() : "",
            designation: "professor",
            specialization: "Computer Science",
            qualifications: "PhD Computer Science",
            officeLocation: "Science Building, Room 301",
            consultationHours: "Monday-Friday, 2PM-4PM",
        }

        setFormData(testData)
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader className="space-y-2">
                    <Link href="/register" className="flex items-center text-sm text-muted-foreground hover:text-primary">
                        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Registration Portal
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600">
                            <UserCog className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-2xl">HOD Registration</CardTitle>
                    </div>
                    <CardDescription>
                        Register as Head of Department. You will be assigned to manage a specific department.
                    </CardDescription>

                    {departments.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                            <p className="text-sm text-blue-800">
                                <strong>Available Departments:</strong> {departments.length} department(s) available for HOD assignment
                            </p>
                        </div>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={fillTestData}
                        className="w-fit"
                    >
                        Fill Test Data
                    </Button>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* User Information */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name *</Label>
                                <Input
                                    id="firstName"
                                    required
                                    placeholder="John"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name *</Label>
                                <Input
                                    id="lastName"
                                    required
                                    placeholder="Doe"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address *</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                placeholder="hod@college.edu"
                                value={formData.email}
                                onChange={(e) => handleEmailChange(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="username">Username *</Label>
                            <Input
                                id="username"
                                required
                                placeholder="johndoe"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">Auto-generated from email, but you can change it</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+234 800 000 0000"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        {/* Staff Information */}
                        <div className="space-y-2">
                            <Label htmlFor="staffId">Staff ID *</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="staffId"
                                    required
                                    placeholder="HOD/001"
                                    value={formData.staffId}
                                    onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setFormData({ ...formData, staffId: generateStaffId() })}
                                >
                                    Generate
                                </Button>
                            </div>
                        </div>

                        {/* Department Selection - CRITICAL FOR HOD */}
                        <div className="space-y-2">
                            <Label htmlFor="departmentId">Department to Manage *</Label>
                            {loadingDepartments ? (
                                <div className="text-center py-4">
                                    <p>Loading departments...</p>
                                </div>
                            ) : departments.length === 0 ? (
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        No departments available for HOD assignment. Please create departments first.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <select
                                    id="departmentId"
                                    required
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.departmentId}
                                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                >
                                    <option value="">Select a Department to Manage</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name} ({dept.code}) {dept.current_hod ? ` - Current HOD: ${dept.current_hod}` : ' - Vacant'}
                                        </option>
                                    ))}
                                </select>
                            )}
                            <p className="text-xs text-muted-foreground">
                                You will be assigned as Head of this department
                            </p>
                        </div>

                        {/* Designation */}
                        <div className="space-y-2">
                            <Label htmlFor="designation">Designation *</Label>
                            <Select
                                required
                                value={formData.designation}
                                onValueChange={(value) => setFormData({ ...formData, designation: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your designation" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DESIGNATIONS.map((designation) => (
                                        <SelectItem key={designation.value} value={designation.value}>
                                            {designation.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Specialization */}
                        <div className="space-y-2">
                            <Label htmlFor="specialization">Specialization</Label>
                            <Input
                                id="specialization"
                                placeholder="e.g., Computer Science, Mathematics, Physics"
                                value={formData.specialization}
                                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                            />
                        </div>

                        {/* Qualifications */}
                        <div className="space-y-2">
                            <Label htmlFor="qualifications">Qualifications</Label>
                            <Input
                                id="qualifications"
                                placeholder="e.g., PhD Computer Science, M.Sc. Mathematics"
                                value={formData.qualifications}
                                onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                            />
                        </div>

                        {/* Office Location */}
                        <div className="space-y-2">
                            <Label htmlFor="officeLocation">Office Location</Label>
                            <Input
                                id="officeLocation"
                                placeholder="e.g., Science Building, Room 301"
                                value={formData.officeLocation}
                                onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
                            />
                        </div>

                        {/* Consultation Hours */}
                        <div className="space-y-2">
                            <Label htmlFor="consultationHours">Consultation Hours</Label>
                            <Input
                                id="consultationHours"
                                placeholder="e.g., Monday-Friday, 2PM-4PM"
                                value={formData.consultationHours}
                                onChange={(e) => setFormData({ ...formData, consultationHours: e.target.value })}
                            />
                        </div>

                        {/* Passwords */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Create Password *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    minLength={8}
                                    placeholder="At least 8 characters"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    required
                                    minLength={8}
                                    placeholder="Confirm your password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        {status === "error" && (
                            <Alert variant="destructive">
                                <AlertDescription>{errorMessage}</AlertDescription>
                            </Alert>
                        )}

                        {status === "success" && (
                            <Alert>
                                <AlertDescription>
                                    HOD registration successful! Redirecting to dashboard...
                                </AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-700"
                            disabled={status === "loading" || loadingDepartments || departments.length === 0}
                        >
                            {status === "loading" ? "Registering HOD..." : "Complete HOD Registration"}
                        </Button>

                        <p className="text-sm text-center text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/login" className="text-primary hover:underline font-medium">
                                Login here
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}