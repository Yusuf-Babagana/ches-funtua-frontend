"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { financeAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function PaymentVerifyPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
    const [message, setMessage] = useState("Verifying your payment...")

    // Use a ref to ensure we only verify once in React 18 strict mode
    const verifyCalled = useRef(false)

    useEffect(() => {
        // Paystack returns 'reference' or 'trxref'
        const reference = searchParams.get('reference') || searchParams.get('trxref')

        if (!reference) {
            setStatus('error')
            setMessage("No payment reference found in URL.")
            return
        }

        if (verifyCalled.current) return
        verifyCalled.current = true

        const verify = async () => {
            try {
                console.log("Verifying payment ref:", reference)
                // Call backend to verify transaction
                const response = await financeAPI.verifyPayment({ reference })

                // Check for success signal from backend (FinanceService returns {status: 'success', ...})
                if (response.status === 'success' || response.message === 'Payment verified successfully' || response.message === 'Payment already verified') {
                    setStatus('success')
                    setMessage("Payment verified successfully! Your portal is now active.")
                    toast.success("Payment successful")

                    // Redirect after 3 seconds
                    setTimeout(() => {
                        router.push('/dashboard/student')
                    }, 3000)
                } else {
                    setStatus('error')
                    // ✅ FIX: Safely extract error string from response object
                    // The API might return { error: "msg" } or { detail: "msg" } or just "msg"
                    let errorMsg = "Payment verification failed."

                    if (response.error) {
                        if (typeof response.error === 'string') {
                            errorMsg = response.error
                        } else if (typeof response.error === 'object') {
                            errorMsg = response.error.error || response.error.detail || response.error.message || JSON.stringify(response.error)
                        }
                    }

                    console.error("Verification Error details:", response)
                    setMessage(errorMsg)
                    toast.error("Verification failed")
                }
            } catch (error: any) {
                console.error("Verification catch error:", error)
                setStatus('error')
                setMessage(error.message || "Network error during verification.")
            }
        }

        verify()
    }, [searchParams, router])

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardContent className="pt-6 pb-8 px-6 text-center space-y-6">

                    {status === 'verifying' && (
                        <>
                            <div className="flex justify-center">
                                <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Verifying Payment</h2>
                                <p className="text-gray-500 mt-2">Please wait while we confirm your transaction...</p>
                            </div>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="flex justify-center">
                                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="h-10 w-10 text-green-600" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Payment Successful!</h2>
                                <p className="text-green-600 mt-2 font-medium">{message}</p>
                                <p className="text-sm text-gray-400 mt-4">Redirecting you to dashboard...</p>
                            </div>
                            <Button onClick={() => router.push('/dashboard/student')} className="w-full bg-green-600 hover:bg-green-700">
                                Go to Dashboard
                            </Button>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="flex justify-center">
                                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                                    <XCircle className="h-10 w-10 text-red-600" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Verification Failed</h2>
                                <p className="text-red-600 mt-2 text-sm px-4">{message}</p>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => router.push('/dashboard/student')}>
                                    Back to Dashboard
                                </Button>
                                <Button className="flex-1" onClick={() => window.location.reload()}>
                                    Try Again
                                </Button>
                            </div>
                        </>
                    )}

                </CardContent>
            </Card>
        </div>
    )
}