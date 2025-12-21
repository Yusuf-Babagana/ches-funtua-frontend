"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { UsersTable } from "@/components/users/users-table"
import { Button } from "@/components/ui/button"
import { Plus, Download, RefreshCw, Loader2 } from "lucide-react"
import { userAPI, authAPI, academicsAPI } from "@/lib/api"
import { toast } from "sonner"

interface User {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  role: string
  phone: string
  is_active: boolean
  created_at: string
  full_name: string
}

interface UserStats {
  total_users: number
  active_users: number
  inactive_users: number
  role_breakdown: {
    students: number
    lecturers: number
    staff: number
  }
}

// Simple stats display component
function UserStats({ stats, loading }: { stats: UserStats | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="text-2xl font-bold text-gray-900">{stats.total_users}</div>
        <div className="text-sm text-gray-600">Total Users</div>
      </div>
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="text-2xl font-bold text-green-600">{stats.active_users}</div>
        <div className="text-sm text-gray-600">Active Users</div>
      </div>
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="text-2xl font-bold text-blue-600">{stats.role_breakdown.students}</div>
        <div className="text-sm text-gray-600">Students</div>
      </div>
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="text-2xl font-bold text-purple-600">
          {stats.role_breakdown.lecturers + stats.role_breakdown.staff}
        </div>
        <div className="text-sm text-gray-600">Staff & Lecturers</div>
      </div>
    </div>
  )
}

// Create user modal
function CreateUserModal({ open, onClose, onUserCreated }: {
  open: boolean;
  onClose: () => void;
  onUserCreated: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<any[]>([])

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    first_name: "",
    last_name: "",
    role: "student",
    phone: "",
    password: "",
    password_confirm: "",
    department_id: ""
  })

  // Fetch departments on mount
  useEffect(() => {
    if (open) {
      const fetchDepts = async () => {
        try {
          const res = await academicsAPI.getDepartments();
          if (res && !res.error) {
            setDepartments(Array.isArray(res) ? res : res.results || []);
          }
        } catch (e) {
          console.error("Failed to load departments");
        }
      };
      fetchDepts();
    }
  }, [open]);

  // Roles that require a department
  const needsDepartment = ['student', 'lecturer', 'hod'].includes(formData.role);

  const generateDummyData = (role: string) => {
    const timestamp = Date.now().toString().slice(-4);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random

    if (role === 'student') return {
      matric_number: `ST/${new Date().getFullYear()}/${timestamp}${randomSuffix}`,
      level: '100',
      admission_date: new Date().toISOString().split('T')[0]
    };
    if (role === 'lecturer') return {
      staff_id: `LEC/${timestamp}${randomSuffix}`,
      designation: 'lecturer_1'
    };
    if (role === 'hod') return {
      staff_id: `HOD/${timestamp}${randomSuffix}`,
      designation: 'senior_lecturer',
      is_hod: true
    };
    return {
      staff_id: `STF/${timestamp}${randomSuffix}`,
      position: 'Admin Staff'
    };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.password_confirm) {
      alert("Passwords don't match!")
      return
    }

    if (formData.password.length < 8) {
      alert("Password must be at least 8 characters long!")
      return
    }

    // Validate Department
    if (needsDepartment && !formData.department_id) {
      alert("Please select a department for this user role.");
      return;
    }

    setLoading(true)

    try {
      let response;

      const baseData = {
        email: formData.email,
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        role: formData.role,
        password: formData.password,
        password_confirm: formData.password_confirm
      };

      if (formData.role === 'student') {
        const studentData = {
          user_data: baseData,
          ...generateDummyData('student'),
          department: parseInt(formData.department_id)
        };
        response = await authAPI.registerStudent(studentData);
      }
      else if (formData.role === 'lecturer') {
        const lecturerData = {
          user_data: baseData,
          ...generateDummyData('lecturer'),
          department: parseInt(formData.department_id)
        };
        response = await authAPI.registerLecturer(lecturerData);
      }
      else if (formData.role === 'hod') {
        const hodData = {
          user_data: baseData,
          ...generateDummyData('hod'),
          department_id: parseInt(formData.department_id)
        };
        response = await authAPI.registerHOD(hodData.user_data, hodData);
      }
      else {
        // ✅ CORRECTED LOGIC FOR STAFF ROLES (Bursar, Registrar, etc.)
        // We spread baseData directly to create a flat structure for StaffRegistrationSerializer
        const staffData = {
          ...baseData, // Contains email, username, password, etc. at root level
          ...generateDummyData('staff')
        };
        response = await authAPI.registerStaff(staffData);
      }

      if (response && (response.error || response.detail)) {
        console.error('API Error:', response)

        let errorMessage = response.detail || 'Unknown error';

        if (response.user_data) {
          errorMessage = `User Data Error: ${JSON.stringify(response.user_data)}`;
        } else if (response.error?.detail) {
          errorMessage = response.error.detail;
        } else if (typeof response.error === 'object') {
          // If error is an object (like validation errors), convert to string
          errorMessage = JSON.stringify(response.error);
        } else if (typeof response === 'object' && !response.detail) {
          // Sometimes validation errors come directly as the response object
          errorMessage = JSON.stringify(response);
        }

        alert(`Error creating user: ${errorMessage}`)
      } else {
        alert('User created successfully! (Default profile data assigned)')
        onUserCreated()
        setFormData({
          email: "",
          username: "",
          first_name: "",
          last_name: "",
          role: "student",
          phone: "",
          password: "",
          password_confirm: "",
          department_id: ""
        })
      }
    } catch (error: any) {
      console.error('Error creating user:', error)
      alert(`Error creating user: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Create New User</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
                <option value="hod">HOD</option>
                <option value="registrar">Registrar</option>
                <option value="bursar">Bursar</option>
                <option value="desk-officer">Desk Officer</option>
                <option value="ict">ICT Officer</option>
                <option value="exam-officer">Exam Officer</option>
                <option value="super-admin">Super Admin</option>
              </select>
            </div>

            {/* Department Selection (Conditional) */}
            {needsDepartment && (
              <div>
                <label htmlFor="department_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                {departments.length > 0 ? (
                  <select
                    id="department_id"
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept: any) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-red-500">No departments found. Please create one first.</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone (Optional)
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password * (min 8 characters)
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={8}
              />
            </div>

            <div>
              <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                id="password_confirm"
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={8}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [usersLoading, setUsersLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filters, setFilters] = useState({
    role: "",
    is_active: "",
    search: ""
  })

  const fetchUsers = async () => {
    try {
      setUsersLoading(true)
      const response = await userAPI.getUsers(filters)

      if (response.error) {
        console.error('Error fetching users:', response.error)
        toast.error(`Error fetching users: ${response.error.detail}`)
      } else {
        if (response.results) {
          setUsers(response.results)
        } else if (Array.isArray(response)) {
          setUsers(response)
        } else {
          setUsers([])
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Error fetching users.')
    } finally {
      setUsersLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      setStatsLoading(true)
      const response = await userAPI.getStats()
      if (response.error) {
        console.error('Error fetching stats:', response.error)
      } else {
        setStats(response)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchStats()
  }, [filters])

  const handleUserCreated = () => {
    setShowCreateModal(false)
    fetchUsers()
    fetchStats()
  }

  const handleBulkAction = async (userIds: number[], action: string) => {
    try {
      const response = await userAPI.bulkActions(userIds, action)
      if (response.error) {
        toast.error(`Error: ${response.error.detail}`)
      } else {
        toast.success(response.message || 'Bulk action completed successfully!')
        fetchUsers()
        fetchStats()
      }
    } catch (error) {
      toast.error('Error performing bulk action.')
    }
  }

  const handleRefresh = () => {
    fetchUsers()
    fetchStats()
  }

  return (
    <DashboardLayout title="User Management" role="super-admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-gray-600">
              Manage all users, roles, and permissions in the system
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={usersLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${usersLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* TODO: Implement export */ }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <UserStats stats={stats} loading={statsLoading} />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex gap-2 flex-wrap">
            <select
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="hod">HOD</option>
              <option value="registrar">Registrar</option>
              <option value="bursar">Bursar</option>
              <option value="desk-officer">Desk Officer</option>
              <option value="ict">ICT Officer</option>
              <option value="exam-officer">Exam Officer</option>
              <option value="super-admin">Super Admin</option>
            </select>

            <select
              value={filters.is_active}
              onChange={(e) => setFilters(prev => ({ ...prev, is_active: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name, email, or username..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Users Table */}
        <UsersTable
          users={users}
          loading={usersLoading}
          onUserUpdate={fetchUsers}
          onBulkAction={handleBulkAction}
        />
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={handleUserCreated}
      />
    </DashboardLayout>
  )
}