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
  LogOut,
  ChevronLeft,
  ChevronDown,
  Gift,
  X,
  Sun,
  Moon,
  BedDouble,
  UserCheck,
  DollarSign,
  Heart,
  Share2,
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
  { name: 'Safehouse Operations', href: '/admin/safehouses/boarding', icon: BedDouble },
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

type AdminSectionKey = 'donorsFunding' | 'residentCare' | 'outreach' | 'security'

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { authSession, refreshAuthState } = useAuth()

  const { theme, setTheme, canSetTheme } = useTheme()
  const isAdmin = authSession.roles.includes('Admin')

  const [showMfaBanner, setShowMfaBanner] = useState(false)
  const isItemActive = (item: { href: string }) =>
    location.pathname === item.href
    || (item.href.includes('?') && location.pathname + location.search === item.href)
  const allAdminItems = [...dashboardNav, ...donorFundingNav, ...residentCareNav, ...outreachNav]
  const activeHeaderItem = [...(isAdmin ? allAdminItems : donorNav), ...securityNav].find(isItemActive)
  const sectionHasActiveItem = (items: { href: string }[]) => items.some(isItemActive)
  const [openSections, setOpenSections] = useState<Record<AdminSectionKey, boolean>>({
    donorsFunding: sectionHasActiveItem(donorFundingNav),
    residentCare: sectionHasActiveItem(residentCareNav),
    outreach: sectionHasActiveItem(outreachNav),
    security: sectionHasActiveItem(securityNav),
  })

  useEffect(() => {
    getMfaStatus()
      .then(enabled => { if (!enabled) setShowMfaBanner(true) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    setOpenSections((prev) => ({
      ...prev,
      donorsFunding: prev.donorsFunding || sectionHasActiveItem(donorFundingNav),
      residentCare: prev.residentCare || sectionHasActiveItem(residentCareNav),
      outreach: prev.outreach || sectionHasActiveItem(outreachNav),
      security: prev.security || sectionHasActiveItem(securityNav),
    }))
  }, [location.pathname, location.search])

  function toggleSection(section: AdminSectionKey) {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

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

              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => toggleSection('donorsFunding')}>
                        <DollarSign className="size-4" />
                        <span className="flex-1 text-left">Donors & Funding</span>
                        <ChevronDown className={`size-3.5 transition-transform ${openSections.donorsFunding ? 'rotate-180' : ''}`} />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {openSections.donorsFunding && donorFundingNav.map((item) => {
                      const isActive = isItemActive(item)
                      return (
                        <SidebarMenuItem key={item.name}>
                          <SidebarMenuButton asChild isActive={isActive} className="pl-8">
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
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => toggleSection('residentCare')}>
                        <UserCheck className="size-4" />
                        <span className="flex-1 text-left">Resident Care</span>
                        <ChevronDown className={`size-3.5 transition-transform ${openSections.residentCare ? 'rotate-180' : ''}`} />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {openSections.residentCare && residentCareNav.map((item) => {
                      const isActive = isItemActive(item)
                      return (
                        <SidebarMenuItem key={item.name}>
                          <SidebarMenuButton asChild isActive={isActive} className="pl-8">
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
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => toggleSection('outreach')}>
                        <Share2 className="size-4" />
                        <span className="flex-1 text-left">Outreach</span>
                        <ChevronDown className={`size-3.5 transition-transform ${openSections.outreach ? 'rotate-180' : ''}`} />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {openSections.outreach && outreachNav.map((item) => {
                      const isActive = isItemActive(item)
                      return (
                        <SidebarMenuItem key={item.name}>
                          <SidebarMenuButton asChild isActive={isActive} className="pl-8">
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
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => toggleSection('security')}>
                    <ShieldCheck className="size-4" />
                    <span className="flex-1 text-left">Security</span>
                    <ChevronDown className={`size-3.5 transition-transform ${openSections.security ? 'rotate-180' : ''}`} />
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {openSections.security && securityNav.map((item) => {
                  const isActive = isItemActive(item)
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={isActive} className="pl-8">
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
            {activeHeaderItem?.name ?? 'Dashboard'}
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
