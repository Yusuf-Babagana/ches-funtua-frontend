"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, CheckCircle, Clock, BookOpen, Users, AlertCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

interface DashboardStats {
  totalPayments: number
  verifiedPayments: number
  pendingPayments: number
  pendingRegistrations: number
}

export default function DeskOfficerDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalPayments: 0,
    verifiedPayments: 0,
    pendingPayments: 0,
    pendingRegistrations: 0
  })
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!loading && (!user || user.role !== "desk-officer")) {
      router.push("/login")
      return
    }

    if (user && user.role === "desk-officer") {
      fetchDeskOfficerData()
    }
  }, [user, loading, router])

  const fetchDeskOfficerData = async () => {
    try {
      setLoadingData(true)
      setError("")

      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error("No authentication token found")
      }

      console.log("🔄 Fetching desk officer data...")

      // Since we don't have specific endpoints yet, we'll use placeholder data
      // In a real app, you would fetch from endpoints like:
      // - /api/finance/payments/ (for payments)
      // - /api/admissions/registrations/ (for pending registrations)

      // For now, we'll simulate API calls and use zeros
      // Replace these with real API calls when available

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Placeholder data - replace with real API calls
      const placeholderStats = {
        totalPayments: 0,
        verifiedPayments: 0,
        pendingPayments: 0,
        pendingRegistrations: 0
      }

      setStats(placeholderStats)

    } catch (err: any) {
      console.error("Error fetching desk officer data:", err)
      setError(err.message || "Failed to load dashboard data. Some features may be limited.")

      // Set zero stats if API fails
      setStats({
        totalPayments: 0,
        verifiedPayments: 0,
        pendingPayments: 0,
        pendingRegistrations: 0
      })
    } finally {
      setLoadingData(false)
    }
  }

  const handleRetry = () => {
    fetchDeskOfficerData()
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const dashboardStats = [
    {
      title: "Total Payments",
      value: loadingData ? "..." : stats.totalPayments.toString(),
      icon: CreditCard,
      color: "text-blue-600",
      description: loadingData ? "Loading..." : "All payment records"
    },
    {
      title: "Verified",
      value: loadingData ? "..." : stats.verifiedPayments.toString(),
      icon: CheckCircle,
      color: "text-green-600",
      description: loadingData ? "Loading..." : "Verified payments"
    },
    {
      title: "Pending Payments",
      value: loadingData ? "..." : stats.pendingPayments.toString(),
      icon: Clock,
      color: "text-orange-600",
      description: loadingData ? "Loading..." : "Awaiting verification"
    },
    {
      title: "Pending Registrations",
      value: loadingData ? "..." : stats.pendingRegistrations.toString(),
      icon: BookOpen,
      color: "text-purple-600",
      description: loadingData ? "Loading..." : "Registration requests"
    },
  ]

  return (
    <DashboardLayout title="Desk Officer Dashboard" role="desk-officer">
      <div className="space-y-6">
        {/* Header with retry button */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Desk Officer Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.first_name} {user.last_name}</p>
          </div>
          {error && (
            <Button onClick={handleRetry} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <Icon className={cn("h-4 w-4", stat.color)} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Quick Actions</CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Manage front desk operations, verify payments, and process student registrations.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Payment Management</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Verify student payment receipts</li>
                    <li>• Process payment approvals</li>
                    <li>• Generate payment reports</li>
                    <li>• Handle payment disputes</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">Registration Support</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Assist with student course registration</li>
                    <li>• Verify registration requirements</li>
                    <li>• Process registration changes</li>
                    <li>• Handle registration inquiries</li>
                  </ul>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-800 mb-2">Front Desk Operations</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Manage visitor registrations</li>
                    <li>• Handle general inquiries</li>
                    <li>• Schedule appointments</li>
                    <li>• Coordinate with other departments</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Data Integration
                  </h4>
                  <p className="text-sm text-yellow-700">
                    The dashboard is currently using placeholder data. When the backend APIs for payments
                    and registrations are implemented, real data will automatically appear here.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Expected Backend Endpoints:</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <code>/api/finance/payments/</code> - Payment records
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <code>/api/admissions/registrations/</code> - Registration requests
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <code>/api/finance/payments/verified/</code> - Verified payments
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <code>/api/finance/payments/pending/</code> - Pending payments
                    </li>
                  </ul>
                </div>

                <div className="text-sm text-muted-foreground border-t pt-4">
                  <p>Need assistance? Contact the ICT department for technical support.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}