"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Users, ArrowLeft, Loader2, Mail, Lock, AlertCircle, School } from "lucide-react"
import Link from "next/link"

// Unified Input Style
const inputClassName = "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:bg-slate-50 pl-9";

export default function StaffLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Pass false to prevent auto-redirect, allowing us to check the role first
      const user = await login(email, password, false)

      if (user) {
        if (user.role === "student") {
          setError("Please use the Student Portal to login.")
          setLoading(false)
          return
        }

        const roleRoutes: Record<string, string> = {
          super_admin: "/dashboard/super-admin",
          registrar: "/dashboard/registrar",
          desk_officer: "/dashboard/desk-officer",
          hod: "/dashboard/hod",
          lecturer: "/dashboard/lecturer",
          bursar: "/dashboard/bursar",
          exam_officer: "/dashboard/exam-officer",
          ict: "/dashboard/ict",
        }

        const redirectPath = roleRoutes[user.role] || "/dashboard"
        router.push(redirectPath)
      }
    } catch (err: any) {
      setError(err.message || "Login failed")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-teal-50 via-slate-50 to-emerald-50 p-4 relative overflow-hidden">

      {/* Abstract Background Decoration */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">

        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20 mb-4 hover:bg-emerald-800 transition-colors">
            <School className="h-7 w-7" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Staff Portal</h1>
          <p className="text-slate-500 text-sm">Welcome back, please sign in.</p>
        </div>

        <Card className="border-2 border-white/50 bg-white/80 backdrop-blur-sm shadow-xl shadow-emerald-900/5">
          <CardHeader className="space-y-1 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <Link href="/login" className="flex items-center text-xs text-slate-500 hover:text-emerald-700 transition-colors group">
                <ArrowLeft className="mr-1 h-3 w-3 group-hover:-translate-x-1 transition-transform" /> Switch Portal
              </Link>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                <Users className="h-3 w-3" /> Administrative Access
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-600">Staff Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="staff@chsth.edu.ng"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputClassName}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-600">Password</Label>
                  <Link href="/forgot-password" className="text-xs text-emerald-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={inputClassName}
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800 py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="ml-2 text-sm font-semibold">Login Failed</AlertTitle>
                  <AlertDescription className="ml-2 text-xs opacity-90">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-700/10 transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating...
                  </>
                ) : (
                  "Login to Dashboard"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-slate-100 bg-slate-50/50 py-4 rounded-b-xl">
            <p className="text-xs text-slate-500">
              New staff member?{" "}
              <Link href="/register/staff" className="text-emerald-700 font-semibold hover:underline">
                Activate account
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}