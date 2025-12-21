"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Building2,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit,
    Trash2,
    Users,
    GraduationCap,
    BookOpen,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    XCircle,
    UserCog,
    Calendar,
    UserPlus
} from "lucide-react"
import { academicsAPI, superAdminAPI, userAPI } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

interface Department {
    id: number
    code: string
    name: string
    description?: string
    hod?: {
        id: number
        name?: string
        staff_id?: string
        email?: string
    }
    created_at: string
    student_count?: number
    lecturer_count?: number
    course_count?: number
}

interface Lecturer {
    id: number
    name: string
    staff_id: string
    email: string
    department_id: number
    is_hod: boolean
}

export default function SuperAdminDepartmentsPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [authChecked, setAuthChecked] = useState(false)

    // State management
    const [departments, setDepartments] = useState<Department[]>([])
    const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([])
    const [availableHODs, setAvailableHODs] = useState<Lecturer[]>([])
    const [allLecturers, setAllLecturers] = useState<Lecturer[]>([])
    const [adminStats, setAdminStats] = useState<any>(null)
    const [totalCourses, setTotalCourses] = useState(0)

    // UI states
    const [loadingStates, setLoadingStates] = useState({
        departments: true,
        hods: true,
        lecturers: false
    })
    const [errors, setErrors] = useState({
        departments: null as string | null,
        hods: null as string | null,
        lecturers: null as string | null
    })

    // Dialog states
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showAssignHODDialog, setShowAssignHODDialog] = useState(false)
    const [showRemoveHODDialog, setShowRemoveHODDialog] = useState(false)
    const [showAssignLecturerDialog, setShowAssignLecturerDialog] = useState(false)

    // Form states
    const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null)
    const [newDepartment, setNewDepartment] = useState({
        code: "",
        name: "",
        description: ""
    })
    const [selectedLecturerId, setSelectedLecturerId] = useState<string>("")

    // Filter states
    const [searchQuery, setSearchQuery] = useState("")
    const [filterHOD, setFilterHOD] = useState("all") // 'all', 'assigned', 'unassigned'

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Check authentication
    useEffect(() => {
        console.log("🔍 SUPERADMIN DEPARTMENTS DEBUG:", {
            loading,
            user: user ? `${user.email} (${user.role})` : 'null',
            authChecked
        })

        if (!loading) {
            if (!user) {
                console.log("❌ No user - redirecting to login")
                router.push("/login")
            } else if (user.role !== "super-admin") {
                console.log(`❌ Wrong role '${user.role}' - redirecting`)
                router.push("/login")
            } else {
                console.log("✅ Authentication successful")
                setAuthChecked(true)
                fetchAllData()
            }
        }
    }, [user, loading, router])

    // Fetch all data
    const fetchAllData = async () => {
        await Promise.all([
            fetchDepartments(),
            fetchAvailableHODs()
        ])
    }

    // Fetch departments
    const fetchDepartments = async () => {
        try {
            setLoadingStates(prev => ({ ...prev, departments: true }))
            setErrors(prev => ({ ...prev, departments: null }))
            console.log("🔄 Fetching departments...")

            const response = await academicsAPI.getDepartments()
            console.log("✅ Departments response:", response)

            if (response && !response.error) {
                let deptData: any[] = []

                if (Array.isArray(response)) {
                    deptData = response
                } else if (response.results) {
                    deptData = response.results
                }

                const processedDepartments: Department[] = deptData.map((dept: any) => ({
                    id: dept.id,
                    code: dept.code || '',
                    name: dept.name || '',
                    description: dept.description || '',
                    hod: dept.hod ? {
                        id: dept.hod.id || dept.hod.user?.id || 0,
                        name: dept.hod.name || dept.hod.full_name ||
                            `${dept.hod.first_name || ''} ${dept.hod.last_name || ''}`.trim() ||
                            dept.hod.user?.full_name,
                        staff_id: dept.hod.staff_id || dept.hod.staff_id_number || dept.hod.employee_id || '',
                        email: dept.hod.email || dept.hod.user?.email || ''
                    } : undefined,
                    student_count: dept.student_count || 0,
                    lecturer_count: dept.lecturer_count || 0,
                    course_count: dept.course_count || 0,
                    created_at: dept.created_at || dept.date_created || new Date().toISOString()
                }))

                setDepartments(processedDepartments)
                setFilteredDepartments(processedDepartments)

                console.log(`📊 Loaded ${processedDepartments.length} departments`)
            } else {
                throw new Error(response?.error?.detail || 'Failed to fetch departments')
            }
        } catch (error: any) {
            console.error('❌ Error fetching departments:', error)
            setErrors(prev => ({ ...prev, departments: error.message || 'Failed to load departments' }))
            toast.error("Failed to load departments", {
                description: error.message
            })
        } finally {
            setLoadingStates(prev => ({ ...prev, departments: false }))
        }
    }

    // Fetch available HODs
    const fetchAvailableHODs = async () => {
        try {
            setLoadingStates(prev => ({ ...prev, hods: true }))
            setErrors(prev => ({ ...prev, hods: null }))
            console.log("🔄 Fetching available HODs...")

            const response = await superAdminAPI.getAvailableHODs()
            console.log("✅ Available HODs response:", response)

            if (response && !response.error) {
                let hodData: any[] = []

                if (Array.isArray(response)) {
                    hodData = response
                } else if (response.results) {
                    hodData = response.results
                } else if (response.lecturers) {
                    hodData = response.lecturers
                }

                const mappedHODs: Lecturer[] = hodData
                    .filter((hod: any) => hod && (hod.id || hod.user_id || hod.staff_id))
                    .map((hod: any) => ({
                        id: hod.id || hod.user_id || 0,
                        name: hod.name || hod.full_name || `${hod.first_name || ''} ${hod.last_name || ''}`.trim() || 'Unknown',
                        staff_id: hod.staff_id || hod.staff_id_number || hod.employee_id || '',
                        email: hod.email || hod.user?.email || '',
                        department_id: hod.department_id || hod.department?.id || 0,
                        is_hod: hod.is_hod || false
                    }))
                    .filter(lecturer => lecturer.id && lecturer.id > 0)

                setAvailableHODs(mappedHODs)
                console.log(`📊 Loaded ${mappedHODs.length} available HODs`)
            } else {
                console.log("⚠️ Available HODs endpoint not found")
            }
        } catch (error: any) {
            console.error('❌ Error fetching available HODs:', error)
            setErrors(prev => ({ ...prev, hods: error.message || 'Failed to load HODs' }))
        } finally {
            setLoadingStates(prev => ({ ...prev, hods: false }))
        }
    }

    // Fetch all lecturers for assignment
    const fetchAllLecturers = async () => {
        try {
            setLoadingStates(prev => ({ ...prev, lecturers: true }))
            console.log("🔄 Fetching all lecturers...")

            const response = await academicsAPI.getLecturers()
            if (response && !response.error) {
                let lecturerData: any[] = []

                if (Array.isArray(response)) {
                    lecturerData = response
                } else if (response.results) {
                    lecturerData = response.results
                } else if (response.lecturers) {
                    lecturerData = response.lecturers
                }

                const mappedLecturers: Lecturer[] = lecturerData
                    .filter((lecturer: any) => lecturer && (lecturer.id || lecturer.user_id))
                    .map((lecturer: any) => ({
                        id: lecturer.id || lecturer.user_id || 0,
                        name: lecturer.name || lecturer.full_name ||
                            `${lecturer.user?.first_name || ''} ${lecturer.user?.last_name || ''}`.trim() || 'Unknown',
                        staff_id: lecturer.staff_id || lecturer.staff_id_number || '',
                        email: lecturer.email || lecturer.user?.email || '',
                        department_id: lecturer.department?.id || lecturer.department_id || 0,
                        is_hod: lecturer.is_hod || false
                    }))

                setAllLecturers(mappedLecturers)
            }
        } catch (error) {
            console.error('Error fetching lecturers:', error)
            toast.error("Failed to load lecturers")
        } finally {
            setLoadingStates(prev => ({ ...prev, lecturers: false }))
        }
    }

    // Effect to open dialog and fetch data
    useEffect(() => {
        if (showAssignLecturerDialog) {
            fetchAllLecturers()
            setSelectedLecturerId("")
        }
    }, [showAssignLecturerDialog])

    // Apply filters
    useEffect(() => {
        let filtered = [...departments]

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(dept =>
                dept.code.toLowerCase().includes(query) ||
                dept.name.toLowerCase().includes(query) ||
                (dept.description && dept.description.toLowerCase().includes(query)) ||
                (dept.hod?.name && dept.hod.name.toLowerCase().includes(query))
            )
        }

        // HOD filter
        if (filterHOD !== "all") {
            if (filterHOD === "assigned") {
                filtered = filtered.filter(dept => dept.hod)
            } else if (filterHOD === "unassigned") {
                filtered = filtered.filter(dept => !dept.hod)
            }
        }

        setFilteredDepartments(filtered)
        setCurrentPage(1) // Reset to first page when filters change
    }, [departments, searchQuery, filterHOD])

    // Calculate pagination
    const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedDepartments = filteredDepartments.slice(startIndex, endIndex)

    // Handle create department
    const handleCreateDepartment = async () => {
        try {
            console.log("🔄 Creating department:", newDepartment)

            if (!newDepartment.code || !newDepartment.name) {
                toast.error("Validation Error", {
                    description: "Code and name are required"
                })
                return
            }

            const deptData = {
                code: newDepartment.code.toUpperCase().trim(),
                name: newDepartment.name.trim(),
                description: newDepartment.description.trim() || undefined
            }

            const response = await academicsAPI.createDepartment(deptData)
            console.log("✅ Create department response:", response)

            if (response && !response.error) {
                // Refresh departments list
                await fetchDepartments()

                // Reset form
                setNewDepartment({
                    code: "",
                    name: "",
                    description: ""
                })

                // Close dialog
                setShowCreateDialog(false)

                toast.success("Department created successfully!")
            } else {
                throw new Error(response?.error?.detail || 'Failed to create department')
            }
        } catch (error: any) {
            console.error('❌ Error creating department:', error)
            toast.error("Failed to create department", {
                description: error.message
            })
        }
    }

    // Handle edit department
    const handleEditDepartment = async () => {
        if (!currentDepartment) return

        try {
            console.log("🔄 Updating department:", currentDepartment.id)

            const deptData = {
                code: currentDepartment.code.toUpperCase().trim(),
                name: currentDepartment.name.trim(),
                description: currentDepartment.description?.trim() || undefined
            }

            const response = await academicsAPI.updateDepartment(currentDepartment.id, deptData)
            console.log("✅ Update department response:", response)

            if (response && !response.error) {
                // Refresh departments list
                await fetchDepartments()

                // Close dialog
                setShowEditDialog(false)
                setCurrentDepartment(null)

                toast.success("Department updated successfully!")
            } else {
                throw new Error(response?.error?.detail || 'Failed to update department')
            }
        } catch (error: any) {
            console.error('❌ Error updating department:', error)
            toast.error("Failed to update department", {
                description: error.message
            })
        }
    }

    // Handle delete department
    const handleDeleteDepartment = async () => {
        if (!currentDepartment) return

        try {
            console.log("🔄 Deleting department:", currentDepartment.id)

            // Check if department has students, lecturers, or courses
            if ((currentDepartment.student_count || 0) > 0) {
                toast.error("Cannot delete department", {
                    description: "Department has students. Please transfer them first."
                })
                return
            }

            if ((currentDepartment.lecturer_count || 0) > 0) {
                toast.error("Cannot delete department", {
                    description: "Department has lecturers. Please reassign them first."
                })
                return
            }

            const response = await academicsAPI.deleteDepartment(currentDepartment.id)
            console.log("✅ Delete department response:", response)

            if (!response?.error) {
                // Refresh departments list
                await fetchDepartments()

                // Close dialog
                setShowDeleteDialog(false)
                setCurrentDepartment(null)

                toast.success("Department deleted successfully!")
            } else {
                throw new Error(response?.error?.detail || 'Failed to delete department')
            }
        } catch (error: any) {
            console.error('❌ Error deleting department:', error)
            toast.error("Failed to delete department", {
                description: error.message
            })
        }
    }

    // Handle assign HOD
    const handleAssignHOD = async (departmentId: number, lecturerId: number) => {
        try {
            console.log(`🔄 Assigning HOD ${lecturerId} to department ${departmentId}`)

            const response = await superAdminAPI.assignHOD(departmentId, lecturerId)
            console.log("✅ Assign HOD response:", response)

            if (response && !response.error) {
                // Refresh departments list
                await fetchDepartments()
                await fetchAvailableHODs()

                // Close dialog
                setShowAssignHODDialog(false)

                toast.success("HOD assigned successfully!")
            } else {
                throw new Error(response?.error?.detail || 'Failed to assign HOD')
            }
        } catch (error: any) {
            console.error('❌ Error assigning HOD:', error)
            toast.error("Failed to assign HOD", {
                description: error.message
            })
        }
    }

    // Handle remove HOD
    const handleRemoveHOD = async (departmentId: number) => {
        try {
            console.log(`🔄 Removing HOD from department ${departmentId}`)

            const response = await superAdminAPI.removeHOD(departmentId)
            console.log("✅ Remove HOD response:", response)

            if (response && !response.error) {
                // Refresh departments list
                await fetchDepartments()
                await fetchAvailableHODs()

                // Close dialog
                setShowRemoveHODDialog(false)

                toast.success("HOD removed successfully!")
            } else {
                throw new Error(response?.error?.detail || 'Failed to remove HOD')
            }
        } catch (error: any) {
            console.error('❌ Error removing HOD:', error)
            toast.error("Failed to remove HOD", {
                description: error.message
            })
        }
    }

    // Handle assign lecturer to department
    const handleAssignLecturer = async () => {
        if (!currentDepartment || !selectedLecturerId) return

        try {
            console.log(`🔄 Assigning lecturer ${selectedLecturerId} to department ${currentDepartment.id}`)

            const response = await userAPI.assignDepartment(parseInt(selectedLecturerId), currentDepartment.id)

            if (response && !response.error) {
                // Refresh departments list
                await fetchDepartments()

                // Close dialog
                setShowAssignLecturerDialog(false)
                setSelectedLecturerId("")

                toast.success("Lecturer assigned successfully!")
            } else {
                throw new Error(response?.error?.detail || 'Failed to assign lecturer')
            }
        } catch (error: any) {
            console.error('❌ Error assigning lecturer:', error)
            toast.error("Failed to assign lecturer", {
                description: error.message
            })
        }
    }

    // Reset filters
    const handleResetFilters = () => {
        setSearchQuery("")
        setFilterHOD("all")
    }

    // Format date
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString)
            if (isNaN(date.getTime())) {
                return "Invalid date"
            }
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
        } catch (error) {
            return "Invalid date"
        }
    }

    // Show loading during auth check
    if (loading || !authChecked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading departments management...</p>
                </div>
            </div>
        )
    }

    const isLoading = loadingStates.departments

    return (
        <DashboardLayout title="Departments Management" role="super-admin">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Departments Management</h1>
                        <p className="text-gray-500 mt-2">
                            Manage academic departments, assign HODs, and track department statistics
                        </p>
                    </div>
                    <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add New Department
                    </Button>
                </div>

                {/* Error Display */}
                {errors.departments && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-red-800">
                            <AlertCircle className="h-5 w-5" />
                            <span>Failed to load departments</span>
                        </div>
                        <div className="text-sm text-red-700 mt-2">
                            <p>{errors.departments}</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchDepartments}
                            className="mt-2"
                            disabled={isLoading}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            {isLoading ? "Retrying..." : "Retry"}
                        </Button>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{departments.length}</div>
                            <p className="text-xs text-muted-foreground">
                                {departments.filter(d => d.hod).length} with HODs
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                            <GraduationCap className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {departments.reduce((sum, dept) => sum + (dept.student_count || 0), 0).toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Across all departments
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Lecturers</CardTitle>
                            <Users className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {departments.reduce((sum, dept) => sum + (dept.lecturer_count || 0), 0).toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Academic staff members
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                            <BookOpen className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">
                                {departments.reduce((sum, dept) => sum + (dept.course_count || 0), 0).toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Academic courses offered
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                        <CardDescription>
                            Filter departments by name, code, or HOD status
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="search">Search</Label>
                                <Input
                                    id="search"
                                    placeholder="Search departments..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="hod-filter">HOD Status</Label>
                                <Select value={filterHOD} onValueChange={setFilterHOD}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Departments" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        <SelectItem value="assigned">With HOD Assigned</SelectItem>
                                        <SelectItem value="unassigned">Without HOD</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    onClick={handleResetFilters}
                                    disabled={!searchQuery && filterHOD === "all"}
                                    className="w-full"
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-4">
                            <p className="text-sm text-gray-500">
                                Showing {filteredDepartments.length} of {departments.length} departments
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchAllData}
                                disabled={isLoading}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                Refresh All
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Departments Table */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>All Departments</CardTitle>
                                <CardDescription>
                                    {isLoading ? "Loading departments..." : `Manage academic departments (${filteredDepartments.length} total)`}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading departments...</p>
                            </div>
                        ) : filteredDepartments.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No departments found</p>
                                <p className="text-sm">
                                    {departments.length === 0 ? "No departments in the system" : "Try adjusting your filters"}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Code & Name</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>HOD</TableHead>
                                                <TableHead>Statistics</TableHead>
                                                <TableHead>Created</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedDepartments.map((dept) => (
                                                <TableRow key={dept.id}>
                                                    <TableCell>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className="font-mono">
                                                                    {dept.code}
                                                                </Badge>
                                                                {!dept.hod && (
                                                                    <Badge variant="destructive" className="text-xs">
                                                                        No HOD
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="font-medium mt-1">{dept.name}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="text-sm text-gray-600 line-clamp-2">
                                                            {dept.description || "No description provided"}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            {dept.hod ? (
                                                                <>
                                                                    <p className="font-medium">{dept.hod.name || "Unknown Name"}</p>
                                                                    {dept.hod.staff_id && (
                                                                        <p className="text-xs text-gray-500">{dept.hod.staff_id}</p>
                                                                    )}
                                                                    {dept.hod.email && (
                                                                        <p className="text-xs text-gray-500">{dept.hod.email}</p>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <Badge variant="destructive" className="text-xs">
                                                                    Not Assigned
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-2">
                                                            <Badge variant="outline" className="gap-1">
                                                                <GraduationCap className="h-3 w-3" />
                                                                {dept.student_count || 0} Students
                                                            </Badge>
                                                            <Badge variant="outline" className="gap-1">
                                                                <Users className="h-3 w-3" />
                                                                {dept.lecturer_count || 0} Lecturers
                                                            </Badge>
                                                            <Badge variant="outline" className="gap-1">
                                                                <BookOpen className="h-3 w-3" />
                                                                {dept.course_count || 0} Courses
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-gray-400" />
                                                            <span className="text-sm text-gray-600">
                                                                {formatDate(dept.created_at)}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuItem onClick={() => {
                                                                    if (dept && dept.id) {
                                                                        setCurrentDepartment(dept)
                                                                        setShowEditDialog(true)
                                                                    }
                                                                }}>
                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                    Edit Department
                                                                </DropdownMenuItem>

                                                                {dept.hod ? (
                                                                    <>
                                                                        <DropdownMenuItem onClick={() => {
                                                                            if (dept && dept.id) {
                                                                                setCurrentDepartment(dept)
                                                                                setShowAssignHODDialog(true)
                                                                            }
                                                                        }}>
                                                                            <UserCog className="h-4 w-4 mr-2" />
                                                                            Change HOD
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => {
                                                                            if (dept && dept.id) {
                                                                                setCurrentDepartment(dept)
                                                                                setShowRemoveHODDialog(true)
                                                                            }
                                                                        }}>
                                                                            <XCircle className="h-4 w-4 mr-2" />
                                                                            Remove HOD
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                ) : (
                                                                    <DropdownMenuItem onClick={() => {
                                                                        if (dept && dept.id) {
                                                                            setCurrentDepartment(dept)
                                                                            setShowAssignHODDialog(true)
                                                                        }
                                                                    }}>
                                                                        <UserCog className="h-4 w-4 mr-2" />
                                                                        Assign HOD
                                                                    </DropdownMenuItem>
                                                                )}

                                                                <DropdownMenuSeparator />

                                                                <DropdownMenuItem onClick={() => {
                                                                    if (dept && dept.id) {
                                                                        setCurrentDepartment(dept)
                                                                        setShowAssignLecturerDialog(true)
                                                                    }
                                                                }}>
                                                                    <UserPlus className="h-4 w-4 mr-2" />
                                                                    Assign Lecturer
                                                                </DropdownMenuItem>

                                                                <DropdownMenuSeparator />

                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => {
                                                                        if (dept && dept.id) {
                                                                            setCurrentDepartment(dept)
                                                                            setShowDeleteDialog(true)
                                                                        } else {
                                                                            toast.error("Cannot delete", {
                                                                                description: "Department information is incomplete"
                                                                            })
                                                                        }
                                                                    }}
                                                                    disabled={(dept.student_count || 0) > 0 || (dept.lecturer_count || 0) > 0}
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Delete Department
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <p className="text-sm text-gray-500">
                                            Page {currentPage} of {totalPages} • {filteredDepartments.length} departments
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={currentPage === totalPages}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Create Department Dialog */}
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Create New Department</DialogTitle>
                            <DialogDescription>
                                Add a new academic department to the system
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="dept-code">Department Code *</Label>
                                <Input
                                    id="dept-code"
                                    placeholder="e.g., CSC"
                                    value={newDepartment.code}
                                    onChange={(e) => setNewDepartment({ ...newDepartment, code: e.target.value })}
                                />
                                <p className="text-xs text-gray-500">Short code for the department (usually 3-4 letters)</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dept-name">Department Name *</Label>
                                <Input
                                    id="dept-name"
                                    placeholder="e.g., Computer Science"
                                    value={newDepartment.name}
                                    onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dept-description">Description (Optional)</Label>
                                <Textarea
                                    id="dept-description"
                                    placeholder="Brief description of the department..."
                                    value={newDepartment.description}
                                    onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateDepartment} disabled={!newDepartment.code || !newDepartment.name}>
                                Create Department
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Department Dialog */}
                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Edit Department</DialogTitle>
                            <DialogDescription>
                                Update department information
                            </DialogDescription>
                        </DialogHeader>

                        {currentDepartment && (
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-dept-code">Department Code</Label>
                                    <Input
                                        id="edit-dept-code"
                                        value={currentDepartment.code}
                                        onChange={(e) => setCurrentDepartment({ ...currentDepartment, code: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-dept-name">Department Name</Label>
                                    <Input
                                        id="edit-dept-name"
                                        value={currentDepartment.name}
                                        onChange={(e) => setCurrentDepartment({ ...currentDepartment, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-dept-description">Description</Label>
                                    <Textarea
                                        id="edit-dept-description"
                                        value={currentDepartment.description || ""}
                                        onChange={(e) => setCurrentDepartment({ ...currentDepartment, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                setShowEditDialog(false)
                                setCurrentDepartment(null)
                            }}>
                                Cancel
                            </Button>
                            <Button onClick={handleEditDepartment}>
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Assign HOD Dialog */}
                <Dialog open={showAssignHODDialog} onOpenChange={setShowAssignHODDialog}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {currentDepartment?.hod ? 'Change HOD' : 'Assign HOD'}
                            </DialogTitle>
                            <DialogDescription>
                                Select a lecturer from <strong>{currentDepartment?.name}</strong> to appoint as HOD.
                            </DialogDescription>
                        </DialogHeader>

                        {currentDepartment && (
                            <div className="space-y-4 py-4">
                                {currentDepartment.hod && (
                                    <div className="space-y-2">
                                        <Label>Current HOD</Label>
                                        <div className="bg-gray-50 p-3 rounded-md">
                                            <p className="font-medium">{currentDepartment.hod.name || "Unknown Name"}</p>
                                            {currentDepartment.hod.staff_id && (
                                                <p className="text-sm text-gray-500">{currentDepartment.hod.staff_id}</p>
                                            )}
                                            {currentDepartment.hod.email && (
                                                <p className="text-sm text-gray-500">{currentDepartment.hod.email}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="hod-select">Select New HOD</Label>
                                    <Select
                                        onValueChange={(value) => {
                                            if (value && currentDepartment) {
                                                handleAssignHOD(currentDepartment.id, parseInt(value))
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a lecturer..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableHODs
                                                // STRICT FILTER: Only show lecturers from this department
                                                .filter(l => l.department_id === currentDepartment.id)
                                                .map((l) => (
                                                    <SelectItem key={l.id} value={l.id.toString()}>
                                                        {l.name} {l.is_hod ? '(Current HOD elsewhere)' : ''}
                                                    </SelectItem>
                                                ))}
                                            {availableHODs.filter(l => l.department_id === currentDepartment.id).length === 0 && (
                                                <div className="p-2 text-sm text-muted-foreground text-center">
                                                    No lecturers found in this department. <br />
                                                    Assign lecturers to this department first.
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                setShowAssignHODDialog(false)
                                setCurrentDepartment(null)
                            }}>
                                Cancel
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Assign Lecturer Dialog */}
                <Dialog open={showAssignLecturerDialog} onOpenChange={setShowAssignLecturerDialog}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Assign Lecturer to Department</DialogTitle>
                            <DialogDescription>
                                Add a lecturer to <strong>{currentDepartment?.name}</strong>.
                                This will update their department assignment.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="select-lecturer">Select Lecturer *</Label>
                                <Select value={selectedLecturerId} onValueChange={setSelectedLecturerId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={
                                            loadingStates.lecturers ? "Loading lecturers..." : "Select a lecturer"
                                        } />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        {allLecturers.map((lecturer) => (
                                            <SelectItem key={lecturer.id} value={lecturer.id.toString()}>
                                                {lecturer.name} {lecturer.staff_id ? `(${lecturer.staff_id})` : ''}
                                                {lecturer.department_id === currentDepartment?.id && " (Already assigned)"}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAssignLecturerDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAssignLecturer} disabled={!selectedLecturerId}>
                                Assign Lecturer
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Remove HOD Confirmation Dialog */}
                <AlertDialog open={showRemoveHODDialog} onOpenChange={setShowRemoveHODDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Remove HOD</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm text-muted-foreground">
                                Are you sure you want to remove{" "}
                                <span className="font-semibold">{currentDepartment?.hod?.name || "the current HOD"}</span> as Head of Department from{" "}
                                <span className="font-semibold">{currentDepartment?.name}</span>?
                                <span className="block mt-2 bg-yellow-50 p-3 rounded-md">
                                    <span className="flex items-center text-sm text-yellow-800">
                                        <AlertCircle className="h-4 w-4 mr-1" />
                                        This action will revoke HOD privileges but the lecturer will remain in the department.
                                    </span>
                                </span>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setCurrentDepartment(null)}>
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => currentDepartment && handleRemoveHOD(currentDepartment.id)}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Remove HOD
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Department</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the department{" "}
                                <span className="font-semibold">{currentDepartment?.code} - {currentDepartment?.name}</span>.

                                {currentDepartment && (currentDepartment.student_count || 0) > 0 && (
                                    <span className="block mt-2 bg-red-50 p-3 rounded-md">
                                        <span className="flex items-center text-sm text-red-800">
                                            <AlertCircle className="h-4 w-4 mr-1" />
                                            This department has {currentDepartment?.student_count} students. You cannot delete it until all students are transferred.
                                        </span>
                                    </span>
                                )}

                                {currentDepartment && (currentDepartment.lecturer_count || 0) > 0 && (
                                    <span className="block mt-2 bg-red-50 p-3 rounded-md">
                                        <span className="flex items-center text-sm text-red-800">
                                            <AlertCircle className="h-4 w-4 mr-1" />
                                            This department has {currentDepartment?.lecturer_count} lecturers. You cannot delete it until all lecturers are reassigned.
                                        </span>
                                    </span>
                                )}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setCurrentDepartment(null)}>
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteDepartment}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={(currentDepartment?.student_count || 0) > 0 || (currentDepartment?.lecturer_count || 0) > 0}
                            >
                                Delete Department
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    )
}