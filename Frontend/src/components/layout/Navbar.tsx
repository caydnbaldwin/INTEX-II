import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { logout } from '@/lib/authApi';
import { cn } from '@/lib/utils';

const API = import.meta.env.VITE_API_BASE_URL as string;

export default function Navbar() {
  const { authSession, isAuthenticated, refreshAuthState } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = authSession.roles.includes('Admin');

  async function handleLogout() {
    await logout();
    await refreshAuthState();
    navigate('/');
  }

  function handleGoogleLogin() {
    window.location.href = `${API}/api/auth/external-login?provider=Google&returnPath=/dashboard`;
  }

  const navLinks = isAuthenticated
    ? [
        { to: '/dashboard', label: 'Dashboard', adminOnly: true },
        { to: '/donors', label: 'Donors', adminOnly: true },
        { to: '/impact', label: 'Impact', adminOnly: false },
        { to: '/donate', label: 'Donate', adminOnly: false },
      ].filter((l) => !l.adminOnly || isAdmin)
    : [
        { to: '/impact', label: 'Impact', adminOnly: false },
        { to: '/donate', label: 'Donate', adminOnly: false },
      ];

  return (
    <header className="bg-surface-container-low border-b border-outline-variant sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / app name */}
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
          >
            <img src="/images/PinwheelLogo-cropped.png" alt="Lunas logo" className="h-7 w-7" />
            <span className="text-title-large text-on-surface">Lunas</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-label-large text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-shape-sm px-3 py-2 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop auth controls */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <span className="text-body-medium text-on-surface-variant">
                  {authSession.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-label-large text-on-surface-variant hover:text-error hover:bg-error-container rounded-shape-sm px-3 py-2 transition-colors cursor-pointer"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleGoogleLogin}
                  className="text-label-large text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-shape-sm px-3 py-2 transition-colors cursor-pointer"
                >
                  Sign in with Google
                </button>
                <Link
                  to="/login"
                  className="text-label-large bg-primary text-on-primary hover:opacity-90 rounded-shape-full px-6 py-2 transition-opacity"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-shape-sm text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        <div className={cn('md:hidden pb-4', menuOpen ? 'block' : 'hidden')}>
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="text-label-large text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-shape-sm px-3 py-2 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="text-left text-label-large text-error hover:bg-error-container rounded-shape-sm px-3 py-2 transition-colors cursor-pointer"
              >
                Sign out
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="text-label-large text-primary px-3 py-2"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
