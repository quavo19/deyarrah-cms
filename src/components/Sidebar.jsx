import { useState, useEffect, useMemo } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuthContext } from "@/hooks/useAuthContext"
import { 
  Menu, 
  LogOut,
  ChevronRight
} from "lucide-react"
import Image from "@/components/ui/Image"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/Sheet"
import { cn } from "@/lib/utils"
import { hasRoleAccess, getUserRole } from "@/utils/roleGuard"
import { formatRoleName } from "@/utils"
import { routes } from "@/constants/routes"
import logoImage from "@/assets/images/logo.png"


const SidebarContent = ({ onNavigate, className }) => {
  const { user, logout } = useAuthContext()
  const location = useLocation()
  const userRole = getUserRole(user)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const filteredRoutes = useMemo(() => 
    routes.filter(route => hasRoleAccess(route.roles, userRole)),
    [userRole]
  )

  const getDisplayName = () => {
    if (!user) return "Guest"
    const { first_name, last_name, email } = user
    if (first_name && last_name) return `${first_name} ${last_name}`
    if (first_name) return first_name
    if (last_name) return last_name
    return email?.split("@")[0] ?? "User"
  }

  return (
    <div className={cn("flex flex-col h-full bg-primary", className)}>
      <div className="px-4 pt-6">
        <div className="flex items-center gap-2">
          <Image 
            src={logoImage} 
            alt="Platinum Vault Logo" 
            className="h-10 w-auto bg-transparent"
          />
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-white tracking-tight">
              Platinum Vault
            </h2>
            <p className="text-xs text-white/60 font-medium">{formatRoleName(user?.role?.name)}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {filteredRoutes.map((route) => {
          const Icon = route.icon
          // Check if route is active: exact match or pathname starts with route path + '/'
          const isActive = location.pathname === route.path || 
                          (route.path !== '/' && location.pathname.startsWith(route.path + '/'))

          return (
            <Link
              key={route.path}
              to={route.path}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-light transition-all duration-200",
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon 
                strokeWidth={1.5}
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive ? "text-white" : "text-white/70 group-hover:text-white"
                )} 
              />
              <span className="flex-1">{route.title}</span>
              
              {isActive && (
                <ChevronRight className="h-4 w-4 opacity-70" />
              )}
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto border-t border-white/10 p-4">
        <div className="flex items-center gap-3 py-3 rounded-xl">
          <div className="relative">
            <Image
              src={user?.avatar}
              alt={getDisplayName()}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-white/20"
              fallbackIconSize="w-6 h-6"
            />
            <span className={cn(
              "absolute bottom-1 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white transition-colors",
              isOnline ? "bg-green-600" : "bg-gray-400"
            )} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">
              {getDisplayName()}
            </p>
            <p className="text-xs text-white/60 truncate mt-0.5">
              {user?.email ?? "—"}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className={cn(
            "mt-3 w-full flex cursor-pointer items-center justify-center gap-3 px-4 py-3 rounded-xl",
            "text-sm font-medium text-white/90 hover:text-white",
            "bg-white/5 hover:bg-white/10 backdrop-blur-sm",
            "border border-white/10 hover:border-white/20",
            "transition-all duration-200"
          )}
        >
          <LogOut className="h-4.5 w-4.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}

const Sidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button className="p-3 rounded-xl bg-white shadow-md hover:bg-gray-50 transition-colors">
              <Menu className="h-5 w-5 text-gray-700" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0 border-none">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <aside className="hidden lg:flex z-40 w-72 shrink-0">
        <div className="relative h-full rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-primary/90 backdrop-blur-md" />
          <SidebarContent className="relative z-10" />
        </div>
      </aside>
    </>
  )
}

export default Sidebar