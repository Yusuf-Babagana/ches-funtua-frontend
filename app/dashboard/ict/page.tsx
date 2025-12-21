"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users, UserPlus, GraduationCap, Loader2, RefreshCw,
  Activity, ArrowRight, ServerCog, Lock, Settings
} from "lucide-react"
import { ictAPI } from "@/lib/api"
import { toast } from "sonner"

// Helper component for Stat Cards to keep things clean
function StatCard({ title, value, subtext, icon: Icon, colorClass }: any) {
  return (
    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        <p className="text-xs text-slate-500 mt-1">{subtext}</p>
      </CardContent>
    </Card>
  )
}

export default function ICTDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Sidebar Configuration
  const sidebarItems = [
    { href: "/dashboard/ict", label: "Overview", icon: Activity, active: true },
    { href: "/dashboard/ict/user-management", label: "User Management", icon: Users, active: false },
    { href: "/dashboard/ict/staff-accounts", label: "Staff Accounts", icon: GraduationCap, active: false },
    { href: "/dashboard/ict/registration", label: "Registration", icon: UserPlus, active: false },
    { href: "/dashboard/ict/system", label: "System Config", icon: ServerCog, active: false },
    { href: "/dashboard/ict/settings", label: "Settings", icon: Settings, active: false },
  ]

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      if (!data) setLoading(true)
      else setRefreshing(true)

      console.log("Fetching ICT Dashboard data...")
      const response = await ictAPI.getDashboard()

      if (response && !response.error) {
        setData(response)
      } else {
        console.warn("API Error:", response)
      }
    } catch (error) {
      console.error("Failed to load dashboard:", error)
      toast.error("Failed to load dashboard statistics")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Helper to safely access nested data
  const userStats = data?.user_statistics || {}
  const systemStats = data?.system_statistics || {}

  if (loading && !data) {
    return (
      <DashboardLayout title="ICT Dashboard" role="ict" sidebarItems={sidebarItems}>
        <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
          <p className="text-slate-500 text-sm animate-pulse">Loading System Metrics...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="ICT Dashboard" role="ict" sidebarItems={sidebarItems}>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System Overview</h2>
            <p className="text-slate-500">Monitor active users and department status</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={loading || refreshing}
            className="border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 transition-all"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            title="Total Students"
            value={userStats.students?.total?.toLocaleString() || 0}
            subtext={`${userStats.students?.active || 0} active accounts`}
            icon={Users}
            colorClass="bg-teal-100 text-teal-600"
          />

          <StatCard
            title="New Users (7 Days)"
            value={systemStats.new_users_last_week || 0}
            subtext={`Total inactive: ${userStats.students?.inactive || 0}`}
            icon={UserPlus}
            colorClass="bg-emerald-100 text-emerald-600"
          />

          <StatCard
            title="Active Departments"
            value={userStats.department_distribution?.length || 0}
            subtext={`Across ${userStats.lecturers?.total || 0} lecturers`}
            icon={GraduationCap}
            colorClass="bg-indigo-100 text-indigo-600"
          />
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <ServerCog className="h-5 w-5 text-teal-600" />
            Quick Actions
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

            {/* Register New Student */}
            <Card
              className="group cursor-pointer border-slate-200 hover:border-teal-300 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-slate-50/50"
              onClick={() => router.push('/dashboard/ict/registration')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-700 group-hover:text-teal-700 transition-colors flex items-center gap-2">
                  <div className="p-2 rounded-full bg-teal-50 group-hover:bg-teal-100 transition-colors">
                    <UserPlus className="h-5 w-5 text-teal-600" />
                  </div>
                  Register Student
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-slate-500">
                  Create new student accounts and assign them to departments.
                </p>
                <div className="flex items-center text-xs font-medium text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                  Get Started <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              </CardContent>
            </Card>

            {/* Create Staff Account */}
            <Card
              className="group cursor-pointer border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-slate-50/50"
              onClick={() => router.push('/dashboard/ict/staff-accounts')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-700 group-hover:text-emerald-700 transition-colors flex items-center gap-2">
                  <div className="p-2 rounded-full bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                    <GraduationCap className="h-5 w-5 text-emerald-600" />
                  </div>
                  Create Staff Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-slate-500">
                  Provision accounts for Lecturers, HODs, or Admin staff.
                </p>
                <div className="flex items-center text-xs font-medium text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                  Proceed <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              </CardContent>
            </Card>

            {/* Manage User Accounts */}
            <Card
              className="group cursor-pointer border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-slate-50/50"
              onClick={() => router.push('/dashboard/ict/user-management')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-700 group-hover:text-indigo-700 transition-colors flex items-center gap-2">
                  <div className="p-2 rounded-full bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
                    <Activity className="h-5 w-5 text-indigo-600" />
                  </div>
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-slate-500">
                  Reset passwords, update statuses, and audit user logs.
                </p>
                <div className="flex items-center text-xs font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                  Manage <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}