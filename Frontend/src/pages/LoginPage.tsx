import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const API = import.meta.env.VITE_API_BASE_URL as string;

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshAuthState } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const externalError = searchParams.get('externalError');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { detail?: string };
        setError(data.detail ?? 'Invalid email or password.');
        return;
      }

      await refreshAuthState();
      navigate('/dashboard');
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleGoogleLogin() {
    window.location.href = `${API}/api/auth/external-login?provider=Google&returnPath=/dashboard`;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-shape-xl bg-primary-container flex items-center justify-center mb-4">
            <ShieldCheck size={28} className="text-on-primary-container" />
          </div>
          <h1 className="text-headline-small text-on-surface">Sign in</h1>
          <p className="text-body-medium text-on-surface-variant mt-1">
            Luna's Project Staff Portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-container-low rounded-shape-xl p-6 flex flex-col gap-4">

          {/* External error (from Google OAuth redirect) */}
          {externalError && (
            <div className="bg-error-container text-on-error-container text-body-small rounded-shape-sm p-3">
              {externalError}
            </div>
          )}

          {/* Form error */}
          {error && (
            <div className="bg-error-container text-on-error-container text-body-small rounded-shape-sm p-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-label-medium text-on-surface-variant">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(
                  'h-14 px-4 rounded-shape-xs border bg-surface text-body-large text-on-surface',
                  'border-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                  'placeholder:text-on-surface-variant/60 transition-colors'
                )}
                placeholder="you@example.com"
              />
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-label-medium text-on-surface-variant">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    'w-full h-14 px-4 pr-12 rounded-shape-xs border bg-surface text-body-large text-on-surface',
                    'border-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                    'placeholder:text-on-surface-variant/60 transition-colors'
                  )}
                  placeholder="••••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'h-10 rounded-shape-full bg-primary text-on-primary text-label-large',
                'hover:opacity-90 active:opacity-80 transition-opacity',
                'flex items-center justify-center gap-2 cursor-pointer',
                isLoading && 'opacity-60 cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <div className="w-4 h-4 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  Sign in
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-outline-variant" />
            <span className="text-label-small text-on-surface-variant">or</span>
            <div className="flex-1 h-px bg-outline-variant" />
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className={cn(
              'h-10 rounded-shape-full border border-outline text-label-large text-on-surface',
              'hover:bg-surface-container active:bg-surface-container-high transition-colors',
              'flex items-center justify-center gap-2 cursor-pointer'
            )}
          >
            {/* Google "G" icon via SVG — no external font needed */}
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </div>

        {/* Register link */}
        <p className="text-center text-body-medium text-on-surface-variant mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Request access
          </Link>
        </p>
      </div>
    </div>
  );
}
