import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import { Suspense } from "react"
import { enableFetchDebugging } from "@/lib/debug-fetch" // ADD THIS
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Funtua",
  description: "Funtua Portal",
  generator: "v0.app",
}

// 🚨 ENABLE DEBUGGING
if (typeof window !== 'undefined') {
  enableFetchDebugging();
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${inter.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>
          <AuthProvider>{children}</AuthProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}