"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, CheckCircle, Clock, AlertCircle, DollarSign, FileText, ArrowLeft, ExternalLink } from "lucide-react"
import { apiClient, paymentAPI } from "@/lib/api"

interface Invoice {
    id: number
    invoice_number: string
    amount: string
    amount_paid: string
    balance: string
    status: string
    due_date: string
    session: string
    semester: string
    description: string
    fee_structure_name: string
}

interface FeeSummary {
    total_invoices: number
    total_amount: string
    total_paid: string
    total_outstanding: string
    current_semester_invoice: Invoice | null
    has_paid_current_fees: boolean
}

interface Payment {
    id: number
    reference_id: string
    amount: string
    payment_method: string
    status: string
    payment_date: string
    description: string
    invoice_number: string
}

export default function StudentFeesPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null)
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [recentPayments, setRecentPayments] = useState<Payment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [processingPayment, setProcessingPayment] = useState<number | null>(null)

    useEffect(() => {
        if (!loading && (!user || user.role !== "student")) {
            router.push("/login")
            return
        }

        if (user) {
            fetchFeeData()
        }
    }, [user, loading, router])

    const fetchFeeData = async () => {
        try {
            setError(null)

            // Fetch fee summary
            const summaryResponse = await apiClient.get('/finance/student/fee-summary/')
            setFeeSummary(summaryResponse)

            // Fetch invoices
            let invoicesData: Invoice[] = []
            try {
                const invoicesResponse = await apiClient.get('/finance/student/invoices/')

                if (Array.isArray(invoicesResponse)) {
                    invoicesData = invoicesResponse
                } else if (invoicesResponse && Array.isArray(invoicesResponse.results)) {
                    invoicesData = invoicesResponse.results
                } else if (invoicesResponse && Array.isArray(invoicesResponse.data)) {
                    invoicesData = invoicesResponse.data
                } else {
                    console.warn('Unexpected invoices response structure:', invoicesResponse)
                    invoicesData = []
                }
            } catch (invoicesError) {
                console.error('Error fetching invoices:', invoicesError)
                invoicesData = []
            }
            setInvoices(invoicesData)

            // Fetch recent payments
            let paymentsData: Payment[] = []
            try {
                const paymentsResponse = await apiClient.get('/finance/student/payments/')

                if (Array.isArray(paymentsResponse)) {
                    paymentsData = paymentsResponse.slice(0, 5) // Get last 5 payments
                } else if (paymentsResponse && Array.isArray(paymentsResponse.results)) {
                    paymentsData = paymentsResponse.results.slice(0, 5)
                } else if (paymentsResponse && Array.isArray(paymentsResponse.data)) {
                    paymentsData = paymentsResponse.data.slice(0, 5)
                } else {
                    console.warn('Unexpected payments response structure:', paymentsResponse)
                    paymentsData = []
                }
            } catch (paymentsError) {
                console.error('Error fetching payments:', paymentsError)
                paymentsData = []
            }
            setRecentPayments(paymentsData)

        } catch (error) {
            console.error('Error fetching fee data:', error)
            setError('Failed to load fee data. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handlePaystackPayment = async (invoiceId: number, amount: number, invoiceNumber: string) => {
        if (!user?.email) {
            alert('Email not found. Please contact support.')
            return
        }

        setProcessingPayment(invoiceId)
        try {
            const callbackUrl = `${window.location.origin}/dashboard/student/fees`
            const response = await paymentAPI.initializePayment({
                invoice_id: invoiceId,
                amount: amount,
                email: user.email,
                callback_url: callbackUrl
            })

            if (response.authorization_url) {
                // Store payment info in localStorage for callback handling
                localStorage.setItem('pending_payment', JSON.stringify({
                    invoiceId,
                    invoiceNumber,
                    amount,
                    reference: response.reference
                }))

                // Redirect to Paystack payment page in new tab
                window.open(response.authorization_url, '_blank')

                // Show success message and instructions
                alert(`Payment initialized successfully! You will be redirected to Paystack to complete your payment of ₦${amount.toLocaleString()} for invoice ${invoiceNumber}. Please complete the payment and return to this page.`)
            } else {
                alert('Payment initialization failed. Please try again.')
            }
        } catch (error: any) {
            console.error('Error initializing payment:', error)
            const errorMessage = error.message || 'Payment initialization failed. Please try again.'
            alert(`Payment failed: ${errorMessage}`)
        } finally {
            setProcessingPayment(null)
        }
    }

    const checkPaymentStatus = async () => {
        const pendingPayment = localStorage.getItem('pending_payment')
        if (pendingPayment) {
            const paymentData = JSON.parse(pendingPayment)
            try {
                // Verify payment status with backend
                const response = await apiClient.get(`/finance/payments/?reference=${paymentData.reference}`)

                if (response && response.length > 0 && response[0].status === 'completed') {
                    // Payment completed successfully
                    localStorage.removeItem('pending_payment')
                    alert(`Payment completed successfully for invoice ${paymentData.invoiceNumber}!`)
                    fetchFeeData() // Refresh data
                }
            } catch (error) {
                console.error('Error checking payment status:', error)
            }
        }
    }

    // Check for pending payments on component mount
    useEffect(() => {
        checkPaymentStatus()

        // Also check when the page becomes visible (user returns from Paystack)
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                checkPaymentStatus()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [])

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'paid': { variant: "default" as const, label: "Paid", icon: CheckCircle },
            'pending': { variant: "secondary" as const, label: "Pending", icon: Clock },
            'partially_paid': { variant: "outline" as const, label: "Partial", icon: AlertCircle },
            'overdue': { variant: "destructive" as const, label: "Overdue", icon: AlertCircle }
        }
        return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    }

    const getPaymentStatusBadge = (status: string) => {
        const statusConfig = {
            'completed': { variant: "default" as const, label: "Completed" },
            'pending': { variant: "secondary" as const, label: "Pending" },
            'failed': { variant: "destructive" as const, label: "Failed" },
            'reversed': { variant: "outline" as const, label: "Reversed" }
        }
        return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    }

    // Ensure arrays are always arrays
    const safeInvoices = Array.isArray(invoices) ? invoices : []
    const safePayments = Array.isArray(recentPayments) ? recentPayments : []

    if (loading || isLoading) {
        return (
            <DashboardLayout title="Fee Payment" role="student">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout title="Fee Payment" role="student">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Fee Management</h1>
                        <p className="text-gray-600">View and pay your academic fees</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={checkPaymentStatus}
                        className="ml-auto"
                    >
                        Check Payment Status
                    </Button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {/* Payment Instructions */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-blue-900">Secure Online Payment</h3>
                                <p className="text-sm text-blue-800">
                                    Pay your fees securely through Paystack. Supports cards, bank transfers, and USSD.
                                    After payment, click "Check Payment Status" to update your records.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Fee Summary */}
                {feeSummary && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Fee Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm font-medium text-blue-900">Total Invoices</p>
                                    <p className="text-2xl font-bold text-blue-600">{feeSummary.total_invoices}</p>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <p className="text-sm font-medium text-green-900">Total Amount</p>
                                    <p className="text-2xl font-bold text-green-600">₦{parseFloat(feeSummary.total_amount).toLocaleString()}</p>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                    <p className="text-sm font-medium text-purple-900">Total Paid</p>
                                    <p className="text-2xl font-bold text-purple-600">₦{parseFloat(feeSummary.total_paid).toLocaleString()}</p>
                                </div>
                                <div className="text-center p-4 bg-orange-50 rounded-lg">
                                    <p className="text-sm font-medium text-orange-900">Outstanding</p>
                                    <p className="text-2xl font-bold text-orange-600">₦{parseFloat(feeSummary.total_outstanding).toLocaleString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Current Semester Invoice */}
                {feeSummary?.current_semester_invoice && (
                    <Card className="border-blue-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-blue-600" />
                                Current Semester Invoice
                                {feeSummary.has_paid_current_fees && (
                                    <Badge variant="default" className="ml-2">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Paid
                                    </Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center">
                                <div className="flex-1">
                                    <p className="font-semibold text-lg">{feeSummary.current_semester_invoice.description}</p>
                                    <p className="text-sm text-gray-600">
                                        Due: {new Date(feeSummary.current_semester_invoice.due_date).toLocaleDateString()} •
                                        {feeSummary.current_semester_invoice.session} - {feeSummary.current_semester_invoice.semester}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2">
                                        <Badge {...getStatusBadge(feeSummary.current_semester_invoice.status)} />
                                        <span className="text-lg font-bold">₦{parseFloat(feeSummary.current_semester_invoice.amount).toLocaleString()}</span>
                                        {feeSummary.current_semester_invoice.balance !== "0.00" && (
                                            <span className="text-red-600 font-semibold">
                                                Balance: ₦{parseFloat(feeSummary.current_semester_invoice.balance).toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {feeSummary.current_semester_invoice.balance !== "0.00" && (
                                    <Button
                                        onClick={() => handlePaystackPayment(
                                            feeSummary.current_semester_invoice!.id,
                                            parseFloat(feeSummary.current_semester_invoice!.balance),
                                            feeSummary.current_semester_invoice!.invoice_number
                                        )}
                                        disabled={processingPayment === feeSummary.current_semester_invoice.id}
                                        className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                                    >
                                        {processingPayment === feeSummary.current_semester_invoice.id ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Pay with Paystack
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* All Invoices */}
                <Card>
                    <CardHeader>
                        <CardTitle>Invoice History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {safeInvoices.length > 0 ? (
                                safeInvoices.map((invoice) => {
                                    const statusConfig = getStatusBadge(invoice.status)
                                    const StatusIcon = statusConfig.icon
                                    const balance = parseFloat(invoice.balance)

                                    return (
                                        <div key={invoice.id} className="flex justify-between items-center p-4 border rounded-lg">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <p className="font-semibold">{invoice.invoice_number}</p>
                                                    <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                                                        <StatusIcon className="h-3 w-3" />
                                                        {statusConfig.label}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600">{invoice.description}</p>
                                                <p className="text-sm text-gray-500">
                                                    {invoice.session} - {invoice.semester} • Due: {new Date(invoice.due_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right space-y-2">
                                                <p className="font-bold">₦{parseFloat(invoice.amount).toLocaleString()}</p>
                                                {balance > 0 && (
                                                    <p className="text-sm text-red-600 font-semibold">
                                                        Balance: ₦{balance.toLocaleString()}
                                                    </p>
                                                )}
                                                {balance > 0 && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handlePaystackPayment(invoice.id, balance, invoice.invoice_number)}
                                                        disabled={processingPayment === invoice.id}
                                                        className="whitespace-nowrap"
                                                    >
                                                        {processingPayment === invoice.id ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                                                Processing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ExternalLink className="h-3 w-3 mr-1" />
                                                                Pay Balance
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="text-center py-8">
                                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No invoices found.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Payments */}
                {safePayments.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Payments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {safePayments.map((payment) => {
                                    const statusConfig = getPaymentStatusBadge(payment.status)

                                    return (
                                        <div key={payment.id} className="flex justify-between items-center p-3 border rounded-lg">
                                            <div>
                                                <p className="font-medium">{payment.description}</p>
                                                <p className="text-sm text-gray-600">
                                                    {payment.invoice_number} • {new Date(payment.payment_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">₦{parseFloat(payment.amount).toLocaleString()}</p>
                                                <Badge variant={statusConfig.variant}>
                                                    {statusConfig.label}
                                                </Badge>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    )
}