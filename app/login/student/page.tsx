
"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GraduationCap, ArrowLeft, Loader2, Mail, Lock, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function StudentLogin() {
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
      // console.log("🔐 Attempting login with:", { email, password: "***" })
      await login(email, password)
      // console.log("✅ Login successful")
      // Redirect handled by auth context or middleware, but safety check:
      // router.push('/dashboard/student') 
    } catch (err) {
      console.error("❌ Login error:", err)
      setError(err instanceof Error ? err.message : "Login failed. Please check your credentials.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-slate-50 to-emerald-50 p-4 font-sans relative overflow-hidden">

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-teal-200/30 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl opacity-60" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-teal-100 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="space-y-4 pb-2">
          {/* Back Link */}
          <Link
            href="/login"
            className="flex items-center text-xs font-medium text-slate-500 hover:text-teal-700 transition-colors w-fit"
          >
            <ArrowLeft className="mr-1 h-3 w-3" /> Switch Portal
          </Link>

          {/* Header Content */}
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-lg shadow-teal-700/20 mb-4 transition-transform hover:scale-105">
              <GraduationCap className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-bold text-teal-950">Student Portal</CardTitle>
            <CardDescription className="text-slate-500 text-base">
              Sign in to manage your academics
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700 text-sm py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="ml-2">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-teal-500 transition-all focus:bg-white"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                  <Link href="#" className="text-xs text-teal-600 hover:text-teal-800 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-teal-500 transition-all focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold h-11 shadow-md transition-all hover:scale-[1.01]"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Authenticating...
                </div>
              ) : (
                "Login to Student Dashboard"
              )}
            </Button>

          </form>
        </CardContent>


      </Card>

      {/* Footer copyright */}
      <div className="absolute bottom-4 text-center w-full text-xs text-slate-400">
        &copy; {new Date().getFullYear()} CHES Funtua
      </div>
    </div>
  )
}
