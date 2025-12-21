
"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ictAPI } from "@/lib/api"
import { toast } from "sonner"
import {
    Search,
    Lock,
    Unlock,
    KeyRound,
    Loader2,
    UserCog,
    MoreHorizontal,
    ShieldAlert,
    ShieldCheck,
    RefreshCw
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Consistent Input Style
const inputClassName = "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200";

// Helper to get initials
const getInitials = (name: string) => {
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState("")
    const [selectedUser, setSelectedUser] = useState<any>(null)

    // Modal States
    const [isResetOpen, setIsResetOpen] = useState(false)
    const [newPassword, setNewPassword] = useState("")
    const [resetLoading, setResetLoading] = useState(false)

    useEffect(() => {
        handleSearch()
    }, [])

    const handleSearch = async () => {
        setLoading(true)
        try {
            const response = await ictAPI.searchUsers({ q: search })
            if (response && !response.error) {
                const results = Array.isArray(response) ? response : response.results || []
                setUsers(results)
            } else {
                setUsers([])
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch users")
        } finally {
            setLoading(false)
        }
    }

    const toggleStatus = async (user: any) => {
        try {
            await ictAPI.toggleUserActiveStatus(user.id)
            const action = user.is_active ? 'deactivated' : 'activated'
            toast.success(`User account ${action} successfully`)

            // Optimistic update
            setUsers(prev => prev.map(u =>
                u.id === user.id ? { ...u, is_active: !u.is_active } : u
            ))
        } catch (error) {
            toast.error("Failed to update status")
        }
    }

    const handleResetPassword = async () => {
        if (!selectedUser || !newPassword) return

        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters")
            return
        }

        setResetLoading(true)
        try {
            await ictAPI.resetUserPassword(selectedUser.id, {
                new_password: newPassword,
                confirm_password: newPassword
            })
            toast.success("Password reset successfully")
            setIsResetOpen(false)
            setNewPassword("")
            setSelectedUser(null)
        } catch (error: any) {
            const msg = error.error?.detail || error.message || "Failed to reset password"
            toast.error(msg)
        } finally {
            setResetLoading(false)
        }
    }

    const getRoleBadge = (role: string) => {
        const styles: any = {
            student: "bg-sky-100 text-sky-700 border-sky-200",
            lecturer: "bg-purple-100 text-purple-700 border-purple-200",
            hod: "bg-teal-100 text-teal-700 border-teal-200",
            ict: "bg-slate-800 text-white border-slate-800",
            registrar: "bg-orange-100 text-orange-700 border-orange-200",
            bursar: "bg-yellow-100 text-yellow-700 border-yellow-200",
        }

        // Default style if role not found
        const style = styles[role] || "bg-gray-100 text-gray-700 border-gray-200";

        return (
            <Badge variant="outline" className={`${style} capitalize shadow-sm px-3 py-0.5`}>
                {role?.replace('_', ' ')}
            </Badge>
        )
    }

    return (
        <DashboardLayout title="User Management" role="ict">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System Users</h1>
                        <p className="text-slate-500">Manage accounts, reset passwords, and control access permissions.</p>
                    </div>

                    {/* Search Bar */}
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-72">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by name, email, or ID..."
                                className={`${inputClassName} pl-9 bg-slate-50 border-slate-200`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            disabled={loading}
                            className="bg-teal-600 hover:bg-teal-700 shadow-sm"
                        >
                            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Search"}
                        </Button>
                    </div>
                </div>

                {/* Users Table */}
                <Card className="border-slate-200 shadow-md shadow-slate-200/50 overflow-hidden">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50/80">
                                <TableRow className="hover:bg-slate-50/80 border-b border-slate-200">
                                    <TableHead className="w-[300px] text-slate-600 font-semibold">User Identity</TableHead>
                                    <TableHead className="text-slate-600 font-semibold">Role</TableHead>
                                    <TableHead className="text-slate-600 font-semibold">Account Status</TableHead>
                                    <TableHead className="text-slate-600 font-semibold hidden md:table-cell">Date Joined</TableHead>
                                    <TableHead className="text-right text-slate-600 font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-500">
                                                <Loader2 className="animate-spin h-8 w-8 mb-2 text-teal-600" />
                                                <p>Fetching users...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <UserCog className="h-10 w-10 mb-2 text-slate-300" />
                                                <p>No users found matching "{search}"</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((u) => {
                                        const fullName = u.full_name || `${u.first_name} ${u.last_name}`;
                                        return (
                                            <TableRow key={u.id} className="hover:bg-slate-50/50 border-b border-slate-100 group">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ring-2 ring-white
                                                            ${u.is_active ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-500'}`}>
                                                            {getInitials(fullName)}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-slate-800">{fullName}</div>
                                                            <div className="text-xs text-slate-500">{u.email}</div>
                                                            {u.username && <div className="text-[10px] text-slate-400 font-mono mt-0.5">@{u.username}</div>}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getRoleBadge(u.role)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border
                                                        ${u.is_active
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                            : "bg-red-50 text-red-700 border-red-100"}`}>
                                                        {u.is_active
                                                            ? <><ShieldCheck className="w-3 h-3" /> Active</>
                                                            : <><ShieldAlert className="w-3 h-3" /> Inactive</>
                                                        }
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-500 hidden md:table-cell text-sm">
                                                    {new Date(u.date_joined || u.created_at).toLocaleDateString(undefined, {
                                                        year: 'numeric', month: 'short', day: 'numeric'
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-[160px]">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => { setSelectedUser(u); setIsResetOpen(true); }}>
                                                                <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => toggleStatus(u)} className={u.is_active ? "text-red-600 focus:text-red-600" : "text-green-600 focus:text-green-600"}>
                                                                {u.is_active ? (
                                                                    <><Lock className="mr-2 h-4 w-4" /> Deactivate</>
                                                                ) : (
                                                                    <><Unlock className="mr-2 h-4 w-4" /> Activate</>
                                                                )}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Reset Password Dialog */}
                <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-slate-800">
                                <div className="p-2 rounded-full bg-orange-100">
                                    <KeyRound className="h-5 w-5 text-orange-600" />
                                </div>
                                Reset Password
                            </DialogTitle>
                            <DialogDescription>
                                Set a new temporary password for <strong>{selectedUser?.full_name}</strong>.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="new-password"
                                        type="text"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new strong password"
                                        className={`${inputClassName} font-mono`}
                                    />
                                    <Button
                                        type="button" variant="ghost" size="sm"
                                        className="absolute right-1 top-1 h-8 px-2 text-slate-400 hover:text-teal-600"
                                        onClick={() => setNewPassword(Math.random().toString(36).slice(-10) + "!Aa1")}
                                        title="Generate Random"
                                    >
                                        <RefreshCw className="h-3 w-3" />
                                    </Button>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                    Password will be visible here. Ensure you copy it before saving.
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsResetOpen(false)} className="text-slate-500">Cancel</Button>
                            <Button
                                onClick={handleResetPassword}
                                disabled={resetLoading || !newPassword}
                                className="bg-teal-600 hover:bg-teal-700"
                            >
                                {resetLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update Password"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    )
}