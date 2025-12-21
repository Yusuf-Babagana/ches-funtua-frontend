"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { GraduationCap, Users, School, UserCog, ArrowRight, Shield, BookOpen } from "lucide-react"

export default function RegisterPortal() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-white to-emerald-50 p-4 font-sans relative overflow-hidden">

      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-teal-100 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-50" />

      <div className="w-full max-w-6xl relative z-10">

        {/* Header Section */}
        <div className="text-center mb-10 space-y-3">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-xl shadow-teal-700/20 mb-6 transition-transform hover:scale-105">
            <School className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-bold text-teal-950 tracking-tight">Create Your Account</h1>
          <p className="text-lg text-slate-500">Join the CHES Funtua community today</p>
        </div>

        {/* Options Grid */}
        <div className="grid gap-6 md:grid-cols-3">

          {/* --- Student Registration Card --- */}
          <Link href="/register/student" className="group h-full">
            <Card className="h-full border-2 border-transparent hover:border-teal-200 hover:shadow-2xl transition-all duration-300 relative overflow-hidden bg-white/80 backdrop-blur-sm">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <GraduationCap className="h-32 w-32 text-teal-600" />
              </div>

              <CardHeader>
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors shadow-sm">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <CardTitle className="text-xl text-slate-800">Student</CardTitle>
                <CardDescription>
                  For new students enrolling in programs. Access courses, results, and payments.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 mt-auto">
                <div className="w-full py-2 flex items-center justify-between text-teal-700 font-semibold group-hover:text-teal-900 transition-colors">
                  <span>Register Now</span>
                  <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* --- HOD Registration Card --- */}
          <Link href="/register/hod" className="group h-full">
            <Card className="h-full border-2 border-transparent hover:border-emerald-200 hover:shadow-2xl transition-all duration-300 relative overflow-hidden bg-white/80 backdrop-blur-sm">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <UserCog className="h-32 w-32 text-emerald-600" />
              </div>

              <CardHeader>
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-sm">
                  <Shield className="h-7 w-7" />
                </div>
                <CardTitle className="text-xl text-slate-800">HOD / Faculty Lead</CardTitle>
                <CardDescription>
                  For Heads of Department managing academic staff, courses, and students.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 mt-auto">
                <div className="w-full py-2 flex items-center justify-between text-emerald-700 font-semibold group-hover:text-emerald-900 transition-colors">
                  <span>Register as HOD</span>
                  <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* --- Staff Registration Card --- */}
          <Link href="/register/staff" className="group h-full">
            <Card className="h-full border-2 border-transparent hover:border-cyan-200 hover:shadow-2xl transition-all duration-300 relative overflow-hidden bg-white/80 backdrop-blur-sm">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Users className="h-32 w-32 text-cyan-600" />
              </div>

              <CardHeader>
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-colors shadow-sm">
                  <Users className="h-7 w-7" />
                </div>
                <CardTitle className="text-xl text-slate-800">General Staff</CardTitle>
                <CardDescription>
                  For Lecturers, Registrars, Bursars, and administrative personnel.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 mt-auto">
                <div className="w-full py-2 flex items-center justify-between text-cyan-700 font-semibold group-hover:text-cyan-900 transition-colors">
                  <span>Register as Staff</span>
                  <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

        </div>

        {/* Footer Link */}
        <div className="text-center mt-12">
          <p className="text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-teal-700 font-semibold hover:text-teal-900 hover:underline transition-colors">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}