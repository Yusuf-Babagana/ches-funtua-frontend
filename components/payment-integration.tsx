"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Wallet, Loader2 } from "lucide-react"
import { financeAPI } from "@/lib/api"

interface Invoice {
    id: number
    invoice_number: string
    amount: string
    amount_paid: string
    balance: string
    status: string
    due_date: string
    description: string
}

interface PaymentStatusProps {
    onPaymentVerified?: () => void
}

export function PaymentIntegration({ onPaymentVerified }: PaymentStatusProps) {
    const [invoice, setInvoice] = useState<Invoice | null>(null)
    const [loading, setLoading] = useState(true)
    const [paying, setPaying] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchCurrentInvoice()
    }, [])

    const fetchCurrentInvoice = async () => {
        try {
            setLoading(true)
            const response = await financeAPI.getCurrentSemesterInvoice()

            if (response && !response.error) {
                setInvoice(response)
            } else {
                setInvoice(null)
            }
        } catch (err) {
            console.error("Error fetching invoice:", err)
            setError("Failed to load invoice details")
        } finally {
            setLoading(false)
        }
    }

    const handlePayNow = async () => {
        if (!invoice) return

        try {
            setPaying(true)
            setError(null)

            // Get user email from localStorage
            const user = localStorage.getItem('user')
            const userEmail = user ? JSON.parse(user).email : ''

            // Initialize payment
            const paymentResponse = await financeAPI.initializePayment({
                invoice_id: invoice.id,
                amount: parseFloat(invoice.balance),
                email: userEmail
            })

            if (paymentResponse && paymentResponse.authorization_url) {
                // Redirect to Paystack payment page
                window.location.href = paymentResponse.authorization_url
            } else {
                setError("Failed to initialize payment")
            }
        } catch (err) {
            console.error("Payment error:", err)
            setError("Payment initialization failed")
        } finally {
            setPaying(false)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!invoice) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Fee Payment
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6">
                        <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No invoice found for current semester</p>
                        <p className="text-sm text-gray-400 mt-1">Please contact the finance department</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const isPaid = invoice.status === 'paid'
    const balance = parseFloat(invoice.balance)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Fee Payment Status
                </CardTitle>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Invoice Number:</span>
                        <span className="font-mono font-medium">{invoice.invoice_number}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-bold">₦{parseFloat(invoice.amount).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Amount Paid:</span>
                        <span className="text-green-600 font-medium">₦{parseFloat(invoice.amount_paid).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center border-t pt-3">
                        <span className="text-gray-600 font-medium">Balance:</span>
                        <span className={`text-lg font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ₦{balance.toLocaleString()}
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status:</span>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${isPaid
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {isPaid ? (
                                <>
                                    <CheckCircle className="h-4 w-4" />
                                    Paid
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="h-4 w-4" />
                                    Pending
                                </>
                            )}
                        </span>
                    </div>

                    {!isPaid && balance > 0 && (
                        <Button
                            onClick={handlePayNow}
                            disabled={paying}
                            className="w-full bg-green-600 hover:bg-green-700"
                            size="lg"
                        >
                            {paying ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Wallet className="mr-2 h-4 w-4" />
                                    Pay ₦{balance.toLocaleString()} Now
                                </>
                            )}
                        </Button>
                    )}

                    {isPaid && onPaymentVerified && (
                        <Button
                            onClick={onPaymentVerified}
                            variant="outline"
                            className="w-full"
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Payment Verified - Proceed to Registration
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}