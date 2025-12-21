
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, GraduationCap, Loader2, CheckCircle2 } from "lucide-react"
import Link from "next/link"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

interface Department {
  id: number
  name: string
  code: string
}

export default function StudentRegistration() {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
    confirmPassword: "",
    matricNumber: "",
    level: "100",
    department: "",
    admissionDate: "",
  })
  const [departments, setDepartments] = useState<Department[]>([])
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [loadingDepartments, setLoadingDepartments] = useState(true)

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
          // Fallback departments for UI testing if API fails
          setDepartments([
            { id: 1, name: "Computer Science", code: "CSC" },
            { id: 2, name: "Community Health", code: "CHE" },
            { id: 3, name: "Environmental Health", code: "EHS" }
          ])
        }
      } catch (error) {
        console.error("Failed to fetch departments:", error)
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

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match")
      setStatus("error")
      return
    }

    if (formData.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long")
      setStatus("error")
      return
    }

    if (!formData.department) {
      setErrorMessage("Please select a department")
      setStatus("error")
      return
    }

    try {
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
          const msgs = Array.isArray(messages) ? messages : [messages];
          fieldErrors.push(`${field}: ${msgs.join(', ')}`)
        }
        throw new Error(fieldErrors.join('; '))
      }

      const result = await response.json()

      // Store tokens and user data
      localStorage.setItem('token', result.access)
      localStorage.setItem('user', JSON.stringify(result.user))

      setStatus("success")

      setTimeout(() => {
        window.location.href = '/dashboard/student'
      }, 1500)

    } catch (error: any) {
      console.error("❌ Registration error:", error)
      setErrorMessage(error.message || "Registration failed")
      setStatus("error")
    }
  }

  const handleEmailChange = (email: string) => {
    setFormData(prev => ({
      ...prev,
      email,
      username: email.split('@')[0]
    }))
  }

  // --- UI RENDER ---
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-slate-50 to-emerald-50 p-4 relative overflow-hidden font-sans">

      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-teal-100 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-50" />

      <Card className="w-full max-w-lg relative z-10 border-teal-100 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="space-y-2 text-center pb-2">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-lg shadow-teal-700/20">
            <GraduationCap className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold text-teal-950">Student Registration</CardTitle>
          <CardDescription className="text-slate-500">
            Join the CHES Funtua academic community
          </CardDescription>
        </CardHeader>

        <CardContent>

          {status === "success" ? (
            <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="mx-auto h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Registration Successful!</h3>
                <p className="text-gray-500">Redirecting you to your dashboard...</p>
              </div>
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-teal-600" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Personal Info Group */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    required
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="focus-visible:ring-teal-500 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    required
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="focus-visible:ring-teal-500 bg-white"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="student@example.com"
                  value={formData.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="focus-visible:ring-teal-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="bg-slate-50 focus-visible:ring-teal-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+234..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="focus-visible:ring-teal-500 bg-white"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 my-4"></div>

              {/* Academic Info Group */}
              <div className="space-y-2">
                <Label htmlFor="matricNumber">Matriculation Number</Label>
                <Input
                  id="matricNumber"
                  required
                  placeholder="e.g. CHE/2024/001"
                  value={formData.matricNumber}
                  onChange={(e) => setFormData({ ...formData, matricNumber: e.target.value })}
                  className="focus-visible:ring-teal-500 bg-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <select
                    id="level"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  >
                    <option value="100">100 Level</option>
                    <option value="200">200 Level</option>
                    <option value="300">300 Level</option>
                    <option value="400">400 Level</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <select
                    id="department"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:opacity-50"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    disabled={loadingDepartments}
                  >
                    <option value="">Select Dept</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admissionDate">Admission Date</Label>
                <Input
                  id="admissionDate"
                  type="date"
                  required
                  value={formData.admissionDate}
                  onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                  className="focus-visible:ring-teal-500 bg-white"
                />
              </div>

              <div className="border-t border-slate-100 my-4"></div>

              {/* Password Group */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="focus-visible:ring-teal-500 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="focus-visible:ring-teal-500 bg-white"
                  />
                </div>
              </div>

              {status === "error" && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold shadow-md transition-all hover:scale-[1.01]"
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...</>
                ) : (
                  "Complete Registration"
                )}
              </Button>

              <div className="text-center pt-2">
                <Link href="/register" className="text-sm text-slate-500 hover:text-teal-700 flex items-center justify-center gap-1 transition-colors">
                  <ArrowLeft className="h-3 w-3" /> Back to options
                </Link>
                <div className="mt-4 text-xs text-slate-400">
                  Already have an account? <Link href="/login" className="text-teal-600 hover:underline font-medium">Login here</Link>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
