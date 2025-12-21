"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CreditCard, DollarSign, FileText, Users,
  ArrowUpRight, ArrowDownRight, Search, Download,
  Loader2, PlusCircle, X, Building, Wallet, TrendingUp
} from "lucide-react"
import { financeAPI, academicsAPI } from "@/lib/api"
import { toast } from "sonner"

// --- Interfaces ---
interface BursarStats {
  total_revenue: number
  pending_payments: number
  cleared_students: number
  total_invoices: number
  growth_percentage: number
}

interface Payment {
  id: number
  reference_id: string
  amount: string
  student_name: string
  payment_method: string
  status: string
  payment_date: string
}

interface Department {
  id: number
  name: string
  code: string
}

// --- Bulk Invoice Modal Component ---
function BulkInvoiceModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [formData, setFormData] = useState({
    session: "2024/2025",
    semester: "first",
    level: "100",
    department_id: "all",
    amount: "",
    due_date: "",
    description: "Tuition Fee"
  })

  // Fetch departments on load
  useEffect(() => {
    if (open) {
      const fetchDepts = async () => {
        try {
          const res = await academicsAPI.getDepartments()
          if (Array.isArray(res)) setDepartments(res)
          else if (res.results) setDepartments(res.results)
        } catch (e) {
          console.error("Failed to load departments")
        }
      }
      fetchDepts()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await financeAPI.generateBulkInvoices(formData)
      if (response && !response.error) {
        toast.success(`Generated ${response.created} invoices (Skipped ${response.skipped})`)
        onSuccess()
        onClose()
      } else {
        toast.error(response.error || "Failed to generate invoices")
      }
    } catch (error) {
      toast.error("Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl border border-gray-100 transform transition-all scale-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Generate Bulk Invoices</h2>
            <p className="text-sm text-gray-500">Create invoices for a group of students</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><X className="h-5 w-5 text-gray-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Session</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={formData.session}
                onChange={e => setFormData({ ...formData, session: e.target.value })}
              >
                <option value="2023/2024">2023/2024</option>
                <option value="2024/2025">2024/2025</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Semester</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={formData.semester}
                onChange={e => setFormData({ ...formData, semester: e.target.value })}
              >
                <option value="first">First</option>
                <option value="second">Second</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Level</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={formData.level}
                onChange={e => setFormData({ ...formData, level: e.target.value })}
              >
                <option value="100">100 Level</option>
                <option value="200">200 Level</option>
                <option value="300">300 Level</option>
                <option value="400">400 Level</option>
                <option value="500">500 Level</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Department</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={formData.department_id}
                onChange={e => setFormData({ ...formData, department_id: e.target.value })}
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Amount (₦)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">₦</span>
              <input
                type="number"
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 pl-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                placeholder="150000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Due Date</label>
            <input
              type="date"
              required
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.due_date}
              onChange={e => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Description</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11 rounded-lg shadow-md shadow-blue-200 mt-2" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />}
            Generate Invoices
          </Button>
        </form>
      </div>
    </div>
  )
}

// --- Main Page Component ---
export default function BursarDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<BursarStats | null>(null)
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await financeAPI.getBursarDashboard()

      if (response && !response.error) {
        setStats(response.stats)
        setRecentPayments(response.recent_payments || [])
      }
    } catch (error) {
      console.error("Failed to load bursar data", error)
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(Number(amount))
  }

  const getStatusBadge = (status: string) => {
    const styles: any = {
      completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      failed: "bg-red-100 text-red-700 border-red-200",
    }
    return (
      <Badge variant="outline" className={`${styles[status] || 'bg-gray-100'} capitalize font-medium border px-2.5 py-0.5`}>
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <DashboardLayout title="Bursar Dashboard" role="bursar">
      <div className="space-y-8 max-w-7xl mx-auto">

        {/* HEADER & ACTIONS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Financial Overview</h1>
            <p className="text-gray-500 mt-1">Manage student fees, invoices, and revenue performance.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={fetchDashboardData} className="border-gray-300 text-gray-700 hover:bg-gray-50">
              Refresh Data
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium"
              onClick={() => setShowInvoiceModal(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Bulk Invoices
            </Button>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-none shadow-md bg-gradient-to-br from-white to-blue-50/50 hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Revenue</CardTitle>
              <div className="p-2 bg-blue-100 rounded-full">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.total_revenue || 0)}</div>
              <div className="flex items-center text-xs mt-2">
                {stats && stats.growth_percentage >= 0 ? (
                  <span className="text-emerald-600 flex items-center font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{stats.growth_percentage}%
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center font-bold bg-red-50 px-1.5 py-0.5 rounded">
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                    {stats?.growth_percentage}%
                  </span>
                )}
                <span className="text-gray-400 ml-2">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">Pending Payments</CardTitle>
              <div className="p-2 bg-orange-100 rounded-full">
                <CreditCard className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.pending_payments || 0}</div>
              <p className="text-xs text-gray-500 mt-2 flex items-center">
                <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
                Transactions requiring verification
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">Cleared Students</CardTitle>
              <div className="p-2 bg-green-100 rounded-full">
                <Users className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.cleared_students || 0}</div>
              <p className="text-xs text-gray-500 mt-2 flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                Fully paid for current session
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Invoices</CardTitle>
              <div className="p-2 bg-purple-100 rounded-full">
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.total_invoices || 0}</div>
              <p className="text-xs text-gray-500 mt-2 flex items-center">
                <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                Generated this session
              </p>
            </CardContent>
          </Card>
        </div>

        {/* MAIN CONTENT SPLIT */}
        <div className="grid gap-8 lg:grid-cols-3">

          {/* Recent Transactions Table */}
          <Card className="lg:col-span-2 border shadow-sm overflow-hidden">
            <CardHeader className="bg-gray-50 border-b border-gray-100 pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Recent Transactions</CardTitle>
                  <CardDescription className="mt-1">Latest payments received across all channels</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">View All</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white text-gray-500 border-b">
                    <tr>
                      <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Student</th>
                      <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Amount</th>
                      <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Method</th>
                      <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Date</th>
                      <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {recentPayments.length > 0 ? (
                      recentPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{payment.student_name}</div>
                            <div className="text-xs text-gray-400 font-mono mt-0.5">{payment.reference_id}</div>
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-700">{formatCurrency(payment.amount)}</td>
                          <td className="px-6 py-4 capitalize text-gray-600">
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-600">
                              {payment.payment_method.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(payment.status)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-gray-500">
                          <Wallet className="h-10 w-10 mx-auto mb-3 opacity-20" />
                          <p>No recent transactions found.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions / Notices */}
          <div className="space-y-6">
            <Card className="border shadow-sm">
              <CardHeader className="bg-gray-50 border-b border-gray-100 pb-4">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-6">
                <Button variant="outline" className="w-full justify-start h-12 text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all" onClick={() => setShowInvoiceModal(true)}>
                  <PlusCircle className="mr-3 h-5 w-5 text-blue-600" />
                  <span className="font-medium">Create Single Invoice</span>
                </Button>
                <Button variant="outline" className="w-full justify-start h-12 text-gray-700 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 transition-all">
                  <Search className="mr-3 h-5 w-5 text-orange-600" />
                  <span className="font-medium">Verify Manual Payment</span>
                </Button>
                <Button variant="outline" className="w-full justify-start h-12 text-gray-700 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-all">
                  <Download className="mr-3 h-5 w-5 text-green-600" />
                  <span className="font-medium">Export Revenue Report</span>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">Need Help?</h3>
                <p className="text-blue-100 text-sm mb-4">
                  Contact the ICT department for technical issues regarding payment gateways or student data discrepancies.
                </p>
                <Button size="sm" variant="secondary" className="w-full bg-white text-blue-700 hover:bg-blue-50">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>

      <BulkInvoiceModal
        open={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onSuccess={fetchDashboardData}
      />

    </DashboardLayout>
  )
}