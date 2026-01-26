"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

export default function DashboardRedirect() {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading) {
            if (!user) {
                // Not logged in, send to login
                router.replace("/login")
                return
            }

            // Route based on User Role
            switch (user.role) {
                case "student":
                    router.replace("/dashboard/student")
                    break
                case "lecturer":
                    router.replace("/dashboard/lecturer")
                    break
                case "hod":
                    router.replace("/dashboard/hod")
                    break
                case "registrar":
                    router.replace("/dashboard/registrar")
                    break
                case "bursar":
                    router.replace("/dashboard/bursar")
                    break
                case "exam-officer":
                    router.replace("/dashboard/exam-officer")
                    break
                case "ict":
                    router.replace("/dashboard/ict")
                    break
                case "super-admin":
                    // ✅ FIX: Redirect Super Admin to their dedicated dashboard
                    router.replace("/dashboard/super-admin")
                    break
                case "desk-officer":
                    router.replace("/dashboard/desk-officer")
                    break
                default:
                    // Fallback for unknown roles
                    console.warn("Unknown role:", user.role)
                    router.replace("/login")
            }
        }
    }, [user, loading, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <p className="text-slate-500 font-medium animate-pulse">Redirecting to your portal...</p>
            </div>
        </div>
    )
}