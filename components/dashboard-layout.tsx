"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Menu, GraduationCap, User as UserIcon } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  role: string
  sidebarItems?: Array<{
    href: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    active?: boolean
    visible?: boolean
  }>
}

export function DashboardLayout({ children, title, role, sidebarItems = [] }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { logout, user } = useAuth()

  const SidebarContent = () => (
    <div className="flex flex-col flex-1 h-full bg-white">
      {/* Brand Header */}
      <div className="px-6 h-16 flex items-center border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-sm font-bold text-gray-900 leading-none">FUNTUA</span>
            <span className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mt-0.5">Academic Portal</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Menu</div>
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href
          if (item.visible === false) return null

          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
            >
              <Icon className={`h-4 w-4 transition-colors ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-9 w-9 border border-gray-200">
            <AvatarImage src={user?.profile_picture} />
            <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-xs">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.full_name || "User"}
            </p>
            <p className="text-xs text-gray-500 truncate capitalize">
              {role?.replace('-', ' ')}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-100 hover:text-red-700 transition-all shadow-sm"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col border-r border-gray-200 fixed inset-y-0 z-30">
        <SidebarContent />
      </div>

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col md:pl-64 min-h-screen transition-all duration-300">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center text-white">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="font-bold text-gray-900">Funtua</span>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 border-r-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
            <header className="mb-8 hidden md:block">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h2>
              <p className="text-sm text-gray-500 mt-1">Manage your academic activities and records.</p>
            </header>
            {/* Mobile Title (if needed, usually header covers it but good to have context) */}
            <div className="md:hidden mb-6">
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            </div>

            {children}
          </main>
        </div>
      </div>
    </div>
  )
}