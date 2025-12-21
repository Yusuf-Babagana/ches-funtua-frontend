"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockDepartments } from "@/lib/mock-data"

export default function SelfRegistration() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    departmentId: "",
  })
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")

    try {
      // Call the registration API (mocked in lib/api.ts)
      await api.auth.register({
        full_name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        department_id: formData.departmentId,
      })
      setStatus("success")
      setTimeout(() => router.push("/login/student"), 2000)
    } catch (error) {
      console.error(error)
      setStatus("error")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>New Student Registration</CardTitle>
          <CardDescription>Complete your enrollment details.</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "success" ? (
            <Alert className="bg-green-50 border-green-200 text-green-900">
              <AlertDescription>Registration successful! Redirecting to login...</AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Create Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select required onValueChange={(val) => setFormData({ ...formData, departmentId: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {status === "error" && (
                <Alert variant="destructive">
                  <AlertDescription>Registration failed. Please try again.</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={status === "loading"}>
                {status === "loading" ? "Registering..." : "Complete Registration"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
