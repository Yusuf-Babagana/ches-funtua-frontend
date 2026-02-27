"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Loader2, BookOpen, CheckCircle, GraduationCap,
  RefreshCw, User, Home, Settings, FileText,
  AlertTriangle, CreditCard, Wallet, Lock, Printer
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

  // Sidebar Configuration
  const sidebarItems = [
    { href: "/dashboard/student", label: "Dashboard", icon: Home, active: true },
    { href: "/dashboard/student/courses", label: "My Courses", icon: BookOpen, active: false },
    { href: "/dashboard/student/grades", label: "Results", icon: GraduationCap, active: false },
    { href: "/dashboard/student/transcript", label: "Transcript", icon: FileText, active: false },
    { href: "/dashboard/student/exam-card", label: "Exam Card", icon: require("lucide-react").QrCode, active: false },
    { href: "/dashboard/student/payments", label: "Finances", icon: CreditCard, active: false },
    { href: "/dashboard/student/settings", label: "Settings", icon: Settings, active: false },
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
        } else if (typeof userRes.profile?.department === 'string') {
          // If the backend sent a straightforward string name
          deptName = userRes.profile.department;
        } else if (userRes.profile?.department_name) {
          // Alternative fallback field
          deptName = userRes.profile.department_name;
        } else if (typeof userRes.profile?.department === 'number' || !isNaN(Number(userRes.profile?.department))) {
          // Avoid showing exactly "Dept ID: 1". 
          // Ideally fetch the name, but gracefully fallback to pending if just an ID is sent
          deptName = "Department Assignment Pending"
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
      const statusData = statusRes.registration_status || {}
      setRegStatus(statusData)

      // 3. Logic: Fetch Invoice (Always check financial status as fallback/source of truth)
      const invRes = await financeAPI.getCurrentInvoice()
      const currentInvoice = (invRes && !invRes.error) ? invRes : null
      setInvoice(currentInvoice)

      // The backend 'has_paid_fees' is strictly true ONLY if status == 'paid' (balance <= 0)
      // Fallback: If registration status is lagging, check invoice balance
      const feesFullyPaid = statusData.has_paid_fees === true || (currentInvoice && Number(currentInvoice.balance) <= 0)

      if (!feesFullyPaid) {
        // Still show invoice if not fully paid (handled above)
      } else {
        // Only fetch courses if fees FULLY paid
        const availRes = await registrationAPI.getAvailableCoursesForRegistration()
        let courses = []
        if (Array.isArray(availRes)) courses = availRes
        else if (availRes && availRes.results) courses = availRes.results
        setAvailableCourses(courses)
      }

      // 4. Get My Schedule
      const scheduleRes = await registrationAPI.getCurrentRegistrations()
      if (Array.isArray(scheduleRes)) setMyCourses(scheduleRes)
      else if (scheduleRes && scheduleRes.results) setMyCourses(scheduleRes.results)
      else setMyCourses([])

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
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const callbackUrl = `${origin}/dashboard/student/payments/verify`

      // Pay the remaining balance
      const amountToPay = Number(invoice.balance) > 0 ? Number(invoice.balance) : Number(invoice.amount)

      const payload = {
        invoice_id: invoice.id,
        amount: amountToPay,
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

      if (res && (res.successful?.length > 0 || res.message?.includes('processed') || (!res.error && !res.errors))) {
        toast.success(`Registration successful!`)
        setSelectedIds([])
        await initData()
      } else {
        const errorMsg = res?.error?.error || res?.error?.detail || res?.errors?.[0] || "Registration failed"
        toast.error(errorMsg)
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

  const formatCurrency = (val: any) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(val) || 0)
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

  // ✅ Robust Payment Check: Check registration status AND invoice balance
  const hasPaid = regStatus?.has_paid_fees || (invoice && Number(invoice.balance) <= 0)

  // Calculate Payment Progress
  const totalFee = invoice ? Number(invoice.amount) : 0
  const paidFee = invoice ? Number(invoice.amount_paid) : 0
  const balanceFee = invoice ? Number(invoice.balance) : 0
  const payProgress = totalFee > 0 ? (paidFee / totalFee) * 100 : 0

  const paymentStatus = hasPaid ? 'Paid' : (paidFee > 0 ? 'Partial' : 'Unpaid')

  return (
    <DashboardLayout title="Student Dashboard" role="student" sidebarItems={sidebarItems}>
      <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">

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

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={initData}
                  className="bg-white hover:bg-teal-50 border-teal-100 text-teal-700 font-semibold h-10 px-4"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Status
                </Button>
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
              <div className="text-center p-3 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => router.push('/dashboard/student/grades')}>
                <div className="text-2xl font-bold text-purple-600">{academicData?.current_cgpa || "0.00"}</div>
                <div className="text-xs text-slate-500 font-medium uppercase mt-1">CGPA</div>
              </div>
              <div className={`text-center p-3 rounded-xl ${paymentStatus === 'Paid' ? 'bg-green-50' :
                paymentStatus === 'Partial' ? 'bg-orange-50' : 'bg-red-50'
                }`}>
                <div className={`text-xl font-bold ${paymentStatus === 'Paid' ? 'text-green-600' :
                  paymentStatus === 'Partial' ? 'text-orange-600' : 'text-red-600'
                  }`}>
                  {paymentStatus.toUpperCase()}
                </div>
                <div className="text-xs text-slate-500 font-medium uppercase mt-1">Fee Status</div>
              </div>
            </div>
          </div>
        </Card>

        {/* --- MAIN CONTENT --- */}
        <div className="grid lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN: Registration OR Payment Blocker */}
          <div className="lg:col-span-7 space-y-6">

            {!hasPaid ? (
              // 🔴 PAYMENT REQUIRED BLOCKER (With Installment Info)
              <Card className={`border shadow-sm ${paidFee > 0 ? 'bg-orange-50/30 border-orange-200' : 'bg-red-50/30 border-red-200'}`}>
                <CardHeader>
                  <CardTitle className={`${paidFee > 0 ? 'text-orange-700' : 'text-red-700'} flex items-center gap-2`}>
                    <AlertTriangle className="h-5 w-5" />
                    {paidFee > 0 ? "Fee Payment Incomplete" : "Outstanding Fees"}
                  </CardTitle>
                  <CardDescription>
                    {paidFee > 0
                      ? "You have made a partial payment. Complete the balance to register courses."
                      : "You must pay your tuition fees before you can register courses."
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                      <span className="text-sm text-gray-500 font-medium">Invoice No.</span>
                      <span className="font-mono text-sm font-bold text-gray-700">{invoice?.invoice_number || "..."}</span>
                    </div>

                    {/* Payment Breakdown */}
                    <div className="grid grid-cols-3 gap-2 text-center py-2">
                      <div>
                        <p className="text-[10px] uppercase text-gray-400 font-bold">Total Fee</p>
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(totalFee)}</p>
                      </div>
                      <div className="border-l border-r border-slate-100">
                        <p className="text-[10px] uppercase text-gray-400 font-bold">Paid</p>
                        <p className="text-sm font-bold text-green-600">{formatCurrency(paidFee)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-gray-400 font-bold">Balance</p>
                        <p className="text-sm font-bold text-red-600">{formatCurrency(balanceFee)}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-teal-700">{payProgress.toFixed(0)}% Paid</span>
                        <span className="text-gray-400">{formatCurrency(balanceFee)} Remaining</span>
                      </div>
                      <Progress value={payProgress} className="h-2 bg-slate-100" />
                    </div>
                  </div>

                  <Button
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 text-base shadow-md transition-all hover:scale-[1.01]"
                    onClick={handlePayNow}
                    disabled={paying || !invoice}
                  >
                    {paying ? <Loader2 className="animate-spin mr-2" /> : <CreditCard className="mr-2 h-5 w-5" />}
                    Pay Balance: {formatCurrency(balanceFee)}
                  </Button>

                  <div className="text-center">
                    <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                      <Lock className="h-3 w-3" /> Secured by Paystack
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      For alternative payment arrangements, please contact the Bursary.
                    </p>
                  </div>
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
                        <div className="p-12 text-center text-gray-500">
                          <BookOpen className="h-10 w-10 mx-auto mb-3 text-slate-200" />
                          <p>No courses available for registration.</p>
                          <p className="text-xs mt-1 text-slate-400">You may have registered all courses for this session.</p>
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
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                                <span className="font-medium text-teal-700">{course.department_name}</span>
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {course.lecturer_name || "TBA"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                      <Button
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-sm"
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
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard/student/print-schedule')}
                  className="bg-white border-teal-100 text-teal-700 hover:bg-teal-50"
                  disabled={myCourses.length === 0}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Schedule
                </Button>
                <Button variant="ghost" size="icon" onClick={initData} className="text-gray-400 hover:text-gray-600">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Card className="border-emerald-100/50 shadow-sm overflow-hidden min-h-[300px] flex flex-col">
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="divide-y divide-slate-100 flex-1">
                  {myCourses.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center h-full">
                      <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <GraduationCap className="h-6 w-6 opacity-40" />
                      </div>
                      <p className="font-medium text-gray-600">Your schedule is empty.</p>
                      <p className="text-sm mt-1">Select courses from the left to register.</p>
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
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-teal-700">{reg.department_name}</span>
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                              <User className="h-3 w-3" /> {reg.lecturer_name || "TBA"}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] h-5 bg-emerald-50 text-emerald-700 border-emerald-200">Enrolled</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {myCourses.length > 0 && (
                  <div className="p-3 bg-emerald-50/30 border-t border-emerald-100 text-center mt-auto">
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