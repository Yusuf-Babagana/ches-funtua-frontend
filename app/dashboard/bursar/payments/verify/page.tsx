"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, CheckCircle, XCircle } from "lucide-react"
import { financeAPI } from "@/lib/api"
import { toast } from "sonner"

export default function PaymentVerificationPage() {
    const [loading, setLoading] = useState(true)
    const [pendingPayments, setPendingPayments] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [processingId, setProcessingId] = useState<number | null>(null)

    const fetchPending = async () => {
        setLoading(true)
        try {
            const res = await financeAPI.getPendingVerifications()
            setPendingPayments(Array.isArray(res) ? res : res.results || [])
        } catch (error) {
            toast.error("Failed to load pending payments")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchPending() }, [])

    const handleAction = async (id: number, action: 'verify' | 'reject') => {
        const confirmMsg = action === 'verify'
            ? "Verify this payment? This will update the student's balance."
            : "Reject this payment record?"

        if (!confirm(confirmMsg)) return

        setProcessingId(id)
        try {
            const res = await financeAPI.verifyPaymentById(id, { action })
            if (!res.error) {
                toast.success(res.message || "Action successful")
                fetchPending()
            } else {
                toast.error(res.error.detail || res.error || "Action failed")
            }
        } catch (e) {
            toast.error("Process failed")
        } finally {
            setProcessingId(null)
        }
    }

    const filtered = pendingPayments.filter(p =>
        p.reference_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.matric_number?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <DashboardLayout title="Payment Verification" role="bursar">
            <div className="space-y-6 max-w-6xl mx-auto">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Manual Verifications</h1>
                        <p className="text-muted-foreground">Approve bank transfers or cash deposits.</p>
                    </div>
                    <Button onClick={fetchPending} variant="outline" size="sm">
                        <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by Reference, Name, or Matric..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-10">Loading...</TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No pending verifications found.</TableCell></TableRow>
                            ) : filtered.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell>
                                        <div className="font-medium">{p.student_name}</div>
                                        <div className="text-xs text-muted-foreground">{p.matric_number}</div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{p.reference_id}</TableCell>
                                    <TableCell className="font-bold text-teal-600">₦{Number(p.amount).toLocaleString()}</TableCell>
                                    <TableCell><Badge variant="outline" className="capitalize">{p.payment_method}</Badge></TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-600 hover:bg-red-50"
                                            onClick={() => handleAction(p.id, 'reject')}
                                            disabled={processingId === p.id}
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-teal-600 hover:bg-teal-700"
                                            onClick={() => handleAction(p.id, 'verify')}
                                            disabled={processingId === p.id}
                                        >
                                            {processingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                                            Verify
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </DashboardLayout>
    )
}
