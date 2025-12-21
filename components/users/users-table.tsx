import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    MoreHorizontal,
    Edit,
    Trash2,
    UserCheck,
    UserX,
    Key,
    Check,
    X,
    Users,
    Building
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { userAPI, academicsAPI } from "@/lib/api" // âœ… Removed apiClient, using userAPI
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner" // Assuming you use sonner for notifications

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

interface UsersTableProps {
    users: User[]
    loading: boolean
    onUserUpdate: () => void
    onBulkAction: (userIds: number[], action: string) => void
}

const roleColors: Record<string, string> = {
    'student': 'bg-blue-100 text-blue-800',
    'lecturer': 'bg-green-100 text-green-800',
    'hod': 'bg-purple-100 text-purple-800',
    'registrar': 'bg-orange-100 text-orange-800',
    'bursar': 'bg-red-100 text-red-800',
    'desk-officer': 'bg-cyan-100 text-cyan-800',
    'ict': 'bg-teal-100 text-teal-800',
    'exam-officer': 'bg-indigo-100 text-indigo-800',
    'super-admin': 'bg-yellow-100 text-yellow-800'
}

// Assign Department Modal Component
function AssignDepartmentModal({ open, onClose, lecturer, onAssigned }: {
    open: boolean;
    onClose: () => void;
    lecturer: User | null;
    onAssigned: () => void
}) {
    const [departments, setDepartments] = useState<any[]>([])
    const [selectedDept, setSelectedDept] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const [fetchingDepts, setFetchingDepts] = useState(false)

    useEffect(() => {
        if (open) {
            fetchDepartments()
            setSelectedDept("")
        }
    }, [open])

    const fetchDepartments = async () => {
        try {
            setFetchingDepts(true)
            const response = await academicsAPI.getDepartments()
            if (response && !response.error) {
                setDepartments(Array.isArray(response) ? response : response.results || [])
            }
        } catch (error) {
            console.error("Error fetching departments:", error)
        } finally {
            setFetchingDepts(false)
        }
    }

    const handleAssign = async () => {
        if (!lecturer || !selectedDept) return

        try {
            setLoading(true)
            const response = await userAPI.assignDepartment(lecturer.id, parseInt(selectedDept))

            if (!response.error) {
                toast.success("Department assigned successfully!")
                onAssigned()
                onClose()
            } else {
                toast.error(`Error: ${response.error.detail || 'Failed to assign department'}`)
            }
        } catch (error) {
            console.error("Error assigning department:", error)
            toast.error("Error assigning department")
        } finally {
            setLoading(false)
        }
    }

    if (!open || !lecturer) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Assign Department</DialogTitle>
                    <DialogDescription>
                        Assign a department to <strong>{lecturer.full_name}</strong>. This allows them to access department-specific features.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <label className="text-sm font-medium mb-2 block">Select Department</label>
                    <Select value={selectedDept} onValueChange={setSelectedDept} disabled={fetchingDepts}>
                        <SelectTrigger>
                            <SelectValue placeholder={fetchingDepts ? "Loading departments..." : "Select a department"} />
                        </SelectTrigger>
                        <SelectContent>
                            {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                    {dept.name} ({dept.code})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleAssign} disabled={!selectedDept || loading}>
                        {loading ? "Assigning..." : "Assign Department"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function UsersTable({ users, loading, onUserUpdate, onBulkAction }: UsersTableProps) {
    const [selectedUsers, setSelectedUsers] = useState<number[]>([])
    const [assignDeptModalOpen, setAssignDeptModalOpen] = useState(false)
    const [selectedLecturer, setSelectedLecturer] = useState<User | null>(null)

    // âœ… FIXED: Use userAPI which points to /api/auth/users/...
    const handleActivate = async (userId: number) => {
        try {
            const response = await userAPI.activateUser(userId)
            if (!response.error) {
                toast.success("User activated successfully")
                onUserUpdate()
            } else {
                toast.error("Failed to activate user")
            }
        } catch (error) {
            console.error('Error activating user:', error)
            toast.error("Error activating user")
        }
    }

    // âœ… FIXED: Use userAPI which points to /api/auth/users/...
    const handleDeactivate = async (userId: number) => {
        try {
            const response = await userAPI.deactivateUser(userId)
            if (!response.error) {
                toast.success("User deactivated successfully")
                onUserUpdate()
            } else {
                toast.error("Failed to deactivate user")
            }
        } catch (error) {
            console.error('Error deactivating user:', error)
            toast.error("Error deactivating user")
        }
    }

    // âœ… FIXED: Use userAPI which points to /api/auth/users/...
    const handleDelete = async (userId: number) => {
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                const response = await userAPI.deleteUser(userId)
                if (!response?.error) {
                    toast.success("User deleted successfully")
                    onUserUpdate()
                } else {
                    toast.error("Failed to delete user")
                }
            } catch (error) {
                console.error('Error deleting user:', error)
                toast.error("Error deleting user")
            }
        }
    }

    const toggleUserSelection = (userId: number) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const selectAllUsers = () => {
        setSelectedUsers(users.map(user => user.id))
    }

    const clearSelection = () => {
        setSelectedUsers([])
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString()
    }

    // Open assign department modal
    const openAssignModal = (user: User) => {
        setSelectedLecturer(user)
        setAssignDeptModalOpen(true)
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading users...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg border shadow-sm">
            {/* Bulk Actions Bar */}
            {selectedUsers.length > 0 && (
                <div className="px-6 py-3 bg-blue-50 border-b flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-blue-800">
                            {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onBulkAction(selectedUsers, 'activate')}
                            >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Activate
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onBulkAction(selectedUsers, 'deactivate')}
                            >
                                <UserX className="h-4 w-4 mr-1" />
                                Deactivate
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onBulkAction(selectedUsers, 'delete')}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                            </Button>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                        Clear
                    </Button>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b bg-gray-50">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.length === users.length && users.length > 0}
                                    onChange={selectAllUsers}
                                    className="rounded border-gray-300"
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Created
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(user.id)}
                                        onChange={() => toggleUserSelection(user.id)}
                                        className="rounded border-gray-300"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {user.full_name}
                                        </div>
                                        <div className="text-sm text-gray-500">{user.email}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <Badge className={roleColors[user.role] || 'bg-gray-100 text-gray-800'}>
                                        {user.role.replace('-', ' ')}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4">
                                    {user.is_active ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <Check className="h-3 w-3 mr-1" />
                                            Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            <X className="h-3 w-3 mr-1" />
                                            Inactive
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {formatDate(user.created_at)}
                                </td>
                                <td className="px-6 py-4">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>

                                            {user.role === 'lecturer' && (
                                                <DropdownMenuItem onClick={() => openAssignModal(user)}>
                                                    <Building className="h-4 w-4 mr-2" />
                                                    Assign Department
                                                </DropdownMenuItem>
                                            )}

                                            <DropdownMenuItem>
                                                <Key className="h-4 w-4 mr-2" />
                                                Reset Password
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            {user.is_active ? (
                                                <DropdownMenuItem onClick={() => handleDeactivate(user.id)}>
                                                    <UserX className="h-4 w-4 mr-2" />
                                                    Deactivate
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem onClick={() => handleActivate(user.id)}>
                                                    <UserCheck className="h-4 w-4 mr-2" />
                                                    Activate
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(user.id)}
                                                className="text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {users.length === 0 && !loading && (
                <div className="p-8 text-center text-gray-500">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p>No users found</p>
                    <p className="text-sm">Try adjusting your filters or create a new user</p>
                </div>
            )}

            {/* Assign Department Modal */}
            <AssignDepartmentModal
                open={assignDeptModalOpen}
                onClose={() => setAssignDeptModalOpen(false)}
                lecturer={selectedLecturer}
                onAssigned={onUserUpdate}
            />
        </div>
    )
}