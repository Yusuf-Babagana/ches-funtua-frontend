"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Search, CheckCircle, AlertCircle, FileText, CreditCard } from "lucide-react"
import { financeAPI } from "@/lib/api"
import { toast } from "sonner"

export default function BursarInvoicesPage() {
    const [loading, setLoading] = useState(false)
    const [invoices, setInvoices] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState("")

    // Bulk Gen State
    const [genSession, setGenSession] = useState("2024/2025")
    const [genSemester, setGenSemester] = useState("first")
    const [genLevel, setGenLevel] = useState("100")
    const [genAmount, setGenAmount] = useState("150000")
    const [genDate, setGenDate] = useState("")
    const [generating, setGenerating] = useState(false)

    // Fetch Invoices
    const fetchInvoices = async () => {
        setLoading(true)
        try {
            // Fetch pending or partial invoices by default
            const res = await financeAPI.getAllInvoices({ status: 'pending' })
            if (Array.isArray(res)) {
                setInvoices(res)
            } else if (res.results) {
                setInvoices(res.results)
            }
        } catch (error) {
            toast.error("Failed to fetch invoices")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInvoices()
    }, [])

    // Handle Mark Paid
    const handleMarkPaid = async (invoiceId: number) => {
        if (!confirm("Are you sure you want to manually mark this invoice as PAID? This cannot be undone.")) return;

        try {
            await financeAPI.markInvoicePaid(invoiceId)
            toast.success("Invoice marked as PAID")
            fetchInvoices() // Refresh list
        } catch (error) {
            toast.error("Failed to update invoice")
        }
    }

    // Handle Bulk Generation
    const handleBulkGenerate = async () => {
        if (!genDate) return toast.error("Please select a due date")

        setGenerating(true)
        try {
            const payload = {
                session: genSession,
                semester: genSemester,
                level: genLevel,
                amount: parseFloat(genAmount),
                due_date: genDate,
                description: `Tuition Fee ${genSession}`
            }

            const res = await financeAPI.generateBulkInvoices(payload)

            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success(`Generated: ${res.created}, Skipped: ${res.skipped}`)
                fetchInvoices() // Refresh list to see new ones
            }
        } catch (error) {
            toast.error("Generation failed")
        } finally {
            setGenerating(false)
        }
    }

    // Filter Logic
    const filteredInvoices = invoices.filter(inv =>
        inv.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.matric_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.student_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <DashboardLayout title="Invoice Management" role="bursar">
            <div className="space-y-6 max-w-6xl mx-auto">

                <Tabs defaultValue="manage" className="w-full">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">Invoices</h1>
                        <TabsList>
                            <TabsTrigger value="manage">Manage Invoices</TabsTrigger>
                            <TabsTrigger value="generate">Generate Bulk</TabsTrigger>
                        </TabsList>
                    </div>

                    {/* --- MANAGE TAB --- */}
                    <TabsContent value="manage" className="space-y-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    placeholder="Search by Invoice #, Matric, or Name..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button onClick={fetchInvoices} variant="outline">
                                <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>

                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Invoice #</TableHead>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Level</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Paid</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                                            </TableRow>
                                        ) : filteredInvoices.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No pending invoices found.</TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredInvoices.map((inv) => (
                                                <TableRow key={inv.id}>
                                                    <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{inv.student_name}</div>
                                                        <div className="text-xs text-muted-foreground">{inv.matric_number}</div>
                                                    </TableCell>
                                                    <TableCell>{inv.level}</TableCell>
                                                    <TableCell className="font-bold">₦{Number(inv.amount).toLocaleString()}</TableCell>
                                                    <TableCell className="text-green-600">₦{Number(inv.amount_paid).toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={inv.status === 'paid' ? 'default' : 'secondary'}>
                                                            {inv.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {inv.status !== 'paid' && (
                                                            <Button
                                                                size="sm"
                                                                className="bg-green-600 hover:bg-green-700 h-8"
                                                                onClick={() => handleMarkPaid(inv.id)}
                                                            >
                                                                <CheckCircle className="h-3 w-3 mr-1" /> Mark Paid
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* --- GENERATE TAB --- */}
                    <TabsContent value="generate">
                        <Card>
                            <CardHeader>
                                <CardTitle>Bulk Invoice Generation</CardTitle>
                                <CardDescription>Create tuition invoices for all active students in a specific level.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 max-w-lg">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Session</label>
                                        <Input value={genSession} onChange={e => setGenSession(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Semester</label>
                                        <Select value={genSemester} onValueChange={setGenSemester}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="first">First</SelectItem>
                                                <SelectItem value="second">Second</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Target Level</label>
                                    <Select value={genLevel} onValueChange={setGenLevel}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="100">100 Level</SelectItem>
                                            <SelectItem value="200">200 Level</SelectItem>
                                            <SelectItem value="300">300 Level</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Amount (₦)</label>
                                    <Input type="number" value={genAmount} onChange={e => setGenAmount(e.target.value)} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Due Date</label>
                                    <Input type="date" value={genDate} onChange={e => setGenDate(e.target.value)} />
                                </div>

                                <Button
                                    className="w-full mt-4"
                                    onClick={handleBulkGenerate}
                                    disabled={generating}
                                >
                                    {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                                    Generate Invoices
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}