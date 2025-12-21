// components/student-sidebar.tsx
"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { 
  Home,
  BookOpen,
  Calendar,
  BarChart3,
  Clock,
  FileText,
  User,
  Settings
} from "lucide-react"

const studentNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard/student",
    icon: Home
  },
  {
    title: "Course Registration",
    href: "/dashboard/student/registration",
    icon: BookOpen
  },
  {
    title: "Class Schedule",
    href: "/dashboard/student/schedule",
    icon: Calendar
  },
  {
    title: "Grades",
    href: "/dashboard/student/grades",
    icon: BarChart3
  },
  {
    title: "Attendance",
    href: "/dashboard/student/attendance",
    icon: Clock
  },
  {
    title: "Transcript",
    href: "/dashboard/student/transcript",
    icon: FileText
  },
  {
    title: "Profile",
    href: "/dashboard/student/profile",
    icon: User
  },
  {
    title: "Settings",
    href: "/dashboard/student/settings",
    icon: Settings
  }
]

export function StudentSidebar() {
  const pathname = usePathname()

  return (
    <div className="space-y-4 py-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Student Portal
        </h2>
        <div className="space-y-1">
          {studentNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-100 ${
                  isActive 
                    ? "bg-blue-50 text-blue-700 font-medium" 
                    : "text-gray-700 hover:text-gray-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}