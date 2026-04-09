import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/context/AuthContext'
import { logout } from '@/lib/authApi'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Our Impact', href: '/impact' },
  { name: 'Contact Us', href: '/contact' },
]

export function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { isAuthenticated, authSession, refreshAuthState } = useAuth()

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location])

  const isAdmin = authSession.roles.includes('Admin')
  const isDonor = authSession.roles.includes('Donor')
  const dashboardPath = isAdmin
    ? '/admin'
    : isDonor
      ? '/donor'
      : null

  async function handleLogout() {
    await logout()
    await refreshAuthState()
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm border-b border-border">
        <nav className="flex items-center justify-between pl-4 pr-6 py-3 lg:pl-6 lg:pr-8">
          {/* Left group: logo + nav links */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/images/PinwheelLogo-cropped.png"
                alt=""
                className="h-14 self-center"
              />
              <span className="font-serif text-2xl font-bold text-foreground tracking-tight leading-none">
                Lunas
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:gap-6">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`relative text-base font-medium transition-colors ${
                      isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute -bottom-4 left-0 right-0 h-0.5 bg-foreground rounded-full" />
                    )}
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right group: CTA buttons */}
          <div className="hidden md:flex md:items-center md:gap-3">
            {isAuthenticated ? (
              <>
                {dashboardPath && (
                  <Button variant="ghost" asChild>
                    <Link to={dashboardPath} className="text-base">Dashboard</Link>
                  </Button>
                )}
                <Button variant="outline" onClick={handleLogout} className="text-base">
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login" className="text-base">Sign In</Link>
                </Button>
                <Button asChild className="rounded-full px-7 text-base">
                  <Link to="/donate">Donate</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden -m-2 p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Toggle menu</span>
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </nav>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="px-6 py-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block py-2 text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <Separator className="my-4" />
              <div className="flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    {dashboardPath && (
                      <Button variant="outline" size="sm" asChild className="w-full">
                        <Link to={dashboardPath}>Dashboard</Link>
                      </Button>
                    )}
                    <Button size="sm" onClick={handleLogout} className="w-full">
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link to="/login">Sign In</Link>
                    </Button>
                    <Button size="sm" asChild className="w-full rounded-full">
                      <Link to="/donate">Donate</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/images/PinwheelLogo-cropped.png"
                alt=""
                className="h-8"
              />
              <span className="font-serif text-lg font-bold text-foreground tracking-tight">
                Lunas
              </span>
            </Link>

            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="hover:text-foreground transition-colors"
                >
                  {item.name}
                </Link>
              ))}
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <span className="text-border">|</span>
              <span>contact@lunas-project.site</span>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Lunas. All rights reserved.</p>
            <p>A 501(c)(3) nonprofit organization</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
