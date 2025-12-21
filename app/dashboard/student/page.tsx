"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Loader2, BookOpen, CheckCircle, GraduationCap,
  RefreshCw, User, Home, Settings, FileText, AlertTriangle, CreditCard, QrCode
} from "lucide-react"
import { registrationAPI, authAPI, academicsAPI, financeAPI } from "@/lib/api"
import { toast } from "sonner"

export default function StudentDashboard() {
  const { user } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<any>(null)

  // States
  const [regStatus, setRegStatus] = useState<any>(null)
  const [invoice, setInvoice] = useState<any>(null)
  const [myCourses, setMyCourses] = useState<any[]>([])
  const [availableCourses, setAvailableCourses] = useState<any[]>([])
  const [academicData, setAcademicData] = useState<any>(null)

  // Selection & Actions
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [paying, setPaying] = useState(false)

  // Sidebar
  const sidebarItems = [
    { href: "/dashboard/student", label: "Dashboard", icon: Home, active: true },
    { href: "/dashboard/student/courses", label: "My Courses", icon: BookOpen, active: false },
    { href: "/dashboard/student/grades", label: "Results", icon: GraduationCap, active: false },
    { href: "/dashboard/student/transcript", label: "Transcript", icon: FileText, active: false },
    { href: "/dashboard/student/exam-card", label: "Exam Card", icon: QrCode, active: false },
    { href: "/dashboard/student/payments", label: "Finances", icon: CreditCard, active: false },
    { href: "/settings", label: "Settings", icon: Settings, active: false },
  ]

  useEffect(() => {
    initData()
  }, [])

  const initData = async () => {
    setLoading(true)
    try {
      // 1. Get Profile
      const userRes = await authAPI.getCurrentUser()
      if (userRes) {
        let deptName = "Unassigned"
        if (userRes.profile?.department && typeof userRes.profile.department === 'object') {
          deptName = userRes.profile.department.name
        } else if (userRes.profile?.department) {
          deptName = `Dept ID: ${userRes.profile.department}`
        }

        setStudent({
          name: userRes.user.full_name || userRes.user.first_name,
          matric: userRes.profile?.matric_number,
          level: userRes.profile?.level,
          dept: deptName
        })
      }

      // 2. Check Registration Status (Includes Fee Check)
      const statusRes = await registrationAPI.getRegistrationStatus()
      if (statusRes.error) {
        console.error("Registration Status Error:", statusRes.error)
      }
      setRegStatus(statusRes.registration_status || {})

      // 3. If Fees NOT Paid, Get Invoice
      // We check explicit false to handle null/undefined safely, defaulting to paid if undefined to avoid blocking on error
      const feesPaid = statusRes.registration_status?.has_paid_fees === true

      if (!feesPaid) {
        const invRes = await financeAPI.getCurrentInvoice()
        if (invRes && !invRes.error) setInvoice(invRes)
      } else {
        // Only fetch courses if fees paid
        const availRes = await registrationAPI.getAvailableCoursesForRegistration()
        setAvailableCourses(Array.isArray(availRes) ? availRes : [])
      }

      // 4. Get My Schedule
      const scheduleRes = await registrationAPI.getCurrentRegistrations()
      setMyCourses(Array.isArray(scheduleRes) ? scheduleRes : [])

      // 5. Academic Data
      const historyRes = await academicsAPI.getStudentHistory()
      setAcademicData(historyRes)

    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // --- Payment Handler ---
  const handlePayNow = async () => {
    if (!invoice) return toast.error("Invoice not found")

    setPaying(true)
    try {
      // Updated to use 'payments' (plural) to match the file structure
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const callbackUrl = `${origin}/dashboard/student/payments/verify`

      const payload = {
        invoice_id: invoice.id,
        amount: Number(invoice.balance), // Pay remaining balance
        email: user?.email || "",
        callback_url: callbackUrl
      }

      const res = await financeAPI.initializePayment(payload)

      if (res.authorization_url) {
        window.location.href = res.authorization_url
      } else {
        toast.error("Payment initialization failed")
      }
    } catch (e) {
      console.error(e)
      toast.error("Payment Error")
    } finally {
      setPaying(false)
    }
  }

  // --- Registration Handler ---
  const handleRegister = async () => {
    if (selectedIds.length === 0) return toast.error("Select courses first")
    setSubmitting(true)
    try {
      const res = await registrationAPI.registerCourses(selectedIds)

      // Handle success structure
      if (res && (res.successful?.length > 0 || res.message?.includes('processed'))) {
        toast.success(`Registration processed!`)
        setSelectedIds([])
        await initData()
      } else if (res.errors && res.errors.length > 0) {
        toast.error(res.errors[0])
      } else {
        toast.error("Registration failed")
      }
    } catch (e) {
      toast.error("Network error")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDrop = async (regId: number) => {
    if (!confirm("Drop this course?")) return
    try {
      await registrationAPI.dropCourse(regId)
      toast.success("Dropped successfully")
      initData()
    } catch (e) { toast.error("Failed to drop") }
  }

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  if (loading) {
    return (
      <DashboardLayout title="Student Portal" role="student" sidebarItems={sidebarItems}>
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
        </div>
      </DashboardLayout>
    )
  }

  const totalCredits = myCourses.reduce((sum, item) => sum + (item.course_credits || 0), 0)
  const hasPaid = regStatus?.has_paid_fees

  return (
    <DashboardLayout title="Student Dashboard" role="student" sidebarItems={sidebarItems}>
      <div className="space-y-8 max-w-6xl mx-auto">

        {/* Profile Header */}
        <Card className="bg-white border-none shadow-lg overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-500 to-emerald-500"></div>
          <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-5">
                <div className="h-20 w-20 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 border-2 border-teal-100 shadow-sm">
                  <User className="h-10 w-10" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome, {student?.name}</h2>
                  <div className="text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-2 mt-2">
                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded text-slate-700 border border-slate-100 font-mono text-xs">
                      {student?.matric}
                    </span>
                    <span className="flex items-center gap-1">• {student?.dept}</span>
                    <span className="flex items-center gap-1">• Level {student?.level}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100">
              <div className="text-center p-3 rounded-xl bg-slate-50">
                <div className="text-2xl font-bold text-slate-900">{myCourses.length}</div>
                <div className="text-xs text-slate-500 font-medium uppercase mt-1">Enrolled</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-50">
                <div className="text-2xl font-bold text-teal-600">{totalCredits}</div>
                <div className="text-xs text-slate-500 font-medium uppercase mt-1">Total Units</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-50 cursor-pointer" onClick={() => router.push('/dashboard/student/grades')}>
                <div className="text-2xl font-bold text-purple-600">{academicData?.current_cgpa || "0.00"}</div>
                <div className="text-xs text-slate-500 font-medium uppercase mt-1 flex items-center gap-1 justify-center">
                  CGPA
                </div>
              </div>
              <div className={`text-center p-3 rounded-xl ${hasPaid ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className={`text-xl font-bold ${hasPaid ? 'text-green-600' : 'text-red-600'}`}>
                  {hasPaid ? 'PAID' : 'UNPAID'}
                </div>
                <div className="text-xs text-slate-500 font-medium uppercase mt-1">Fee Status</div>
              </div>
            </div>
          </div>
        </Card>

        {/* --- MAIN CONTENT --- */}
        <div className="grid lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN: Registration OR Payment Blocker */}
          <div className="lg:col-span-7 space-y-4">

            {!hasPaid ? (
              // 🔴 PAYMENT REQUIRED BLOCKER
              <Card className="border-red-200 shadow-sm bg-red-50/50">
                <CardHeader>
                  <CardTitle className="text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" /> Outstanding Fees
                  </CardTitle>
                  <CardDescription>
                    You must pay your tuition fees before you can register courses.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-red-100 shadow-sm">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Invoice Number:</span>
                      <span className="font-mono font-medium">{invoice?.invoice_number || "Generating..."}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Description:</span>
                      <span>{invoice?.description || "Tuition Fee"}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                      <span>Amount Due:</span>
                      <span className="text-red-600">₦{Number(invoice?.balance || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 text-lg shadow-md"
                    onClick={handlePayNow}
                    disabled={paying || !invoice}
                  >
                    {paying ? <Loader2 className="animate-spin mr-2" /> : <CreditCard className="mr-2" />}
                    Pay With Paystack
                  </Button>
                  <p className="text-xs text-center text-gray-500">
                    Secured by Paystack. Instant activation upon payment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              // 🟢 COURSE REGISTRATION (Available if Paid)
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                    <BookOpen className="h-5 w-5 text-teal-600" /> Course Registration
                  </h2>
                  <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100">{availableCourses.length} Available</Badge>
                </div>

                <Card className="border-slate-200 shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                      {availableCourses.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          No courses available for registration.
                        </div>
                      ) : (
                        availableCourses.map(course => (
                          <div
                            key={course.id}
                            className={`p-5 flex items-start gap-4 transition-all cursor-pointer ${selectedIds.includes(course.id) ? 'bg-teal-50/60' : 'hover:bg-slate-50'}`}
                            onClick={() => toggleSelection(course.id)}
                          >
                            <Checkbox
                              checked={selectedIds.includes(course.id)}
                              onCheckedChange={() => toggleSelection(course.id)}
                              className="mt-1 border-slate-300 data-[state=checked]:bg-teal-600"
                            />
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-gray-900">{course.course_code}</span>
                                <Badge variant="outline" className="bg-white text-slate-600 font-normal">{course.course_credits} Units</Badge>
                              </div>
                              <p className="text-sm text-gray-700 font-medium mb-1">{course.course_title}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                <User className="h-3 w-3" />
                                {course.lecturer_name || "TBA"}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                      <Button
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                        disabled={selectedIds.length === 0 || submitting}
                        onClick={handleRegister}
                      >
                        {submitting ? <Loader2 className="animate-spin mr-2" /> : null}
                        Register Selected ({selectedIds.length})
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* RIGHT COLUMN: My Schedule */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                <CheckCircle className="h-5 w-5 text-emerald-600" /> My Schedule
              </h2>
              <Button variant="ghost" size="icon" onClick={initData} className="text-gray-400 hover:text-gray-600">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <Card className="border-emerald-100/50 shadow-sm overflow-hidden min-h-[200px]">
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {myCourses.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Your schedule is empty.</p>
                    </div>
                  ) : (
                    myCourses.map(reg => (
                      <div key={reg.id} className="p-4 hover:bg-slate-50 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-2">
                              {reg.course_code}
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                                {reg.course_credits}u
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 font-medium mt-0.5">{reg.course_title}</div>
                          </div>
                          <button
                            className="text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            onClick={() => handleDrop(reg.id)}
                          >
                            Drop
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <User className="h-3 w-3" /> {reg.lecturer_name || "TBA"}
                          </div>
                          <Badge variant="outline" className="text-[10px] h-5 bg-emerald-50 text-emerald-700 border-emerald-200">Enrolled</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {myCourses.length > 0 && (
                  <div className="p-3 bg-emerald-50/30 border-t border-emerald-100 text-center">
                    <p className="text-xs text-emerald-700 font-medium">
                      Total Registered Units: {totalCredits}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}