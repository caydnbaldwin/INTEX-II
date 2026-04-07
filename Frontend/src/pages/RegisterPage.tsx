import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const API = import.meta.env.VITE_API_BASE_URL as string;

interface RegisterError {
  errors?: Record<string, string[]>;
  detail?: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { refreshAuthState } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const passwordStrong = password.length >= 14;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);

    if (!passwordStrong) {
      setErrors(['Password must be at least 14 characters.']);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as RegisterError;
        if (data.errors) {
          const msgs = Object.values(data.errors).flat();
          setErrors(msgs);
        } else {
          setErrors([data.detail ?? 'Registration failed. Please try again.']);
        }
        return;
      }

      // Auto-login after registration
      const loginRes = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (loginRes.ok) {
        await refreshAuthState();
        navigate('/dashboard');
      } else {
        // Registration succeeded but auto-login failed — send to login
        navigate('/login');
      }
    } catch {
      setErrors(['Unable to reach the server. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-shape-xl bg-primary-container flex items-center justify-center mb-4">
            <ShieldCheck size={28} className="text-on-primary-container" />
          </div>
          <h1 className="text-headline-small text-on-surface">Create account</h1>
          <p className="text-body-medium text-on-surface-variant mt-1">
            Luna's Project Staff Portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-container-low rounded-shape-xl p-6 flex flex-col gap-4">

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-error-container text-on-error-container text-body-small rounded-shape-sm p-3 flex flex-col gap-1">
              {errors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
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

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-label-medium text-on-surface-variant">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    'w-full h-14 px-4 pr-12 rounded-shape-xs border bg-surface text-body-large text-on-surface',
                    'border-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                    'placeholder:text-on-surface-variant/60 transition-colors'
                  )}
                  placeholder="14+ characters"
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

              {/* Password strength indicator */}
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 rounded-full bg-outline-variant overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      password.length === 0 && 'w-0',
                      password.length > 0 && password.length < 8 && 'w-1/3 bg-error',
                      password.length >= 8 && password.length < 14 && 'w-2/3 bg-tertiary',
                      password.length >= 14 && 'w-full bg-primary'
                    )}
                  />
                </div>
                <span className={cn(
                  'text-label-small',
                  password.length === 0 && 'text-on-surface-variant',
                  password.length > 0 && password.length < 8 && 'text-error',
                  password.length >= 8 && password.length < 14 && 'text-tertiary',
                  password.length >= 14 && 'text-primary'
                )}>
                  {password.length === 0
                    ? 'Min 14 chars'
                    : password.length < 8
                    ? 'Too short'
                    : password.length < 14
                    ? `${14 - password.length} more`
                    : 'Strong'}
                </span>
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
                  <UserPlus size={18} />
                  Create account
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sign in link */}
        <p className="text-center text-body-medium text-on-surface-variant mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
