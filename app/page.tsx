"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  GraduationCap, Users, ArrowRight, MapPin, CheckCircle,
  Phone, Mail, LogIn, Shield
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">

      {/* =========================================================
          MINIMALIST HEADER
          Focus: Identity + Login Options Only
      ========================================================= */}
      <header className="sticky top-0 z-50 w-full border-b border-teal-100/50 bg-white/80 backdrop-blur-xl transition-all duration-300">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">

          {/* Brand / Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-white shadow-lg shadow-teal-200">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-none tracking-tight text-teal-950">
                CHES Funtua
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-600/80">
                Health & Environmental Sciences
              </span>
            </div>
          </div>

          {/* Login Actions Only */}
          <div className="flex items-center gap-3">
            {/* Staff Login (Subtle) */}
            <Link href="/login">
              <Button variant="ghost" className="text-teal-700 hover:text-teal-900 hover:bg-teal-50 font-medium hidden sm:flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Staff Portal
              </Button>
            </Link>

            {/* Student Login (Prominent) */}
            <Link href="/login">
              <Button className="bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-full px-6 h-10 shadow-md shadow-teal-200 hover:shadow-lg transition-all flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                <span>Student Login</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* --- Hero Section --- */}
        <section className="relative overflow-hidden bg-teal-900 py-24 md:py-32">
          {/* Abstract Background */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-emerald-500 rounded-full blur-3xl opacity-20"></div>

          <div className="container relative z-10 mx-auto px-4 text-center">
            <div className="mx-auto max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-teal-700 bg-teal-800/50 px-3 py-1 text-sm text-teal-100 backdrop-blur-sm mb-6">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                Digital Campus Portal
              </div>

              <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white md:text-6xl leading-tight">
                Welcome to the <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  College Portal
                </span>
              </h1>

              <p className="mx-auto mb-10 text-lg text-teal-100/90 leading-relaxed">
                Manage your academics, finances, and records in one secure place.
                Designed for students and staff of CHES Funtua.
              </p>

              {/* Dual Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/login" className="w-full sm:w-auto">
                  <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl cursor-pointer text-left w-full h-full border border-teal-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-teal-50 rounded-xl group-hover:bg-teal-600 transition-colors">
                        <Users className="h-6 w-6 text-teal-600 group-hover:text-white" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-teal-600 transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Student Portal</h3>
                    <p className="text-sm text-gray-500 mt-1">Register courses, check results & pay fees</p>
                  </div>
                </Link>

                <Link href="/login" className="w-full sm:w-auto">
                  <div className="group relative overflow-hidden rounded-2xl bg-teal-800 p-6 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl cursor-pointer text-left w-full h-full border border-teal-700">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-teal-700 rounded-xl group-hover:bg-white transition-colors">
                        <Shield className="h-6 w-6 text-teal-100 group-hover:text-teal-800" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-teal-500 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Staff Portal</h3>
                    <p className="text-sm text-teal-200 mt-1">Manage grading, attendance & records</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* --- Stats Banner --- */}
        <section className="bg-white border-y border-gray-100">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-3xl font-bold text-teal-800">3+</p>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide mt-1">Faculties</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-teal-800">15+</p>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide mt-1">Programs</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-teal-800">100%</p>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide mt-1">Accredited</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-teal-800">24/7</p>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide mt-1">Portal Access</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- Quick Info Grid --- */}
        <section className="bg-slate-50 py-20">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <MapPin className="h-8 w-8 text-teal-600 mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Campus Location</h3>
                <p className="text-sm text-gray-500">Tudun Wada, Funtua,<br />Katsina State, Nigeria</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <CheckCircle className="h-8 w-8 text-emerald-600 mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Accreditation</h3>
                <p className="text-sm text-gray-500">Fully accredited programs meeting national health standards.</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <Users className="h-8 w-8 text-cyan-600 mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Support</h3>
                <p className="text-sm text-gray-500">
                  Need help? Contact ICT support at <span className="text-teal-700 font-medium">support@chesfuntua.edu.ng</span>
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* --- Simple Footer --- */}
      <footer className="bg-white py-8 border-t border-gray-100">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <GraduationCap className="h-5 w-5 text-teal-700" />
            <span className="font-bold text-gray-900">CHES Funtua</span>
          </div>
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} College of Health and Environmental Sciences Funtua.
          </p>
          <div className="flex justify-center gap-6 mt-4 text-xs text-gray-400 font-medium">
            <Link href="#" className="hover:text-teal-600">Privacy Policy</Link>
            <Link href="#" className="hover:text-teal-600">Terms of Service</Link>
            <Link href="#" className="hover:text-teal-600">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}