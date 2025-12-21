"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Printer, CheckCircle2, ArrowLeft } from "lucide-react"
import { financeAPI } from "@/lib/api"
import { toast } from "sonner"
import { format } from "date-fns"

export default function ReceiptPage() {
    const params = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [receipt, setReceipt] = useState<any>(null)

    useEffect(() => {
        const fetchReceipt = async () => {
            try {
                // We'll reuse getStudentPayments and find the specific one for simplicity
                // In a production app, add a specific getPaymentById endpoint
                const payments = await financeAPI.getStudentPayments()
                const found = payments.find((p: any) => p.id.toString() === params.id)

                if (found) {
                    setReceipt(found)
                } else {
                    toast.error("Receipt not found")
                    router.push('/dashboard/student/payments')
                }
            } catch (error) {
                console.error("Error fetching receipt", error)
            } finally {
                setLoading(false)
            }
        }
        fetchReceipt()
    }, [params.id, router])

    const handlePrint = () => {
        window.print()
    }

    if (loading) return (
        <div className="h-screen flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
        </div>
    )

    if (!receipt) return null

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex flex-col items-center">

            <div className="w-full max-w-2xl mb-4 flex justify-between items-center print:hidden">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handlePrint} className="bg-teal-600 hover:bg-teal-700">
                    <Printer className="mr-2 h-4 w-4" /> Print Receipt
                </Button>
            </div>

            <Card className="w-full max-w-2xl shadow-xl print:shadow-none print:border-none">
                <CardContent className="p-0">
                    {/* Receipt Header */}
                    <div className="bg-teal-600 text-white p-8 text-center print:bg-white print:text-black print:border-b">
                        <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 print:hidden">
                            <CheckCircle2 className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold uppercase tracking-widest">Payment Receipt</h1>
                        <p className="opacity-90 mt-2 font-medium">College of Health Technology</p>
                        <p className="text-xs opacity-75 mt-4 font-mono">{receipt.reference_id}</p>
                    </div>

                    {/* Receipt Body */}
                    <div className="p-10 space-y-8">
                        <div className="flex justify-between items-end border-b border-gray-100 pb-4">
                            <div>
                                <p className="text-sm text-gray-500 uppercase tracking-wider">Date Paid</p>
                                <p className="font-semibold text-lg">
                                    {receipt.payment_date ? format(new Date(receipt.payment_date), "MMMM dd, yyyy") : "N/A"}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500 uppercase tracking-wider">Time</p>
                                <p className="font-semibold text-lg">
                                    {receipt.payment_date ? format(new Date(receipt.payment_date), "h:mm a") : "N/A"}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-sm text-gray-500 uppercase tracking-wider">Student Name</p>
                                <p className="font-bold text-gray-900">{receipt.student_name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500 uppercase tracking-wider">Matric Number</p>
                                <p className="font-mono font-bold text-gray-900">{receipt.matric_number}</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 print:bg-transparent print:border print:border-gray-300">
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">Payment Description</span>
                                <span className="font-medium text-gray-900">{receipt.description}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">Payment Method</span>
                                <span className="font-medium text-gray-900 capitalize">{receipt.payment_method.replace('_', ' ')}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">Invoice Number</span>
                                <span className="font-mono font-medium text-gray-900">{receipt.invoice_number}</span>
                            </div>

                            <div className="border-t border-slate-200 my-4"></div>

                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-900">Total Amount</span>
                                <span className="text-2xl font-black text-teal-600 print:text-black">
                                    ₦{Number(receipt.amount).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-10 mt-10 border-t border-gray-100 flex justify-between items-end">
                            <div className="text-xs text-gray-400">
                                <p>System Generated Receipt</p>
                                <p>Valid without signature</p>
                            </div>
                            <div className="text-right">
                                <div className="h-10 w-32 border-b border-gray-300 mb-1"></div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Bursar's Office</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}