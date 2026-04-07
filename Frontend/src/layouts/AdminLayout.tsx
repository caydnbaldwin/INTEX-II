import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  FileText,
  Home,
  Heart,
  BarChart3,
  Shield,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  Gift,
  X,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
import { logout, getMfaStatus } from '@/lib/authApi'

const adminNav = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Caseload', href: '/admin/caseload', icon: Users },
  { name: 'Process Recording', href: '/admin/process-recording', icon: FileText },
  { name: 'Home Visitation', href: '/admin/visitation', icon: Home },
  { name: 'Donors', href: '/admin/donors', icon: Heart },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
]

const donorNav = [
  { name: 'My Portal', href: '/donor', icon: Gift },
]

const securityNav = [
  { name: 'Manage MFA', href: '/mfa', icon: ShieldCheck },
]

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { authSession, refreshAuthState } = useAuth()

  const devBypass = sessionStorage.getItem('devBypass') === 'true'
  const isAdmin = devBypass || authSession.roles.includes('Admin')
  const navItems = isAdmin ? adminNav : donorNav

  const [showMfaBanner, setShowMfaBanner] = useState(false)

  useEffect(() => {
    if (devBypass) return
    getMfaStatus()
      .then(enabled => { if (!enabled) setShowMfaBanner(true) })
      .catch(() => {})
  }, [devBypass])

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
                <Link to="/">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Shield className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold font-serif">Lunas</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {isAdmin ? 'Admin Portal' : 'Donor Portal'}
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href
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

          <SidebarGroup>
            <SidebarGroupLabel>Security</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {securityNav.map((item) => {
                  const isActive = location.pathname === item.href
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
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/">
                  <ChevronLeft className="size-4" />
                  <span>Back to Site</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout}>
                <LogOut className="size-4" />
                <span>Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="px-2 py-2 text-xs text-muted-foreground">
            Signed in as {devBypass ? 'Admin (Preview)' : (authSession.email ?? authSession.userName)}
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm font-medium text-muted-foreground">
            {[...navItems, ...securityNav].find((item) => item.href === location.pathname)?.name ?? 'Dashboard'}
          </span>
        </header>

        {showMfaBanner && (
          <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
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

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
