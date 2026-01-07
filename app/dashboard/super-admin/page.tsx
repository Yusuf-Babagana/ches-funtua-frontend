"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Search,
  Users,
  MoreVertical,
  Eye,
  Edit,
  RefreshCw,
  Download,
  Upload,
  Plus,
  AlertCircle,
  CheckCircle,
  Shield,
  Clock,
  GraduationCap,
  Phone,
  UserX,
  Filter
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

// ... (Interfaces remain the same as your code) ...
interface Student {
  id: number
  user: {
    id: number
    email: string
    first_name: string
    last_name: string
    phone?: string
    is_active: boolean
  }
  matric_number: string
  level: string
  department: {
    id: number
    name: string
    code: string
  }
  status: 'active' | 'inactive' | 'graduated' | 'suspended'
  admission_date: string
  date_of_birth?: string
  address?: string
  guardian_name?: string
  guardian_phone?: string
  created_at: string
  updated_at: string
}

interface DepartmentStats {
  total_students: number
  active_students: number
  graduated_students: number
  suspended_students: number
  by_level: {
    '100': number
    '200': number
    '300': number
    '400': number
  }
  recent_admissions: number
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// Fetch helper (kept same as your code)
const fetchWithToken = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token')
  const fullUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  }
  try {
    const response = await fetch(fullUrl, config)
    if (!response.ok) {
      let errorData
      try { errorData = await response.json() } catch { errorData = { detail: `HTTP error! status: ${response.status}`, status: response.status } }
      if (response.status === 401) { localStorage.removeItem('token'); localStorage.removeItem('user'); }
      return { error: errorData, status: response.status }
    }
    return await response.json()
  } catch (error) {
    return { error: { detail: 'Network error', networkError: true } }
  }
}

// Helper for Initials
const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

// Styles
const inputClassName = "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200";

export default function HODStudentsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [stats, setStats] = useState<DepartmentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [levelFilter, setLevelFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    first_name: "", last_name: "", email: "", phone: "", matric_number: "",
    level: "100", date_of_birth: "", address: "", guardian_name: "", guardian_phone: "",
  })

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "hod")) router.push("/login")
  }, [user, authLoading, router])

  useEffect(() => {
    if (user?.role === "hod") {
      fetchStudents()
      fetchDepartmentStats()
    }
  }, [user])

  useEffect(() => {
    let filtered = students
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.matric_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${student.user.first_name} ${student.user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (levelFilter !== "all") filtered = filtered.filter(student => student.level === levelFilter)
    if (statusFilter !== "all") filtered = filtered.filter(student => student.status === statusFilter)
    setFilteredStudents(filtered)
  }, [students, searchTerm, levelFilter, statusFilter])

  const fetchStudents = async () => {
    try {
      setLoading(true); setError("")
      const response = await fetchWithToken('/auth/students/')
      if (response.error) throw new Error(response.error.detail || "Failed to fetch students")

      const hodDepartmentId = user?.department_id
      let studentsData = response.results || response.data || response
      if (Array.isArray(studentsData) && hodDepartmentId) {
        studentsData = studentsData.filter((student: any) =>
          student.department?.id === hodDepartmentId || student.department === hodDepartmentId
        )
      }
      setStudents(studentsData)
      setFilteredStudents(studentsData)
    } catch (error: any) {
      setError(error.message || "Failed to load students")
    } finally {
      setLoading(false); setRefreshing(false)
    }
  }

  const fetchDepartmentStats = async () => {
    try {
      // Simplified stats logic based on loaded students for immediate UI feedback
      const s = students
      setStats({
        total_students: s.length,
        active_students: s.filter(x => x.status === 'active').length,
        graduated_students: s.filter(x => x.status === 'graduated').length,
        suspended_students: s.filter(x => x.status === 'suspended').length,
        by_level: {
          '100': s.filter(x => x.level === '100').length,
          '200': s.filter(x => x.level === '200').length,
          '300': s.filter(x => x.level === '300').length,
          '400': s.filter(x => x.level === '400').length,
        },
        recent_admissions: 0 // Placeholder
      })
    } catch (error) { console.error(error) }
  }

  const handleRefresh = () => { setRefreshing(true); fetchStudents(); }

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSuccess("")
    try {
      const studentData = {
        ...formData,
        matric_number: formData.matric_number.trim().toUpperCase(),
        department: user?.department_id,
        status: 'active'
      }
      const response = await fetchWithToken('/auth/register/student/', { method: 'POST', body: JSON.stringify(studentData) })
      if (response.error) throw new Error(response.error.detail || "Failed to add student")

      await fetchStudents()
      setIsAddDialogOpen(false)
      setFormData({ first_name: "", last_name: "", email: "", phone: "", matric_number: "", level: "100", date_of_birth: "", address: "", guardian_name: "", guardian_phone: "" })
      setSuccess("✅ Student added successfully!"); setTimeout(() => setSuccess(""), 5000)
    } catch (error: any) { setError(`❌ ${error.message}`) }
  }

  const handleUpdateStatus = async (studentId: number, newStatus: Student['status']) => {
    try {
      const response = await fetchWithToken(`/auth/students/${studentId}/`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) })
      if (response.error) throw new Error(response.error.detail || "Failed to update status")
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: newStatus } : s))
      setSuccess(`✅ Student status updated to ${newStatus}`); setTimeout(() => setSuccess(""), 3000)
    } catch (error: any) { setError(`❌ ${error.message}`) }
  }

  const getStatusBadge = (status: string) => {
    const styles: any = {
      active: "bg-emerald-100 text-emerald-700 border-emerald-200",
      inactive: "bg-slate-100 text-slate-700 border-slate-200",
      graduated: "bg-blue-100 text-blue-700 border-blue-200",
      suspended: "bg-red-100 text-red-700 border-red-200",
    }
    return <Badge variant="outline" className={`${styles[status] || styles.inactive} capitalize shadow-sm px-2.5`}>{status}</Badge>
  }

  if (authLoading || !user) return <DashboardLayout title="Student Management" role="hod"><Skeleton className="h-64 w-full" /></DashboardLayout>

  return (
    <DashboardLayout title="Student Management" role="hod">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Student Directory</h1>
            <p className="text-slate-500">Manage enrollments and academic records for {user.department_name || "your department"}.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="border-slate-200 text-slate-600 hover:bg-slate-50">
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-600 hover:bg-slate-50">
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-emerald-500 shadow-sm">
            <CardContent className="p-5 flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Total Active</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stats?.active_students || 0}</p>
              </div>
              <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                <Users className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardContent className="p-5 flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Graduated</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stats?.graduated_students || 0}</p>
              </div>
              <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <GraduationCap className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500 shadow-sm">
            <CardContent className="p-5 flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Suspended</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stats?.suspended_students || 0}</p>
              </div>
              <div className="h-10 w-10 bg-red-50 rounded-full flex items-center justify-center text-red-600">
                <Shield className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500 shadow-sm">
            <CardContent className="p-5 flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Freshers (100L)</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stats?.by_level['100'] || 0}</p>
              </div>
              <div className="h-10 w-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                <Users className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col md:flex-row gap-4 items-end justify-between bg-slate-50/50 p-4 rounded-xl border border-slate-200">
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search students..."
                className={`${inputClassName} pl-9`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full md:w-32 bg-white border-slate-200">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="100">100 Level</SelectItem>
                <SelectItem value="200">200 Level</SelectItem>
                <SelectItem value="300">300 Level</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-32 bg-white border-slate-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm">
                <Plus className="mr-2 h-4 w-4" /> Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Student Registration</DialogTitle>
                <DialogDescription>Enter the student's details to create a new profile in your department.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddStudent} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>First Name</Label><Input required value={formData.first_name} onChange={e => handleFormChange("first_name", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Last Name</Label><Input required value={formData.last_name} onChange={e => handleFormChange("last_name", e.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" required value={formData.email} onChange={e => handleFormChange("email", e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Matric Number</Label><Input required value={formData.matric_number} onChange={e => handleFormChange("matric_number", e.target.value)} placeholder="CSC/..." /></div>
                  <div className="space-y-2">
                    <Label>Level</Label>
                    <Select value={formData.level} onValueChange={val => handleFormChange("level", val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100">100 Level</SelectItem>
                        <SelectItem value="200">200 Level</SelectItem>
                        <SelectItem value="300">300 Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Phone</Label><Input value={formData.phone} onChange={e => handleFormChange("phone", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Date of Birth</Label><Input type="date" value={formData.date_of_birth} onChange={e => handleFormChange("date_of_birth", e.target.value)} /></div>
                </div>
                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700">Add Student</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {success && <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800"><CheckCircle className="h-4 w-4" /><AlertDescription>{success}</AlertDescription></Alert>}
        {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

        {/* Table */}
        <Card className="border border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3"><Users className="h-8 w-8 text-slate-300" /></div>
                <p className="text-slate-500 font-medium">No students found matching criteria.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead>Student Identity</TableHead>
                    <TableHead>Matric No.</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id} className="hover:bg-slate-50/50 group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 bg-slate-100 border border-slate-200">
                            <AvatarFallback className="text-slate-600 text-xs font-bold">{getInitials(student.user.first_name + " " + student.user.last_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-900">{student.user.first_name} {student.user.last_name}</p>
                            <p className="text-xs text-slate-500">{student.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-medium bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200">{student.matric_number}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-slate-50 text-slate-600 border-slate-200">L{student.level}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(student.status)}</TableCell>
                      <TableCell>
                        <div className="text-xs text-slate-500 flex flex-col gap-1">
                          {student.user.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {student.user.phone}</span>}
                          {student.guardian_phone && <span className="text-slate-400">G: {student.guardian_phone}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 p-1 bg-white border border-slate-200 shadow-xl rounded-lg">
                            <DropdownMenuLabel className="bg-slate-50 text-xs text-slate-500 font-medium uppercase tracking-wider py-2 px-2 rounded-t-md">User Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-100 m-0" />
                            <div className="p-1 space-y-0.5">
                              <DropdownMenuItem className="cursor-pointer text-slate-600 focus:bg-teal-50 focus:text-teal-700 py-2 rounded-md">
                                <Eye className="mr-2 h-4 w-4" /> View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer text-slate-600 focus:bg-teal-50 focus:text-teal-700 py-2 rounded-md">
                                <Edit className="mr-2 h-4 w-4" /> Edit Details
                              </DropdownMenuItem>
                            </div>
                            <DropdownMenuSeparator className="bg-slate-100 my-1" />
                            <div className="p-1 space-y-0.5">
                              <DropdownMenuItem onClick={() => handleUpdateStatus(student.id, 'active')} className="cursor-pointer text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700 py-2 rounded-md font-medium">
                                <CheckCircle className="mr-2 h-4 w-4" /> Activate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(student.id, 'suspended')} className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 py-2 rounded-md font-medium">
                                <Shield className="mr-2 h-4 w-4" /> Suspend
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(student.id, 'graduated')} className="cursor-pointer text-blue-600 focus:bg-blue-50 focus:text-blue-700 py-2 rounded-md font-medium">
                                <GraduationCap className="mr-2 h-4 w-4" /> Graduate
                              </DropdownMenuItem>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}