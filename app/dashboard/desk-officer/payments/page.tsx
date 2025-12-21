"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockPayments, mockStudents } from "@/lib/mock-data"
import { Search, CheckCircle, XCircle } from "lucide-react"

export default function PaymentsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    if (!loading && (!user || user.role !== "desk_officer")) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading || !user) return null

  const filteredPayments = mockPayments.filter((payment) => {
    const student = mockStudents.find((s) => s.id === payment.student_id)
    const matchesSearch =
      payment.reference_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student?.student_id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || payment.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      verified: "bg-green-100 text-green-800",
      pending: "bg-orange-100 text-orange-800",
      rejected: "bg-red-100 text-red-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const getStudentName = (studentId: string) => {
    const student = mockStudents.find((s) => s.id === studentId)
    return student?.full_name || "Unknown"
  }

  const getStudentId = (studentId: string) => {
    const student = mockStudents.find((s) => s.id === studentId)
    return student?.student_id || "N/A"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <DashboardLayout title="Payment Verification" role="desk_officer">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Records</CardTitle>
            <CardDescription>Verify and manage student payments</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.reference_number}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{getStudentName(payment.student_id)}</div>
                        <div className="text-sm text-muted-foreground">{getStudentId(payment.student_id)}</div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{payment.payment_type}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(payment.status)} variant="secondary">
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      {payment.status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="text-red-600">
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-green-600">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
