import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Menu, X, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/context/AuthContext'
import { logout } from '@/lib/authApi'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Our Impact', href: '/impact' },
  { name: 'Privacy Policy', href: '/privacy' },
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
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm border-b border-border">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-foreground" />
            <span className="text-lg font-semibold tracking-tight text-foreground font-serif">
              Lunas
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-8">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative text-sm font-medium transition-colors ${
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

          {/* Desktop CTA */}
          <div className="hidden md:flex md:items-center md:gap-3">
            {isAuthenticated ? (
              <>
                {dashboardPath && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={dashboardPath}>Dashboard</Link>
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/impact">Donate</Link>
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
                    <Button size="sm" asChild className="w-full">
                      <Link to="/impact">Donate</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-foreground" />
              <span className="text-base font-semibold text-foreground font-serif">
                Lunas
              </span>
            </div>

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
