import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  FileText,
  Home,
  Heart,
  BarChart3,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  Gift,
  X,
  Sun,
  Moon,
  DollarSign,
  UserCheck,
  Share2,
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
import { useTheme } from '@/components/theme-provider'
import { logout, getMfaStatus } from '@/lib/authApi'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const dashboardNav = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
]

const donorFundingNav = [
  { name: 'Donors', href: '/admin/donors', icon: Heart },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
]

const residentCareNav = [
  { name: 'Caseload', href: '/admin/caseload', icon: Users },
  { name: 'Process Recording', href: '/admin/process-recording', icon: FileText },
  { name: 'Home Visitation', href: '/admin/visitation', icon: Home },
]

const outreachNav = [
  { name: 'Social Media', href: '/admin/reports?tab=social', icon: Share2 },
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

  const { theme, setTheme, canSetTheme } = useTheme()
  const isAdmin = authSession.roles.includes('Admin')
  const allAdminItems = [...dashboardNav, ...donorFundingNav, ...residentCareNav, ...outreachNav]

  const [showMfaBanner, setShowMfaBanner] = useState(false)

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
                      {isAdmin ? 'Admin Portal' : 'Donor Portal'}
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {isAdmin ? (
            <>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {dashboardNav.map((item) => {
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
                <SidebarGroupLabel>
                  <DollarSign className="size-3 mr-1" />
                  Donors & Funding
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {donorFundingNav.map((item) => {
                      const isActive = location.pathname === item.href || (item.href.includes('?') && location.pathname + location.search === item.href)
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
                <SidebarGroupLabel>
                  <UserCheck className="size-3 mr-1" />
                  Resident Care
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {residentCareNav.map((item) => {
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
                <SidebarGroupLabel>
                  <Share2 className="size-3 mr-1" />
                  Outreach
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {outreachNav.map((item) => {
                      const isActive = location.pathname + location.search === item.href
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
            </>
          ) : (
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {donorNav.map((item) => {
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
          )}

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
            Signed in as {authSession.email ?? authSession.userName}
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:text-sm focus:font-medium"
        >
          Skip to main content
        </a>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm font-medium text-muted-foreground flex-1">
            {[...(isAdmin ? allAdminItems : donorNav), ...securityNav].find((item) => item.href === location.pathname)?.name ?? 'Dashboard'}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!canSetTheme}
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
