
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  Wallet,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  CreditCard,
  FileText,
  Loader2,
  RefreshCw,
  Receipt,
  ShieldCheck,
  ChevronRight,
  Home,
  BookOpen,
  GraduationCap
} from "lucide-react"
import { paymentAPI, academicsAPI } from "@/lib/api"
import { toast } from "sonner"

// --- Interfaces ---
interface Invoice {
  id: number
  invoice_number: string
  student: { id: number; name: string; matric_number: string }
  amount: string
  amount_paid: string
  balance: string
  status: string
  due_date: string
  session: string
  semester: string
  description: string
  created_at: string
}

interface Payment {
  id: number
  reference_id: string
  amount: string
  status: string
  payment_method: string
  description: string
  payment_date: string
  paystack_reference: string
  verified_by_name: string
}

interface CurrentSemester {
  id: number
  session: string
  semester: string
  is_current: boolean
  is_registration_active: boolean
  registration_deadline: string
  start_date: string
  end_date: string
}

export default function StudentPaymentsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [currentSemester, setCurrentSemester] = useState<CurrentSemester | null>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([])

  const [loadingStates, setLoadingStates] = useState({
    semester: true,
    invoice: true,
    payments: true,
    allInvoices: true
  })

  const [processingPayment, setProcessingPayment] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<string>("")

  // --- 1. AUTH CHECK ---
  useEffect(() => {
    if (!loading && user) {
      if (user.role !== "student") {
        router.push("/login")
      } else {
        fetchPaymentData()
      }
    }
  }, [user, loading, router])

  // --- 2. FETCH DATA ---
  const fetchPaymentData = async () => {
    setLoadingStates({
      semester: true,
      invoice: true,
      payments: true,
      allInvoices: true
    })

    await Promise.all([
      fetchCurrentSemester(),
      fetchCurrentInvoice(),
      fetchPaymentHistory(),
      fetchAllInvoices()
    ])
  }

  const fetchCurrentSemester = async () => {
    try {
      const response = await academicsAPI.getCurrentSemester()
      if (response && !response.error) setCurrentSemester(response)
    } catch (error) { console.error(error) }
    finally { setLoadingStates(prev => ({ ...prev, semester: false })) }
  }

  const fetchCurrentInvoice = async () => {
    try {
      const response = await paymentAPI.getCurrentInvoice()
      if (response && !response.error) {
        setInvoice(response)
        // Auto-select the current/pending invoice if available
        if (response.status !== 'paid') {
          setSelectedInvoice(response)
          setPaymentAmount(response.balance)
        }
      }
    } catch (error) { console.error(error) }
    finally { setLoadingStates(prev => ({ ...prev, invoice: false })) }
  }

  const fetchPaymentHistory = async () => {
    try {
      const response = await paymentAPI.getPaymentHistory()
      if (response && Array.isArray(response)) setPayments(response)
    } catch (error) { console.error(error) }
    finally { setLoadingStates(prev => ({ ...prev, payments: false })) }
  }

  const fetchAllInvoices = async () => {
    try {
      const response = await paymentAPI.getInvoices()
      if (response && Array.isArray(response)) setAllInvoices(response)
    } catch (error) { console.error(error) }
    finally { setLoadingStates(prev => ({ ...prev, allInvoices: false })) }
  }

  // --- ACTIONS ---
  const handleInvoiceSelect = (inv: Invoice) => {
    setSelectedInvoice(inv)
    setPaymentAmount(inv.balance)
  }

  const handleMakePayment = async () => {
    if (!selectedInvoice || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error("Please select an invoice and enter a valid amount")
      return
    }

    const amount = parseFloat(paymentAmount)
    const balance = parseFloat(selectedInvoice.balance)

    if (amount > balance) {
      toast.error(`Payment amount cannot exceed invoice balance (₦${balance.toLocaleString()})`)
      return
    }

    try {
      setProcessingPayment(true)
      const response = await paymentAPI.initializePayment({
        invoice_id: selectedInvoice.id,
        amount: amount,
        email: user?.email || "",
        callback_url: `${window.location.origin}/dashboard/student/payments`
      })

      if (response && response.authorization_url) {
        window.location.href = response.authorization_url
      } else {
        toast.error("Failed to initialize payment gateway")
      }
    } catch (error: any) {
      toast.error(error.message || "Payment failed")
    } finally {
      setProcessingPayment(false)
    }
  }

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(amount))
  }

  // --- RENDER HELPERS ---
  const getStatusBadge = (status: string) => {
    const config: any = {
      paid: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle },
      pending: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
      partially_paid: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: AlertCircle },
      overdue: { color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle },
    }
    const { color, icon: Icon } = config[status] || config.pending

    return (
      <Badge variant="outline" className={`${color} capitalize flex items-center gap-1`}>
        <Icon className="h-3 w-3" /> {status.replace('_', ' ')}
      </Badge>
    )
  }

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-teal-600" /></div>
  }

  const isLoading = Object.values(loadingStates).some(state => state)
  const currentBalance = selectedInvoice ? parseFloat(selectedInvoice.balance) : 0

  const sidebarItems = [
    { href: "/dashboard/student", label: "Overview", icon: Home, active: false },
    { href: "/dashboard/student/courses", label: "My Courses", icon: BookOpen, active: false },
    { href: "/dashboard/student/payments", label: "Payments", icon: Wallet, active: true },
    { href: "/dashboard/student/grades", label: "Results", icon: GraduationCap, active: false },
  ]

  return (
    <DashboardLayout title="Payments" role="student" sidebarItems={sidebarItems}>
      <div className="space-y-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-teal-950">Tuition & Fees</h1>
            <p className="text-slate-500 text-sm">Manage your invoices and view payment history.</p>
          </div>

          <div className="flex items-center gap-3">
            {currentSemester && (
              <div className="hidden md:block text-right pr-4 border-r border-slate-200">
                <p className="text-xs font-bold text-teal-600 uppercase tracking-wider">Active Session</p>
                <p className="font-semibold text-slate-800">{currentSemester.session}</p>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={fetchPaymentData} disabled={isLoading} className="text-teal-700 hover:bg-teal-50">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">

          {/* LEFT COLUMN: Payment Action (7 cols) */}
          <div className="lg:col-span-7 space-y-6">

            {/* 1. Select Invoice Card */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-teal-600" /> Select Invoice to Pay
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 max-h-[400px] overflow-y-auto">
                {loadingStates.allInvoices ? (
                  <div className="py-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-300" /></div>
                ) : allInvoices.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No invoices found.</div>
                ) : (
                  <div className="space-y-3">
                    {allInvoices.map(inv => (
                      <div
                        key={inv.id}
                        onClick={() => handleInvoiceSelect(inv)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selectedInvoice?.id === inv.id
                          ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500'
                          : 'border-slate-200 bg-white hover:border-teal-300'
                          }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{inv.description || "Tuition Fee"}</p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{inv.invoice_number}</p>
                          </div>
                          {getStatusBadge(inv.status)}
                        </div>
                        <div className="flex justify-between items-end mt-3">
                          <div className="text-xs text-slate-500">
                            <p>Session: {inv.session}</p>
                            <p>Due: {new Date(inv.due_date).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400">Balance Due</p>
                            <p className={`font-bold text-lg ${parseFloat(inv.balance) > 0 ? 'text-slate-800' : 'text-emerald-600'}`}>
                              {formatCurrency(inv.balance)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 2. Payment Form */}
            {selectedInvoice && parseFloat(selectedInvoice.balance) > 0 && (
              <Card className="border-teal-200 shadow-md bg-white overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-teal-500 to-emerald-500"></div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-emerald-600" /> Complete Payment
                  </CardTitle>
                  <CardDescription>Secure payment via Paystack</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Amount to Pay (₦)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">₦</span>
                      <Input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="pl-8 text-lg font-semibold"
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="cursor-pointer hover:bg-slate-100" onClick={() => setPaymentAmount("5000")}>₦5,000</Badge>
                      <Badge variant="outline" className="cursor-pointer hover:bg-slate-100" onClick={() => setPaymentAmount(selectedInvoice.balance)}>Full Balance</Badge>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold shadow-lg transition-all hover:scale-[1.01]"
                    onClick={handleMakePayment}
                    disabled={processingPayment}
                  >
                    {processingPayment ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                    ) : (
                      <span className="flex items-center">Pay Now <ChevronRight className="ml-1 h-4 w-4" /></span>
                    )}
                  </Button>

                  <div className="flex justify-center items-center gap-2 text-xs text-slate-400 pt-2">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" /> Secure SSL Encrypted Payment
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT COLUMN: History & Instructions (5 cols) */}
          <div className="lg:col-span-5 space-y-6">

            {/* Instructions */}
            <Card className="bg-slate-50 border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-slate-700">How to Pay</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm">1</div>
                  <p className="text-sm text-slate-600">Select an unpaid invoice from the list.</p>
                </div>
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm">2</div>
                  <p className="text-sm text-slate-600">Enter the amount (partial payments allowed).</p>
                </div>
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm">3</div>
                  <p className="text-sm text-slate-600">Complete payment securely via Paystack.</p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Payments */}
            <Card className="border-slate-200 shadow-sm flex-1">
              <CardHeader className="pb-3 border-b border-slate-50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-purple-600" /> Payment History
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {loadingStates.payments ? (
                  <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-300" /></div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">No payment history found.</div>
                ) : (
                  <div className="space-y-4">
                    {payments.slice(0, 5).map(pay => (
                      <div key={pay.id} className="flex justify-between items-center pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {formatCurrency(pay.amount)}
                          </p>
                          <p className="text-xs text-slate-400">{new Date(pay.payment_date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={`text-xs ${pay.status === 'completed' ? 'text-green-600 bg-green-50 border-green-100' :
                            pay.status === 'pending' ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-red-600'
                            }`}>
                            {pay.status}
                          </Badge>
                          <p className="text-[10px] text-slate-400 font-mono mt-1 truncate w-20" title={pay.reference_id}>{pay.reference_id}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {payments.length > 5 && (
                  <Button variant="ghost" className="w-full mt-4 text-xs text-slate-500">View All History</Button>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}