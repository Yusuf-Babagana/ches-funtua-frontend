"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { GraduationCap, Users, School, ArrowRight, ShieldCheck } from "lucide-react"

export default function LoginPortal() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-teal-50 via-slate-50 to-emerald-50 p-4 relative overflow-hidden">

      {/* Abstract Background Decoration */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-teal-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl" />

      <div className="w-full max-w-4xl relative z-10">

        {/* Brand Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-xl shadow-teal-700/20 mb-6">
            <School className="h-8 w-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-teal-950 tracking-tight">
            Welcome to CHES Funtua
          </h1>
          <p className="text-slate-500 text-lg">
            Choose your portal to sign in securely
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* --- Student Portal Option --- */}
          <Link href="/login/student" className="group">
            <Card className="h-full border-2 border-transparent hover:border-teal-100 hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <GraduationCap className="h-24 w-24 text-teal-600" />
              </div>

              <CardHeader>
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <CardTitle className="text-2xl text-slate-800">Student Portal</CardTitle>
                <CardDescription className="text-base">
                  Manage your courses, view results, and pay tuition fees.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4">
                <div className="flex items-center text-teal-600 font-semibold group-hover:translate-x-1 transition-transform">
                  Login as Student <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* --- Staff Portal Option --- */}
          <Link href="/login/staff" className="group">
            <Card className="h-full border-2 border-transparent hover:border-emerald-100 hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShieldCheck className="h-24 w-24 text-emerald-600" />
              </div>

              <CardHeader>
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Users className="h-7 w-7" />
                </div>
                <CardTitle className="text-2xl text-slate-800">Staff Portal</CardTitle>
                <CardDescription className="text-base">
                  Academic administration, grading, and department management.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4">
                <div className="flex items-center text-emerald-600 font-semibold group-hover:translate-x-1 transition-transform">
                  Login as Staff <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

        </div>

        {/* Footer Links */}
        <div className="mt-10 text-center space-y-4">
          <p className="text-sm text-slate-500">
            First time here?{" "}
            <Link href="/register" className="text-teal-700 font-semibold hover:underline">
              Create an account
            </Link>
          </p>
          <div className="flex justify-center gap-6 text-xs text-slate-400 font-medium">
            <Link href="#" className="hover:text-teal-600">Need Help?</Link>
            <Link href="#" className="hover:text-teal-600">Privacy Policy</Link>
            <Link href="/" className="hover:text-teal-600">Back to Home</Link>
          </div>
        </div>

      </div>
    </div>
  )
}