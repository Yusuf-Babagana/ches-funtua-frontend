// app/dashboard/super-admin/courses/page.tsx
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
    BookOpen,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    XCircle
} from "lucide-react"
import { academicsAPI, superAdminAPI, userAPI } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

interface Course {
    id: number
    code: string
    title: string
    credits: number
    description: string
    semester: string
    level: string
    is_active: boolean
    is_elective: boolean
    prerequisites: number[]
    department: number | {
        id: number
        name: string
        code: string
    }
    lecturer?: {
        id: number
        name: string
        staff_id: string
    }
    created_at: string
    updated_at: string
}

interface Department {
    id: number
    name: string
    code: string
}

interface Lecturer {
    id: number
    name: string
    staff_id: string
    department_id: number
}

export default function SuperAdminCoursesPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [authChecked, setAuthChecked] = useState(false)

    // State management
    const [courses, setCourses] = useState<Course[]>([])
    const [departments, setDepartments] = useState<Department[]>([])
    const [lecturers, setLecturers] = useState<Lecturer[]>([])
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
    const [adminStats, setAdminStats] = useState<any>(null)

    // UI states
    const [loadingStates, setLoadingStates] = useState({
        courses: true,
        departments: true,
        lecturers: true
    })
    const [errors, setErrors] = useState({
        courses: null as string | null,
        departments: null as string | null,
        lecturers: null as string | null
    })

    // Dialog states
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showAssignDialog, setShowAssignDialog] = useState(false)

    // Form states
    const [currentCourse, setCurrentCourse] = useState<Course | null>(null)
    const [newCourse, setNewCourse] = useState({
        code: "",
        title: "",
        credits: 3,
        description: "",
        semester: "first",
        level: "100",
        is_active: true,
        is_elective: false,
        department_id: "",
        prerequisites: [] as number[]
    })

    // Filter states
    const [searchQuery, setSearchQuery] = useState("")
    const [filterDepartment, setFilterDepartment] = useState("all")
    const [filterLevel, setFilterLevel] = useState("all")
    const [filterSemester, setFilterSemester] = useState("all")
    const [filterStatus, setFilterStatus] = useState("all")

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Check authentication
    useEffect(() => {
        console.log("🔍 SUPERADMIN COURSES DEBUG:", {
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
            fetchCourses(),
            fetchDepartments(),
            fetchLecturers(),
            fetchStats()
        ])
    }

    // Fetch courses
    const fetchCourses = async () => {
        try {
            setLoadingStates(prev => ({ ...prev, courses: true }))
            setErrors(prev => ({ ...prev, courses: null }))
            console.log("🔄 Fetching courses...")

            const response = await academicsAPI.getCourses()
            console.log("✅ Courses response:", response)

            if (response && !response.error) {
                let coursesData: Course[] = []

                if (Array.isArray(response)) {
                    coursesData = response
                } else if (response.results) {
                    coursesData = response.results
                }

                setCourses(coursesData)
                setFilteredCourses(coursesData)
                console.log(`📊 Loaded ${coursesData.length} courses`)
            } else {
                throw new Error(response?.error?.detail || 'Failed to fetch courses')
            }
        } catch (error: any) {
            console.error('❌ Error fetching courses:', error)
            setErrors(prev => ({ ...prev, courses: error.message || 'Failed to load courses' }))
        } finally {
            setLoadingStates(prev => ({ ...prev, courses: false }))
        }
    }

    // Fetch departments
    const fetchDepartments = async () => {
        try {
            setLoadingStates(prev => ({ ...prev, departments: true }))
            setErrors(prev => ({ ...prev, departments: null }))

            const response = await academicsAPI.getDepartments()
            console.log("✅ Departments response:", response)

            if (response && !response.error) {
                let deptData: Department[] = []

                if (Array.isArray(response)) {
                    deptData = response
                } else if (response.results) {
                    deptData = response.results
                }

                setDepartments(deptData)
                console.log(`📊 Loaded ${deptData.length} departments`)
            } else {
                throw new Error(response?.error?.detail || 'Failed to fetch departments')
            }
        } catch (error: any) {
            console.error('❌ Error fetching departments:', error)
            setErrors(prev => ({ ...prev, departments: error.message || 'Failed to load departments' }))
        } finally {
            setLoadingStates(prev => ({ ...prev, departments: false }))
        }
    }

    // Fetch lecturers
    const fetchLecturers = async () => {
        try {
            setLoadingStates(prev => ({ ...prev, lecturers: true }))
            setErrors(prev => ({ ...prev, lecturers: null }))

            const response = await academicsAPI.getLecturers()
            console.log("✅ Lecturers response:", response)

            if (response && !response.error) {
                let lecturerData: Lecturer[] = []

                if (Array.isArray(response)) {
                    lecturerData = response
                } else if (response.results) {
                    lecturerData = response.results
                }

                setLecturers(lecturerData)
                console.log(`📊 Loaded ${lecturerData.length} lecturers`)
            } else {
                // This is optional, so don't throw error
                console.log('⚠️ Lecturers endpoint might not exist yet')
            }
        } catch (error: any) {
            console.error('❌ Error fetching lecturers:', error)
            // Don't set error for lecturers - it's optional
        } finally {
            setLoadingStates(prev => ({ ...prev, lecturers: false }))
        }
    }

    // Fetch stats
    const fetchStats = async () => {
        try {
            const stats = await userAPI.getSuperAdminStats()
            if (stats && !stats.error) {
                setAdminStats(stats)
            }
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    // Apply filters
    useEffect(() => {
        let filtered = [...courses]

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(course =>
                course.code.toLowerCase().includes(query) ||
                course.title.toLowerCase().includes(query) ||
                course.description.toLowerCase().includes(query)
            )
        }

        // Department filter
        if (filterDepartment !== "all") {
            filtered = filtered.filter(course => {
                const deptId = typeof course.department === 'object' ? course.department.id : course.department
                return deptId.toString() === filterDepartment
            })
        }

        // Level filter
        if (filterLevel !== "all") {
            filtered = filtered.filter(course => course.level === filterLevel)
        }

        // Semester filter
        if (filterSemester !== "all") {
            filtered = filtered.filter(course => course.semester === filterSemester)
        }

        // Status filter
        if (filterStatus !== "all") {
            const isActive = filterStatus === "active"
            filtered = filtered.filter(course => course.is_active === isActive)
        }

        setFilteredCourses(filtered)
        setCurrentPage(1) // Reset to first page when filters change
    }, [courses, searchQuery, filterDepartment, filterLevel, filterSemester, filterStatus])

    // Calculate pagination
    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedCourses = filteredCourses.slice(startIndex, endIndex)

    // Handle create course
    const handleCreateCourse = async () => {
        try {
            console.log("🔄 Creating course:", newCourse)

            const courseData = {
                code: newCourse.code.toUpperCase(),
                title: newCourse.title,
                credits: newCourse.credits,
                description: newCourse.description,
                semester: newCourse.semester,
                level: newCourse.level,
                is_active: newCourse.is_active,
                is_elective: newCourse.is_elective,
                department: newCourse.department_id,
                prerequisites: newCourse.prerequisites
            }

            const response = await academicsAPI.createCourse(courseData)
            console.log("✅ Create course response:", response)

            if (response && !response.error) {
                // Refresh courses list
                await fetchCourses()

                // Reset form
                setNewCourse({
                    code: "",
                    title: "",
                    credits: 3,
                    description: "",
                    semester: "first",
                    level: "100",
                    is_active: true,
                    is_elective: false,
                    department_id: "",
                    prerequisites: []
                })

                // Close dialog
                setShowCreateDialog(false)

                alert("Course created successfully!")
            } else {
                throw new Error(response?.error?.detail || 'Failed to create course')
            }
        } catch (error: any) {
            console.error('❌ Error creating course:', error)
            alert(`Error creating course: ${error.message}`)
        }
    }

    // Handle edit course
    const handleEditCourse = async () => {
        if (!currentCourse) return

        try {
            console.log("🔄 Updating course:", currentCourse.id)

            const courseData = {
                code: currentCourse.code.toUpperCase(),
                title: currentCourse.title,
                credits: currentCourse.credits,
                description: currentCourse.description,
                semester: currentCourse.semester,
                level: currentCourse.level,
                is_active: currentCourse.is_active,
                is_elective: currentCourse.is_elective,
                department: typeof currentCourse.department === 'object' ? currentCourse.department.id : currentCourse.department,
                prerequisites: currentCourse.prerequisites
            }

            const response = await academicsAPI.updateCourse(currentCourse.id, courseData)
            console.log("✅ Update course response:", response)

            if (response && !response.error) {
                // Refresh courses list
                await fetchCourses()

                // Close dialog
                setShowEditDialog(false)
                setCurrentCourse(null)

                alert("Course updated successfully!")
            } else {
                throw new Error(response?.error?.detail || 'Failed to update course')
            }
        } catch (error: any) {
            console.error('❌ Error updating course:', error)
            alert(`Error updating course: ${error.message}`)
        }
    }

    // Handle delete course
    const handleDeleteCourse = async () => {
        if (!currentCourse) return

        try {
            console.log("🔄 Deleting course:", currentCourse.id)

            const response = await academicsAPI.deleteCourse(currentCourse.id)
            console.log("✅ Delete course response:", response)

            if (!response?.error) {
                // Refresh courses list
                await fetchCourses()

                // Close dialog
                setShowDeleteDialog(false)
                setCurrentCourse(null)

                alert("Course deleted successfully!")
            } else {
                throw new Error(response?.error?.detail || 'Failed to delete course')
            }
        } catch (error: any) {
            console.error('❌ Error deleting course:', error)
            alert(`Error deleting course: ${error.message}`)
        }
    }

    // Handle assign lecturer
    const handleAssignLecturer = async (courseId: number, lecturerId: number) => {
        try {
            console.log(`🔄 Assigning lecturer ${lecturerId} to course ${courseId}`)

            const response = await superAdminAPI.assignLecturer(courseId, lecturerId)
            console.log("✅ Assign lecturer response:", response)

            if (response && !response.error) {
                // Refresh courses list
                await fetchCourses()

                // Close dialog
                setShowAssignDialog(false)

                alert("Lecturer assigned successfully!")
            } else {
                throw new Error(response?.error?.detail || 'Failed to assign lecturer')
            }
        } catch (error: any) {
            console.error('❌ Error assigning lecturer:', error)
            alert(`Error assigning lecturer: ${error.message}`)
        }
    }

    // Toggle course status
    const handleToggleStatus = async (course: Course) => {
        try {
            console.log(`🔄 Toggling status for course ${course.id}`)

            const updatedCourse = {
                ...course,
                is_active: !course.is_active
            }

            const response = await academicsAPI.updateCourse(course.id, updatedCourse)
            console.log("✅ Toggle status response:", response)

            if (response && !response.error) {
                // Refresh courses list
                await fetchCourses()

                alert(`Course ${course.is_active ? 'deactivated' : 'activated'} successfully!`)
            } else {
                throw new Error(response?.error?.detail || 'Failed to update course status')
            }
        } catch (error: any) {
            console.error('❌ Error toggling course status:', error)
            alert(`Error updating course: ${error.message}`)
        }
    }

    // Reset filters
    const handleResetFilters = () => {
        setSearchQuery("")
        setFilterDepartment("all")
        setFilterLevel("all")
        setFilterSemester("all")
        setFilterStatus("all")
    }

    // Get department name by ID
    const getDepartmentName = (id: number) => {
        const dept = departments.find(d => d.id === id)
        return dept ? dept.name : "Unknown"
    }

    // Get lecturer name by ID
    const getLecturerName = (id?: number) => {
        if (!id) return "Not Assigned"
        const lecturer = lecturers.find(l => l.id === id)
        return lecturer ? lecturer.name : "Unknown"
    }

    // Show loading during auth check
    if (loading || !authChecked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading super admin courses...</p>
                </div>
            </div>
        )
    }

    const isLoading = loadingStates.courses || loadingStates.departments

    return (
        <DashboardLayout title="Courses Management" role="super-admin">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Courses Management</h1>
                        <p className="text-gray-500 mt-2">
                            Manage all courses, assign lecturers, and track academic offerings
                        </p>
                    </div>
                    <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add New Course
                    </Button>
                </div>

                {/* Error Display */}
                {(errors.courses || errors.departments) && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-red-800">
                            <AlertCircle className="h-5 w-5" />
                            <span>Some data failed to load</span>
                        </div>
                        <div className="text-sm text-red-700 mt-2">
                            {errors.courses && <p>Courses: {errors.courses}</p>}
                            {errors.departments && <p>Departments: {errors.departments}</p>}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchAllData}
                            className="mt-2"
                            disabled={isLoading}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            {isLoading ? "Retrying..." : "Retry All"}
                        </Button>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {(adminStats?.academics?.courses?.total || courses.length).toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {courses.filter(c => c.is_active).length} active • {courses.filter(c => !c.is_active).length} inactive
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">With Lecturers</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {(adminStats?.academics?.courses?.with_lecturers || courses.filter(c => c.lecturer).length).toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {((courses.filter(c => c.lecturer).length / courses.length) * 100).toFixed(1)}% coverage
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Without Lecturers</CardTitle>
                            <XCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {(adminStats ? (adminStats.academics.courses.total - adminStats.academics.courses.with_lecturers) : courses.filter(c => !c.lecturer).length).toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Needs lecturer assignment
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Departments</CardTitle>
                            <Filter className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">
                                {departments.length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {new Set(courses.map(c => typeof c.department === 'object' ? c.department.id : c.department)).size} with courses
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                        <CardDescription>
                            Filter courses by department, level, semester, and status
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                            <div className="space-y-2">
                                <Label htmlFor="search">Search</Label>
                                <Input
                                    id="search"
                                    placeholder="Search courses..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Departments" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {departments.map(dept => (
                                            <SelectItem key={dept.id} value={dept.id.toString()}>
                                                {dept.name} ({dept.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="level">Level</Label>
                                <Select value={filterLevel} onValueChange={setFilterLevel}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Levels" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Levels</SelectItem>
                                        <SelectItem value="100">100 Level</SelectItem>
                                        <SelectItem value="200">200 Level</SelectItem>
                                        <SelectItem value="300">300 Level</SelectItem>
                                        <SelectItem value="400">400 Level</SelectItem>
                                        <SelectItem value="500">500 Level</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="semester">Semester</Label>
                                <Select value={filterSemester} onValueChange={setFilterSemester}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Semesters" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Semesters</SelectItem>
                                        <SelectItem value="first">First Semester</SelectItem>
                                        <SelectItem value="second">Second Semester</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="active">Active Only</SelectItem>
                                        <SelectItem value="inactive">Inactive Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-4">
                            <p className="text-sm text-gray-500">
                                Showing {filteredCourses.length} of {courses.length} courses
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleResetFilters}
                                disabled={!searchQuery && filterDepartment === "all" && filterLevel === "all" && filterSemester === "all" && filterStatus === "all"}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Courses Table */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>All Courses</CardTitle>
                                <CardDescription>
                                    {isLoading ? "Loading courses..." : `Manage your academic courses (${filteredCourses.length} total)`}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={fetchAllData}
                                    disabled={isLoading}
                                >
                                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading courses...</p>
                            </div>
                        ) : filteredCourses.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No courses found</p>
                                <p className="text-sm">
                                    {courses.length === 0 ? "No courses in the system" : "Try adjusting your filters"}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Code</TableHead>
                                                <TableHead>Title</TableHead>
                                                <TableHead>Department</TableHead>
                                                <TableHead>Level/Sem</TableHead>
                                                <TableHead>Lecturer</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedCourses.map((course) => (
                                                <TableRow key={course.id}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="font-mono">
                                                                {course.code}
                                                            </Badge>
                                                            {course.is_elective && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    Elective
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium">{course.title}</p>
                                                            <p className="text-xs text-gray-500 line-clamp-1">
                                                                {course.description || "No description"}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <p>
                                                                {(() => {
                                                                    if (typeof course.department === 'object' && course.department !== null) {
                                                                        return course.department.name
                                                                    }
                                                                    const dept = departments.find(d => d.id === course.department)
                                                                    return dept ? dept.name : "Unknown Department"
                                                                })()}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {(() => {
                                                                    if (typeof course.department === 'object' && course.department !== null) {
                                                                        return course.department.code
                                                                    }
                                                                    const dept = departments.find(d => d.id === course.department)
                                                                    return dept ? dept.code : ""
                                                                })()}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <Badge variant="outline" className="w-fit">
                                                                {course.level} Level
                                                            </Badge>
                                                            <span className="text-xs text-gray-500 mt-1">
                                                                {course.semester === "first" ? "First Semester" : "Second Semester"}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            {course.lecturer ? (
                                                                <>
                                                                    <p className="font-medium">{course.lecturer.name}</p>
                                                                    <p className="text-xs text-gray-500">{course.lecturer.staff_id}</p>
                                                                </>
                                                            ) : (
                                                                <Badge variant="destructive" className="text-xs">
                                                                    Not Assigned
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`h-2 w-2 rounded-full ${course.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                                            <span className={`text-sm ${course.is_active ? 'text-green-700' : 'text-red-700'}`}>
                                                                {course.is_active ? 'Active' : 'Inactive'}
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
                                                                    setCurrentCourse(course)
                                                                    setShowEditDialog(true)
                                                                }}>
                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                    Edit Course
                                                                </DropdownMenuItem>

                                                                <DropdownMenuItem onClick={() => {
                                                                    setCurrentCourse(course)
                                                                    setShowAssignDialog(true)
                                                                }}>
                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                    Assign Lecturer
                                                                </DropdownMenuItem>

                                                                <DropdownMenuItem onClick={() => handleToggleStatus(course)}>
                                                                    <Switch className="h-4 w-4 mr-2" />
                                                                    {course.is_active ? 'Deactivate' : 'Activate'}
                                                                </DropdownMenuItem>

                                                                <DropdownMenuSeparator />

                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => {
                                                                        setCurrentCourse(course)
                                                                        setShowDeleteDialog(true)
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Delete Course
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
                                            Page {currentPage} of {totalPages}
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

                {/* Create Course Dialog */}
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create New Course</DialogTitle>
                            <DialogDescription>
                                Add a new course to the academic catalog
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="course-code">Course Code *</Label>
                                    <Input
                                        id="course-code"
                                        placeholder="e.g., CSC101"
                                        value={newCourse.code}
                                        onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="course-title">Course Title *</Label>
                                    <Input
                                        id="course-title"
                                        placeholder="e.g., Introduction to Computer Science"
                                        value={newCourse.title}
                                        onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="credits">Credits</Label>
                                    <Select
                                        value={newCourse.credits.toString()}
                                        onValueChange={(value) => setNewCourse({ ...newCourse, credits: parseInt(value) })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select credits" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[1, 2, 3, 4, 5, 6].map(credit => (
                                                <SelectItem key={credit} value={credit.toString()}>
                                                    {credit} Credit{credit > 1 ? 's' : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="level">Level</Label>
                                    <Select
                                        value={newCourse.level}
                                        onValueChange={(value) => setNewCourse({ ...newCourse, level: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {["100", "200", "300", "400", "500"].map(level => (
                                                <SelectItem key={level} value={level}>
                                                    {level} Level
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="semester">Semester</Label>
                                    <Select
                                        value={newCourse.semester}
                                        onValueChange={(value) => setNewCourse({ ...newCourse, semester: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select semester" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="first">First Semester</SelectItem>
                                            <SelectItem value="second">Second Semester</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="department">Department *</Label>
                                <Select
                                    value={newCourse.department_id}
                                    onValueChange={(value) => setNewCourse({ ...newCourse, department_id: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map(dept => (
                                            <SelectItem key={dept.id} value={dept.id.toString()}>
                                                {dept.name} ({dept.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Course description..."
                                    value={newCourse.description}
                                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="flex items-center justify-between space-x-2">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={newCourse.is_active}
                                        onCheckedChange={(checked) => setNewCourse({ ...newCourse, is_active: checked })}
                                        id="active-status"
                                    />
                                    <Label htmlFor="active-status">Active Course</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={newCourse.is_elective}
                                        onCheckedChange={(checked) => setNewCourse({ ...newCourse, is_elective: checked })}
                                        id="elective-status"
                                    />
                                    <Label htmlFor="elective-status">Elective Course</Label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Prerequisites (Optional)</Label>
                                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border rounded">
                                    {courses.map(course => (
                                        <div key={course.id} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={`prereq-${course.id}`}
                                                checked={newCourse.prerequisites.includes(course.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setNewCourse({
                                                            ...newCourse,
                                                            prerequisites: [...newCourse.prerequisites, course.id]
                                                        })
                                                    } else {
                                                        setNewCourse({
                                                            ...newCourse,
                                                            prerequisites: newCourse.prerequisites.filter(id => id !== course.id)
                                                        })
                                                    }
                                                }}
                                            />
                                            <Label htmlFor={`prereq-${course.id}`} className="text-sm cursor-pointer">
                                                {course.code} - {course.title}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {newCourse.prerequisites.length > 0 && (
                                    <p className="text-sm text-gray-500">
                                        Selected: {newCourse.prerequisites.map(id => {
                                            const course = courses.find(c => c.id === id)
                                            return course?.code
                                        }).join(', ')}
                                    </p>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateCourse} disabled={!newCourse.code || !newCourse.title || !newCourse.department_id}>
                                Create Course
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Course Dialog */}
                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Edit Course</DialogTitle>
                            <DialogDescription>
                                Update course information
                            </DialogDescription>
                        </DialogHeader>

                        {currentCourse && (
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-course-code">Course Code</Label>
                                        <Input
                                            id="edit-course-code"
                                            value={currentCourse.code}
                                            onChange={(e) => setCurrentCourse({ ...currentCourse, code: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-course-title">Course Title</Label>
                                        <Input
                                            id="edit-course-title"
                                            value={currentCourse.title}
                                            onChange={(e) => setCurrentCourse({ ...currentCourse, title: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-credits">Credits</Label>
                                        <Input
                                            id="edit-credits"
                                            type="number"
                                            value={currentCourse.credits}
                                            onChange={(e) => setCurrentCourse({ ...currentCourse, credits: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-level">Level</Label>
                                        <Select
                                            value={currentCourse.level}
                                            onValueChange={(value) => setCurrentCourse({ ...currentCourse, level: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {["100", "200", "300"].map(level => (
                                                    <SelectItem key={level} value={level}>
                                                        {level} Level
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-semester">Semester</Label>
                                        <Select
                                            value={currentCourse.semester}
                                            onValueChange={(value) => setCurrentCourse({ ...currentCourse, semester: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select semester" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="first">First Semester</SelectItem>
                                                <SelectItem value="second">Second Semester</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-description">Description</Label>
                                    <Textarea
                                        id="edit-description"
                                        value={currentCourse.description}
                                        onChange={(e) => setCurrentCourse({ ...currentCourse, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>

                                <div className="flex items-center justify-between space-x-2">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={currentCourse.is_active}
                                            onCheckedChange={(checked) => setCurrentCourse({ ...currentCourse, is_active: checked })}
                                            id="edit-active-status"
                                        />
                                        <Label htmlFor="edit-active-status">Active Course</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={currentCourse.is_elective}
                                            onCheckedChange={(checked) => setCurrentCourse({ ...currentCourse, is_elective: checked })}
                                            id="edit-elective-status"
                                        />
                                        <Label htmlFor="edit-elective-status">Elective Course</Label>
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                setShowEditDialog(false)
                                setCurrentCourse(null)
                            }}>
                                Cancel
                            </Button>
                            <Button onClick={handleEditCourse}>
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Assign Lecturer Dialog */}
                <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Assign Lecturer</DialogTitle>
                            <DialogDescription>
                                Assign a lecturer to {currentCourse?.code} - {currentCourse?.title}
                            </DialogDescription>
                        </DialogHeader>

                        {currentCourse && (
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Current Lecturer</Label>
                                    <p className="text-sm">
                                        {currentCourse.lecturer
                                            ? `${currentCourse.lecturer.name} (${currentCourse.lecturer.staff_id})`
                                            : "No lecturer assigned"}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lecturer-select">Select Lecturer</Label>
                                    <Select
                                        value=""
                                        onValueChange={(value) => {
                                            if (value && currentCourse) {
                                                handleAssignLecturer(currentCourse.id, parseInt(value))
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a lecturer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {lecturers
                                                .filter(lecturer => lecturer.department_id === (typeof currentCourse.department === 'object' ? currentCourse.department.id : currentCourse.department))
                                                .map(lecturer => (
                                                    <SelectItem key={lecturer.id} value={lecturer.id.toString()}>
                                                        {lecturer.name} ({lecturer.staff_id})
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-gray-500">
                                        Only lecturers from {currentCourse.department.name} department are shown
                                    </p>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                setShowAssignDialog(false)
                                setCurrentCourse(null)
                            }}>
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the course{" "}
                                <span className="font-semibold">{currentCourse?.code} - {currentCourse?.title}</span>
                                {currentCourse?.lecturer && (
                                    <span> and remove lecturer assignment</span>
                                )}.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setCurrentCourse(null)}>
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteCourse}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Delete Course
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    )
}