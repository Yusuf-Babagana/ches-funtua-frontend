
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Users, Building2, UserCircle, Briefcase, GraduationCap, AlertCircle, Loader2, School } from "lucide-react"
import Link from "next/link"

// Unified Input Style matching the Login Portal vibe
const inputClassName = "flex h-10 w-full rounded-md border border-slate-200 bg-white/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:bg-white";
const selectTriggerClassName = "flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white/50 px-3 py-2 text-sm ring-offset-background placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:bg-white"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

interface Department {
  id: number
  name: string
  code: string
}

export default function StaffRegistration() {
  const [formData, setFormData] = useState({
    // User data
    email: "",
    username: "",
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "",

    // Staff profile data
    staffId: "",
    department: "",
    position: "",
    officeLocation: "",

    // Lecturer-specific fields
    designation: "",
    specialization: "",
    qualifications: "",
    consultationHours: "",
    isHod: false,
  })

  const [departments, setDepartments] = useState<Department[]>([])
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [debugInfo, setDebugInfo] = useState("")
  const [loadingDepartments, setLoadingDepartments] = useState(true)

  // Fetch departments for lecturers
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
    setDebugInfo("")

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match")
      setStatus("error")
      return
    }

    if (!formData.email || !formData.username || !formData.firstName || !formData.lastName ||
      !formData.password || !formData.role || !formData.staffId) {
      setErrorMessage("Please fill in all required fields")
      setStatus("error")
      return
    }

    if (formData.role !== 'lecturer' && !formData.position) {
      setErrorMessage("Position is required for staff")
      setStatus("error")
      return
    }

    if (formData.role === 'lecturer' && !formData.department) {
      setErrorMessage("Department is required for lecturers")
      setStatus("error")
      return
    }

    try {
      const userData = {
        email: formData.email,
        username: formData.username,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone || "",
        role: formData.role,
        password: formData.password,
        password_confirm: formData.confirmPassword,
      }

      let endpoint = ''
      let requestData = {}

      if (formData.role === 'lecturer') {
        endpoint = '/auth/register/lecturer/'
        requestData = {
          user_data: userData,
          staff_id: formData.staffId,
          department: parseInt(formData.department),
          designation: formData.designation || 'lecturer_1',
          specialization: formData.specialization || "",
          qualifications: formData.qualifications || "",
          office_location: formData.officeLocation || "",
          consultation_hours: formData.consultationHours || "",
          is_hod: formData.isHod,
        }
      } else {
        endpoint = '/auth/register/staff/'
        requestData = {
          ...userData,
          staff_id: formData.staffId,
          department: formData.department || "",
          position: formData.position,
          office_location: formData.officeLocation || "",
        }
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
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

      // Auto-Login Logic
      const loginResponse = await fetch(`${API_BASE}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      })

      if (loginResponse.ok) {
        const loginData = await loginResponse.json()
        localStorage.setItem('token', loginData.access)
        localStorage.setItem('user', JSON.stringify(loginData.user))

        const roleDashboardMap: { [key: string]: string } = {
          'hod': '/dashboard/hod',
          'registrar': '/dashboard/registrar',
          'bursar': '/dashboard/bursar',
          'desk-officer': '/dashboard/desk-officer',
          'ict': '/dashboard/ict',
          'exam-officer': '/dashboard/exam-officer',
          'super-admin': '/dashboard/super-admin',
          'lecturer': '/dashboard/lecturer'
        }
        const dashboardPath = roleDashboardMap[formData.role] || '/dashboard/staff'
        window.location.href = dashboardPath
      } else {
        if (loginResponse.status === 401) {
          setErrorMessage("Registration successful! Account pending approval.")
          setStatus("success")
          return
        }
        setErrorMessage("Registration successful! Please login to continue.")
        setTimeout(() => window.location.href = '/login/staff', 2000)
      }

    } catch (error: any) {
      setErrorMessage(error.message || "Registration failed. Please try again.")
      setDebugInfo(`Error: ${JSON.stringify(error, null, 2)}`)
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

  const handleRoleChange = (role: string) => {
    const staffIdPrefix = role === 'lecturer' ? 'LEC' :
      role === 'hod' ? 'HOD' :
        role === 'registrar' ? 'REG' :
          role === 'bursar' ? 'BUR' :
            role === 'ict' ? 'ICT' :
              role === 'exam-officer' ? 'EXAM' : 'STAFF'

    setFormData(prev => ({
      ...prev,
      role,
      staffId: `${staffIdPrefix}/${Date.now().toString().slice(-4)}`,
      department: role === 'lecturer' ? prev.department : "",
    }))
  }

  const fillTestData = () => {
    const randomSuffix = Date.now().toString().slice(-4);
    const currentRole = formData.role || "ict";
    let prefix = "STAFF";
    if (currentRole === 'ict') prefix = "ICT";
    else if (currentRole === 'registrar') prefix = "REG";
    else if (currentRole === 'bursar') prefix = "BUR";

    const testData = {
      email: `staff${randomSuffix}@college.edu`,
      username: `staff${randomSuffix}`,
      firstName: "Test",
      lastName: "Staff",
      phone: "+2348012345678",
      password: "SecurePass123!",
      confirmPassword: "SecurePass123!",
      role: currentRole,
      staffId: `${prefix}/${randomSuffix}`,
      department: "",
      position: "Senior Officer",
      officeLocation: "Main Building, Room 101",
      designation: "",
      specialization: "",
      qualifications: "",
      consultationHours: "",
      isHod: false
    }

    if (formData.role === 'lecturer' && departments.length > 0) {
      testData.department = departments[0].id.toString()
      testData.designation = "lecturer_1"
      testData.specialization = "Computer Science"
      testData.qualifications = "M.Sc. Computer Science"
      testData.consultationHours = "Mon-Wed, 10AM-12PM"
      testData.staffId = `LEC/${randomSuffix}`
    }

    setFormData(testData)
  }

  const isLecturer = formData.role === 'lecturer'

  return (
    // Background matches Login Portal exactly
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-teal-50 via-slate-50 to-emerald-50 p-4 relative overflow-hidden">

      {/* Abstract Background Decoration */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-3xl relative z-10 my-10">

        {/* Brand Header - Matching Login Style */}
        <div className="text-center mb-8 space-y-2">
          <Link href="/" className="inline-flex mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-xl shadow-teal-700/20 mb-6 hover:bg-teal-800 transition-colors">
            <School className="h-8 w-8" />
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-teal-950 tracking-tight">
            Staff Registration
          </h1>
          <p className="text-slate-500 text-lg">
            Create your administrative or academic account
          </p>
        </div>

        <Card className="border-2 border-white/50 bg-white/80 backdrop-blur-sm shadow-xl shadow-teal-900/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <Link href="/login/staff" className="flex items-center text-sm text-slate-500 hover:text-teal-700 transition-colors">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Login
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={fillTestData}
              className="text-xs text-teal-600 hover:text-teal-800 hover:bg-teal-50"
            >
              ✨ Auto-Fill Data
            </Button>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* --- Section 1: Personal Information --- */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-teal-800 font-semibold border-b border-teal-100 pb-2">
                  <UserCircle className="w-5 h-5" />
                  <h3>Personal Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-slate-600">First Name</Label>
                    <Input id="firstName" required placeholder="Jane" className={inputClassName}
                      value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-slate-600">Last Name</Label>
                    <Input id="lastName" required placeholder="Doe" className={inputClassName}
                      value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-600">Email Address</Label>
                    <Input id="email" type="email" required placeholder="staff@college.edu" className={inputClassName}
                      value={formData.email} onChange={(e) => handleEmailChange(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-600">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="+234..." className={inputClassName}
                      value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* --- Section 2: Account Setup --- */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-teal-800 font-semibold border-b border-teal-100 pb-2">
                  <Building2 className="w-5 h-5" />
                  <h3>Role & Account</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-slate-600">Role / Job Title</Label>
                    <Select required value={formData.role} onValueChange={handleRoleChange}>
                      <SelectTrigger className={selectTriggerClassName}>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lecturer">Lecturer</SelectItem>
                        <SelectItem value="hod">Head of Department (HOD)</SelectItem>
                        <SelectItem value="registrar">Registrar</SelectItem>
                        <SelectItem value="bursar">Bursar</SelectItem>
                        <SelectItem value="ict">ICT Officer</SelectItem>
                        <SelectItem value="exam-officer">Exam Officer</SelectItem>
                        <SelectItem value="desk-officer">Desk Officer</SelectItem>
                        <SelectItem value="super-admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staffId" className="text-slate-600">Staff ID</Label>
                    <Input id="staffId" required placeholder="Generated ID..." className={`${inputClassName} font-mono bg-slate-50`}
                      value={formData.staffId} onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position" className="text-slate-600">Official Position</Label>
                  <Input id="position" required placeholder={isLecturer ? "e.g. Senior Lecturer" : "e.g. System Administrator"} className={inputClassName}
                    value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="officeLocation" className="text-slate-600">Office Location</Label>
                  <Input id="officeLocation" placeholder="e.g. Block A, Room 302" className={inputClassName}
                    value={formData.officeLocation} onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
                  />
                </div>
              </div>

              {/* --- Section 3: Lecturer Specific (Animated) --- */}
              {isLecturer && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold border-b border-emerald-200 pb-2">
                    <GraduationCap className="w-5 h-5" />
                    <h3>Academic Profile</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department" className="text-emerald-900">Department</Label>
                      {loadingDepartments ? (
                        <div className="flex items-center space-x-2 h-10 px-3 border rounded-md bg-white/50 text-sm text-slate-500">
                          <Loader2 className="h-3 w-3 animate-spin" /> <span>Loading...</span>
                        </div>
                      ) : (
                        <select
                          id="department"
                          required
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 transition-all hover:bg-white"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        >
                          <option value="">Select Department</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="designation" className="text-emerald-900">Academic Rank</Label>
                      <Select value={formData.designation} onValueChange={(val) => setFormData({ ...formData, designation: val })}>
                        <SelectTrigger className="bg-white/50 border-slate-200 focus:ring-emerald-600"><SelectValue placeholder="Select Rank" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professor">Professor</SelectItem>
                          <SelectItem value="associate_professor">Associate Professor</SelectItem>
                          <SelectItem value="senior_lecturer">Senior Lecturer</SelectItem>
                          <SelectItem value="lecturer_1">Lecturer I</SelectItem>
                          <SelectItem value="lecturer_2">Lecturer II</SelectItem>
                          <SelectItem value="assistant_lecturer">Assistant Lecturer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="specialization" className="text-emerald-900">Specialization</Label>
                      <Input id="specialization" placeholder="e.g. AI & Robotics" className="bg-white/50 border-slate-200 focus-visible:ring-emerald-600 hover:bg-white"
                        value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="qualifications" className="text-emerald-900">Qualifications</Label>
                      <Input id="qualifications" placeholder="e.g. PhD, M.Sc" className="bg-white/50 border-slate-200 focus-visible:ring-emerald-600 hover:bg-white"
                        value={formData.qualifications} onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="consultationHours" className="text-emerald-900">Consultation Hours</Label>
                    <Input id="consultationHours" placeholder="e.g. Mon 10am-12pm" className="bg-white/50 border-slate-200 focus-visible:ring-emerald-600 hover:bg-white"
                      value={formData.consultationHours} onChange={(e) => setFormData({ ...formData, consultationHours: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="isHod"
                      className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-600"
                      checked={formData.isHod}
                      onChange={(e) => setFormData({ ...formData, isHod: e.target.checked })}
                    />
                    <Label htmlFor="isHod" className="cursor-pointer font-medium text-emerald-800">
                      Assign as Head of Department (HOD)
                    </Label>
                  </div>
                </div>
              )}

              {/* --- Section 4: Security --- */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-teal-800 font-semibold border-b border-teal-100 pb-2">
                  <Briefcase className="w-5 h-5" />
                  <h3>Security</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-slate-600">Username</Label>
                    <Input id="username" required value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className={`${inputClassName} bg-slate-50`}
                    />
                  </div>
                  <div className="space-y-2">
                    {/* Spacer */}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-600">Password</Label>
                    <Input id="password" type="password" required minLength={8} placeholder="••••••••" className={inputClassName}
                      value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-slate-600">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" required minLength={8} placeholder="••••••••" className={inputClassName}
                      value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Error Handling */}
              {status === "error" && (
                <Alert variant="destructive" className="animate-in fade-in zoom-in-95 duration-300 border-red-200 bg-red-50 text-red-800">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle>Registration Failed</AlertTitle>
                  <AlertDescription className="mt-1">{errorMessage}</AlertDescription>
                  {debugInfo && (
                    <details className="mt-2 text-xs opacity-80 cursor-pointer">
                      <summary>Debug Info</summary>
                      <pre className="mt-1 whitespace-pre-wrap">{debugInfo}</pre>
                    </details>
                  )}
                </Alert>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-lg shadow-lg shadow-teal-700/20 hover:shadow-xl hover:shadow-teal-700/30 transition-all duration-300"
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating Account...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-slate-100 bg-slate-50/50 p-6 rounded-b-xl">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login/staff" className="text-teal-700 hover:text-teal-800 hover:underline font-bold transition-colors">
                Login here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}