"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { mockAuditLogs } from "@/lib/mock-data"
import { mockUsers } from "@/lib/mock-auth"
import { Search } from "lucide-react"

export default function AuditLogsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (!loading && (!user || user.role !== "super_admin")) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading || !user) return null

  const filteredLogs = mockAuditLogs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getActionBadgeColor = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: "bg-green-100 text-green-800",
      UPDATE: "bg-blue-100 text-blue-800",
      DELETE: "bg-red-100 text-red-800",
      VERIFY: "bg-purple-100 text-purple-800",
    }
    return colors[action] || "bg-gray-100 text-gray-800"
  }

  const getUserName = (userId: string) => {
    const u = mockUsers.find((user) => user.id === userId)
    return u?.full_name || "Unknown User"
  }

  return (
    <DashboardLayout title="Audit Logs" role="super_admin">
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
                    <TableCell className="font-medium">{getUserName(log.user_id)}</TableCell>
                    <TableCell>{log.entity_type}</TableCell>
                    <TableCell className="max-w-md truncate">{log.details}</TableCell>
                    <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
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
