"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  School,
  Calendar,
  Hash,
  Lock,
  UserPlus
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// Unified Input Style matching the theme
const inputClassName = "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200";
const selectTriggerClassName = "flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"

interface Department {
  id: number
  name: string
  code: string
}

// Password generation function
const generateStrongPassword = (): string => {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*";

  const allChars = lowercase + uppercase + numbers + symbols;
  let password = "";

  // Ensure at least one of each character type
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export default function ICTRegistration() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    phone: "",
    password: "",
    confirmPassword: "",
    matricNumber: "",
    level: "",
    department: "",
    admissionDate: new Date().toISOString().split('T')[0]
  })
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingDepartments, setLoadingDepartments] = useState(true)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Fetch available departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true)
        const response = await fetch(`${API_BASE}/academics/departments/`)

        if (response.ok) {
          const data = await response.json()
          let departmentsArray: Department[] = []

          if (Array.isArray(data)) {
            departmentsArray = data
          } else if (data.results && Array.isArray(data.results)) {
            departmentsArray = data.results
          } else if (data.data && Array.isArray(data.data)) {
            departmentsArray = data.data
          }

          setDepartments(departmentsArray)
        } else {
          console.warn("Could not fetch departments")
          setError("Failed to load departments. Please try again later.")
        }
      } catch (err) {
        console.error("Failed to fetch departments:", err)
        setError("Failed to load departments. Please check your connection.")
      } finally {
        setLoadingDepartments(false)
      }
    }
    fetchDepartments()
  }, [])

  // Generate new password and populate both fields
  const handleGeneratePassword = () => {
    const newPassword = generateStrongPassword()
    setFormData(prev => ({
      ...prev,
      password: newPassword,
      confirmPassword: newPassword
    }))
  }

  // Copy login details to clipboard
  const handleCopyLoginDetails = async () => {
    const loginDetails = `Email: ${formData.email}\nPassword: ${formData.password}`
    try {
      await navigator.clipboard.writeText(loginDetails)
      alert("Login details copied to clipboard!")
    } catch (err) {
      console.error("Failed to copy login details:", err)
    }
  }

  // Generate username from email
  const handleEmailChange = (email: string) => {
    setFormData(prev => ({
      ...prev,
      email,
      username: email.split('@')[0] // Auto-generate username from email
    }))
  }

  // Generate matric number based on department and level
  const handleDepartmentChange = (departmentId: string) => {
    if (departmentId && formData.level) {
      const department = departments.find(dept => dept.id.toString() === departmentId)
      if (department) {
        const timestamp = Date.now().toString().slice(-4)
        const matricNumber = `${department.code}/${formData.level}/${timestamp}`
        setFormData(prev => ({
          ...prev,
          department: departmentId,
          matricNumber
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        department: departmentId
      }))
    }
  }

  const handleLevelChange = (level: string) => {
    if (level && formData.department) {
      const department = departments.find(dept => dept.id.toString() === formData.department)
      if (department) {
        const timestamp = Date.now().toString().slice(-4)
        const matricNumber = `${department.code}/${level}/${timestamp}`
        setFormData(prev => ({
          ...prev,
          level,
          matricNumber
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        level
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      if (!formData.department || !formData.level) {
        throw new Error("Please select both department and level")
      }

      if (formData.password.length < 8) {
        throw new Error("Password must be at least 8 characters long")
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match")
      }

      const registrationData = {
        user_data: {
          email: formData.email,
          username: formData.username,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone || "",
          role: "student",
          password: formData.password,
          password_confirm: formData.confirmPassword,
        },
        matric_number: formData.matricNumber,
        level: formData.level,
        department: parseInt(formData.department),
        admission_date: formData.admissionDate,
      }

      const response = await fetch(`${API_BASE}/auth/register/student/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const fieldErrors = []
        for (const [field, messages] of Object.entries(errorData)) {
          if (Array.isArray(messages)) {
            fieldErrors.push(`${field}: ${messages.join(', ')}`)
          } else if (typeof messages === 'object' && messages !== null) {
            for (const [subField, subMessages] of Object.entries(messages as Record<string, any>)) {
              const msgStr = Array.isArray(subMessages) ? subMessages.join(', ') : subMessages
              fieldErrors.push(`${field}.${subField}: ${msgStr}`)
            }
          } else {
            fieldErrors.push(`${field}: ${messages}`)
          }
        }
        throw new Error(fieldErrors.join('; '))
      }

      const result = await response.json()
      setSuccess("Account created successfully")

      // We DON'T reset the form immediately so the ICT officer can see/copy the credentials
      // Just clear password to be safe? No, they need to see it to give it to the student.

    } catch (err: any) {
      console.error("Registration error:", err)
      setError(err.message || "Failed to register student. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // If successful, show the success card with copy options
  if (success) {
    return (
      <DashboardLayout title="Student Registration" role="ict">
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <Card className="w-full max-w-md border-emerald-100 shadow-xl shadow-emerald-900/10">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl text-emerald-950">Registration Successful!</CardTitle>
              <CardDescription>
                Student account has been created and activated.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200/50 pb-2">
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Student Name</span>
                  <span className="text-sm font-medium text-emerald-900">{formData.firstName} {formData.lastName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-emerald-200/50 pb-2">
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Matric Number</span>
                  <span className="text-sm font-mono font-medium text-emerald-900">{formData.matricNumber}</span>
                </div>
                <div className="space-y-1 pt-1">
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block mb-1">Login Credentials</span>
                  <div className="bg-white rounded p-3 font-mono text-sm text-slate-700 border border-emerald-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span>{formData.email}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-slate-500">Pass:</span>
                      <span className="font-bold">{formData.password}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={handleCopyLoginDetails}
              >
                <Copy className="h-4 w-4 mr-2" /> Copy Credentials
              </Button>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSuccess("")
                  setFormData({
                    firstName: "", lastName: "", email: "", username: "", phone: "",
                    password: "", confirmPassword: "", matricNumber: "",
                    level: "", department: "", admissionDate: new Date().toISOString().split('T')[0]
                  })
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" /> Register Another Student
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Student Registration" role="ict">
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Register New Student</h2>
          <p className="text-slate-500">Create a new student account, assign department, and generate initial credentials.</p>
        </div>

        <Card className="border-slate-200 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6 md:p-8">
            {error && (
              <Alert className="mb-6 bg-red-50 text-red-900 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle>Registration Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* --- Section 1: Personal Details --- */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-teal-800 font-semibold border-b border-teal-100 pb-2">
                  <User className="w-5 h-5" />
                  <h3>Personal Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-slate-600">First Name <span className="text-red-500">*</span></Label>
                    <Input id="firstName" required placeholder="John" className={inputClassName}
                      value={formData.firstName} onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-slate-600">Last Name <span className="text-red-500">*</span></Label>
                    <Input id="lastName" required placeholder="Doe" className={inputClassName}
                      value={formData.lastName} onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-600">Email Address <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input id="email" type="email" required placeholder="student@college.edu" className={`${inputClassName} pl-9`}
                        value={formData.email} onChange={(e) => handleEmailChange(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-600">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input id="phone" type="tel" placeholder="+234..." className={`${inputClassName} pl-9`}
                        value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Section 2: Academic Info --- */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-teal-800 font-semibold border-b border-teal-100 pb-2">
                  <School className="w-5 h-5" />
                  <h3>Academic Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-slate-600">Department <span className="text-red-500">*</span></Label>
                    <Select required value={formData.department} onValueChange={handleDepartmentChange} disabled={loadingDepartments}>
                      <SelectTrigger className={selectTriggerClassName}>
                        <SelectValue placeholder={loadingDepartments ? "Loading..." : "Select Department"} />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name} ({dept.code})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="level" className="text-slate-600">Level <span className="text-red-500">*</span></Label>
                    <Select required value={formData.level} onValueChange={handleLevelChange}>
                      <SelectTrigger className={selectTriggerClassName}>
                        <SelectValue placeholder="Select Level" />
                      </SelectTrigger>
                      <SelectContent>
                        {["100", "200", "300", "400", "500"].map((lvl) => (
                          <SelectItem key={lvl} value={lvl}>{lvl} Level</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="matricNumber" className="text-slate-600">Matriculation Number</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input id="matricNumber" required placeholder="CSC/100/..." className={`${inputClassName} pl-9 font-mono bg-slate-50`}
                        value={formData.matricNumber} onChange={(e) => setFormData(prev => ({ ...prev, matricNumber: e.target.value }))}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 text-right">Auto-generated based on Department/Level</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admissionDate" className="text-slate-600">Admission Date <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input id="admissionDate" type="date" required className={`${inputClassName} pl-9`}
                        value={formData.admissionDate} onChange={(e) => setFormData(prev => ({ ...prev, admissionDate: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Section 3: Security --- */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-teal-800 font-semibold border-b border-teal-100 pb-2">
                  <Lock className="w-5 h-5" />
                  <h3>Account Security</h3>
                </div>

                <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-6 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-teal-900">Login Password</h4>
                      <p className="text-xs text-teal-700">Manually enter a password or generate a strong one automatically.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button" variant="outline" size="sm" onClick={handleGeneratePassword}
                        className="border-teal-200 text-teal-700 hover:bg-teal-100"
                      >
                        <RefreshCw className="h-3 w-3 mr-2" /> Generate Secure Password
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Input id="password" type={showPassword ? "text" : "password"} required minLength={8}
                          placeholder="Enter password" value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          className={`${inputClassName} pr-10 font-mono`}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} required minLength={8}
                          placeholder="Confirm password" value={formData.confirmPassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className={`${inputClassName} pr-10 font-mono`}
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" size="lg" className="w-full bg-teal-600 hover:bg-teal-700 text-lg shadow-lg shadow-teal-700/20" disabled={loading || loadingDepartments}>
                  {loading ? (
                    <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Registering Student...</>
                  ) : (
                    "Create Student Account"
                  )}
                </Button>
                <p className="text-xs text-slate-400 text-center mt-4">
                  By clicking Register, the account will be immediately active for login.
                </p>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}