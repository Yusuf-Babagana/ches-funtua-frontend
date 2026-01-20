"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

import { AuditLog, User } from "@/lib/types"
import { Search } from "lucide-react"

export default function AuditLogsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    if (!loading && (!user || user.role !== "super-admin")) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading || !user) return null

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.model_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getActionBadgeColor = (action: string) => {
    const colors: Record<string, string> = {
      create: "bg-green-100 text-green-800",
      update: "bg-blue-100 text-blue-800",
      delete: "bg-red-100 text-red-800",
      login: "bg-purple-100 text-purple-800",
    }
    return colors[action] || "bg-gray-100 text-gray-800"
  }

  const getUserName = (userId: number) => {
    const u = users.find((user) => user.id === userId)
    return u?.full_name || "Unknown User"
  }

  return (
    <DashboardLayout title="Audit Logs" role="super-admin">
      <div className="space-y-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Activity</CardTitle>
            <CardDescription>Track all system actions and changes</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge className={getActionBadgeColor(log.action)} variant="secondary">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{getUserName(log.user)}</TableCell>
                    <TableCell>{log.model_name}</TableCell>
                    <TableCell className="max-w-md truncate">{log.description}</TableCell>
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
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
