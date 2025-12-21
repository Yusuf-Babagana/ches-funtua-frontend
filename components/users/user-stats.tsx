"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"

interface CreateUserModalProps {
    open: boolean
    onClose: () => void
    onUserCreated: () => void
}

export function CreateUserModal({ open, onClose, onUserCreated }: CreateUserModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        username: "",
        first_name: "",
        last_name: "",
        role: "student",
        phone: "",
        password: "",
        password_confirm: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await apiClient.post('/users/', formData)

            if (!response.error) {
                onUserCreated()
                setFormData({
                    email: "",
                    username: "",
                    first_name: "",
                    last_name: "",
                    role: "student",
                    phone: "",
                    password: "",
                    password_confirm: ""
                })
            }
        } catch (error) {
            console.error('Error creating user:', error)
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
                            <Label htmlFor="email">Email</Label>
                            <Input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="username">Username</Label>
                            <Input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="first_name">First Name</Label>
                                <Input
                                    type="text"
                                    id="first_name"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input
                                    type="text"
                                    id="last_name"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="role">Role</Label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-md"
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

                        <div>
                            <Label htmlFor="phone">Phone (Optional)</Label>
                            <Input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={8}
                            />
                        </div>

                        <div>
                            <Label htmlFor="password_confirm">Confirm Password</Label>
                            <Input
                                type="password"
                                id="password_confirm"
                                name="password_confirm"
                                value={formData.password_confirm}
                                onChange={handleChange}
                                required
                                minLength={8}
                            />
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1"
                            >
                                {loading ? "Creating..." : "Create User"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}