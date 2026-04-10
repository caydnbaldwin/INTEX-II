import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  FileText,
  Home,
  BarChart3,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  LogOut,
  ChevronLeft,
  Gift,
  X,
  Sun,
  Moon,
  BedDouble,
  Heart,
  Share2,
  MessageSquare,
  MapPin,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/components/theme-provider'
import { logout, getMfaStatus } from '@/lib/authApi'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const adminNav = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Chat', href: '/admin/chat', icon: MessageSquare },
  { name: 'Donors', href: '/admin/donors', icon: Heart },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { name: 'Caseload', href: '/admin/caseload', icon: Users },
  { name: 'Process Recording', href: '/admin/process-recording', icon: FileText },
  { name: 'Home Visitation', href: '/admin/visitation', icon: Home },
  { name: 'Safehouse Operations', href: '/admin/safehouses/boarding', icon: BedDouble },
  { name: 'Social Media', href: '/admin/social-media', icon: Share2 },
  { name: 'Expansion', href: '/admin/expansion', icon: MapPin },
  { name: 'User Management', href: '/admin/users', icon: UserCog },
  { name: 'Manage MFA', href: '/mfa', icon: ShieldCheck },
]

const staffNav = [
  { name: 'Caseload', href: '/admin/caseload', icon: Users },
  { name: 'Process Recording', href: '/admin/process-recording', icon: FileText },
  { name: 'Home Visitation', href: '/admin/visitation', icon: Home },
  { name: 'Safehouse Operations', href: '/admin/safehouses/boarding', icon: BedDouble },
  { name: 'Manage MFA', href: '/mfa', icon: ShieldCheck },
]

const donorNav = [
  { name: 'My Portal', href: '/donor', icon: Gift },
  { name: 'Manage MFA', href: '/mfa', icon: ShieldCheck },
]

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { authSession, refreshAuthState } = useAuth()

  const { theme, setTheme, canSetTheme } = useTheme()
  const isAdmin = authSession.roles.includes('Admin')
  const isStaff = authSession.roles.includes('Staff')
  const isDonor = authSession.roles.includes('Donor')
  const isOperationalUser = isAdmin || isStaff

  const [showMfaBanner, setShowMfaBanner] = useState(false)
  const isItemActive = (item: { href: string }) =>
    location.pathname === item.href
    || (item.href.includes('?') && location.pathname + location.search === item.href)
  const navItems = isAdmin ? adminNav : isStaff ? staffNav : donorNav
  const activeHeaderItem = navItems.find(isItemActive)

  useEffect(() => {
    getMfaStatus()
      .then(enabled => { if (!enabled) setShowMfaBanner(true) })
      .catch(() => {})
  }, [])

  async function handleLogout() {
    await logout()
    await refreshAuthState()
    navigate('/')
  }

  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/" aria-label="Home">
                  <img
                    src="/images/PinwheelLogo-cropped.png"
                    alt="Lunas logo"
                    className="size-8 object-contain"
                  />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold font-serif">Lunas</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {isAdmin ? 'Admin Portal' : isStaff ? 'Staff Portal' : isDonor ? 'Donor Portal' : 'Portal'}
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = isItemActive(item)
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link to={item.href}>
                          <item.icon className="size-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu className="grid grid-cols-2 gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="text-xs">
                <Link to="/">
                  <ChevronLeft className="size-3.5" />
                  <span>Back to Site</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} className="text-xs">
                <LogOut className="size-3.5" />
                <span>Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="truncate px-2 py-1.5 text-[11px] text-muted-foreground whitespace-nowrap">
            Signed in as {authSession.email ?? authSession.userName}
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm font-medium text-muted-foreground flex-1">
            {activeHeaderItem?.name ?? (isOperationalUser ? 'Portal' : 'Dashboard')}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!canSetTheme}
                  aria-label={canSetTheme ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : 'Accept cookies to enable theme preferences'}
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {canSetTheme
                  ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`
                  : 'Accept cookies to enable theme preferences'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </header>

        {showMfaBanner && (
          <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
            <ShieldAlert className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span className="flex-1">
              Your account is not protected with two-factor authentication.{' '}
              <Link to="/mfa" className="font-medium underline hover:no-underline">
                Set up MFA
              </Link>{' '}
              to secure your account.
            </span>
            <button
              type="button"
              onClick={() => setShowMfaBanner(false)}
              className="flex-shrink-0 text-amber-600 hover:text-amber-800 dark:text-amber-400"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <main id="main-content" className="flex-1 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
