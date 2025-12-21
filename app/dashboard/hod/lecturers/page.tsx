"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Users,
  Search,
  UserPlus,
  Mail,
  Phone,
  BookOpen,
  Filter,
  AlertCircle,
  GraduationCap,
  Shield,
  MoreVertical,
  Eye,
  Edit,
  RefreshCw,
  UserCheck
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Lecturer {
  id: number
  user: {
    id: number
    email: string
    first_name: string
    last_name: string
    phone: string
  }
  staff_id: string
  designation: string
  specialization: string
  is_hod: boolean
  courses_taught?: Array<{
    id: number
    code: string
    title: string
  }>
  course_count?: number
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// Unified Input Style
const inputClassName = "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200";

export default function LecturersPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const [lecturers, setLecturers] = useState<Lecturer[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [designationFilter, setDesignationFilter] = useState("all")

  // Designation options
  const designationOptions = [
    { value: "all", label: "All Designations" },
    { value: "professor", label: "Professor" },
    { value: "associate_professor", label: "Associate Professor" },
    { value: "senior_lecturer", label: "Senior Lecturer" },
    { value: "lecturer_1", label: "Lecturer I" },
    { value: "lecturer_2", label: "Lecturer II" },
    { value: "assistant_lecturer", label: "Assistant Lecturer" },
  ]

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "hod")) {
      router.push("/login")
      return
    }

    if (user?.role === "hod") {
      fetchLecturers()
    }
  }, [user, authLoading, router])

  const fetchLecturers = async () => {
    try {
      if (!refreshing) setLoading(true)
      setError("")

      const token = localStorage.getItem('token')
      if (!token) {
        logout()
        return
      }

      // First, get department info to get department ID (Assuming this is needed for fallback)
      const departmentResponse = await fetch(`${API_BASE}/academics/departments/my_department/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!departmentResponse.ok) throw new Error(`Failed to fetch department`)
      const departmentData = await departmentResponse.json()
      const departmentId = departmentData.department?.id

      // Fetch lecturers for this department
      const response = await fetch(`${API_BASE}/academics/hod/dashboard/lecturers/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        console.log("HOD endpoint not available, using fallback...")
        await fetchLecturersFallback(departmentId)
        return
      }

      const data = await response.json()
      if (data.error) throw new Error(data.error.detail || "Failed to fetch lecturers")

      const lecturersList = data.results || data
      setLecturers(Array.isArray(lecturersList) ? lecturersList : [])

    } catch (error: any) {
      console.error("Error fetching lecturers:", error)
      setError(error.message || "Failed to load lecturers")
      if (error.message.includes('401')) logout()
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchLecturersFallback = async (departmentId: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/users/lecturers/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error(`Fallback failed`)

      const data = await response.json()
      const lecturersList = data.results || data

      const filteredLecturers = Array.isArray(lecturersList)
        ? lecturersList.filter((lecturer: any) =>
          lecturer.department === departmentId || lecturer.department?.id === departmentId
        )
        : []

      setLecturers(filteredLecturers)
    } catch (fallbackError) {
      setError("Could not load lecturers. Please try again later.")
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchLecturers()
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getDesignationStyle = (designation: string) => {
    const styles: Record<string, { label: string, className: string }> = {
      'professor': { label: 'Professor', className: 'bg-purple-100 text-purple-800 border-purple-200' },
      'associate_professor': { label: 'Assoc. Prof', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
      'senior_lecturer': { label: 'Snr. Lecturer', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      'lecturer_1': { label: 'Lecturer I', className: 'bg-teal-100 text-teal-800 border-teal-200' },
      'lecturer_2': { label: 'Lecturer II', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'assistant_lecturer': { label: 'Asst. Lecturer', className: 'bg-slate-100 text-slate-800 border-slate-200' },
    }
    return styles[designation] || { label: designation, className: 'bg-gray-100 text-gray-800' }
  }

  const filteredLecturers = lecturers.filter(lecturer => {
    const searchLower = search.toLowerCase()
    const matchesSearch =
      lecturer.user?.first_name?.toLowerCase().includes(searchLower) ||
      lecturer.user?.last_name?.toLowerCase().includes(searchLower) ||
      lecturer.user?.email?.toLowerCase().includes(searchLower) ||
      lecturer.staff_id?.toLowerCase().includes(searchLower) ||
      lecturer.specialization?.toLowerCase().includes(searchLower)

    const matchesDesignation = designationFilter === "all" || lecturer.designation === designationFilter

    return matchesSearch && matchesDesignation
  })

  // Calculate Stats
  const totalLecturers = lecturers.length
  const totalProfs = lecturers.filter(l => l.designation.includes('professor') || l.designation === 'senior_lecturer').length
  const totalHod = lecturers.filter(l => l.is_hod).length

  if (authLoading || loading) {
    return (
      <DashboardLayout title="Faculty Management" role="hod">
        <div className="space-y-6">
          <div className="flex justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout title="Faculty Management" role="hod">
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchLecturers} variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Retry</Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Faculty Management" role="hod">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Faculty Directory</h1>
            <p className="text-slate-500">Manage academic staff and view specializations.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="border-slate-200 text-slate-600 hover:bg-slate-50">
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button
              onClick={() => router.push('/dashboard/hod/lecturers/add')}
              className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
            >
              <UserPlus className="mr-2 h-4 w-4" /> Add Lecturer
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-teal-500 shadow-sm">
            <CardContent className="p-5 flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Total Faculty</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{totalLecturers}</p>
              </div>
              <div className="h-10 w-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-600">
                <Users className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500 shadow-sm">
            <CardContent className="p-5 flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Senior Staff</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{totalProfs}</p>
                <p className="text-[10px] text-slate-400">Profs & Snr. Lecturers</p>
              </div>
              <div className="h-10 w-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                <GraduationCap className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500 shadow-sm">
            <CardContent className="p-5 flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Administration</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{totalHod}</p>
                <p className="text-[10px] text-slate-400">HOD Access</p>
              </div>
              <div className="h-10 w-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                <Shield className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 p-4 rounded-xl border border-slate-200">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, or staff ID..."
              className={`${inputClassName} pl-9`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-4 w-4 text-slate-400" />
            <Select value={designationFilter} onValueChange={setDesignationFilter}>
              <SelectTrigger className="w-full md:w-64 bg-white border-slate-200">
                <SelectValue placeholder="Filter by Designation" />
              </SelectTrigger>
              <SelectContent>
                {designationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lecturers Table */}
        <Card className="border border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {filteredLecturers.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <UserCheck className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No lecturers found.</p>
                <p className="text-sm text-slate-400 mt-1">Try adjusting your search criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLecturers.map((lecturer) => {
                      const style = getDesignationStyle(lecturer.designation);
                      return (
                        <TableRow key={lecturer.id} className="hover:bg-slate-50/50 group">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 bg-slate-100 border border-slate-200">
                                <AvatarFallback className="text-slate-600 text-xs font-bold">
                                  {getInitials(lecturer.user?.first_name + " " + lecturer.user?.last_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-slate-900 flex items-center gap-2">
                                  {lecturer.user?.first_name} {lecturer.user?.last_name}
                                  {lecturer.is_hod && (
                                    <Badge variant="default" className="text-[9px] h-4 px-1 bg-slate-800">HOD</Badge>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 font-mono mt-0.5">{lecturer.staff_id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 text-xs text-slate-500">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-slate-400" />
                                {lecturer.user?.email}
                              </div>
                              {lecturer.user?.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3 text-slate-400" />
                                  {lecturer.user.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`${style.className} font-medium border shadow-sm`}>
                              {style.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-700">{lecturer.specialization || "General"}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 shadow-xl rounded-lg">
                                <DropdownMenuLabel className="bg-slate-50 text-xs text-slate-500 font-medium uppercase tracking-wider py-2 px-2 rounded-t-md">
                                  Actions
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="m-0 bg-slate-100" />
                                <DropdownMenuItem className="cursor-pointer text-slate-600 focus:bg-teal-50 focus:text-teal-700 py-2 rounded-md m-1">
                                  <Eye className="mr-2 h-4 w-4" /> View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer text-slate-600 focus:bg-teal-50 focus:text-teal-700 py-2 rounded-md m-1">
                                  <Edit className="mr-2 h-4 w-4" /> Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer text-slate-600 focus:bg-teal-50 focus:text-teal-700 py-2 rounded-md m-1"
                                  onClick={() => router.push(`/dashboard/hod/courses?assign_to=${lecturer.id}`)}
                                >
                                  <BookOpen className="mr-2 h-4 w-4" /> Assign Courses
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}