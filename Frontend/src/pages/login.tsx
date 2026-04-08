import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Shield, Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, ShieldCheck, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { login, completeMfaChallenge, register, getGoogleLoginUrl } from '@/lib/authApi'
import { useAuth } from '@/context/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refreshAuthState } = useAuth()

  const [activeTab, setActiveTab] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Step: 'credentials' shows the normal form; 'totp' shows the MFA code input
  const [step, setStep] = useState<'credentials' | 'totp'>('credentials')
  const [totpCode, setTotpCode] = useState('')

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [copiedValue, setCopiedValue] = useState('')

  const externalError = searchParams.get('externalError')
  const [error, setError] = useState(externalError ?? '')

  function navigateAfterLogin(roles: string[]) {
    if (roles.includes('Admin')) {
      navigate('/admin')
    } else {
      navigate('/donor')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await login(loginEmail, loginPassword)

      if (result.status === 'ok') {
        const session = await refreshAuthState()
        navigateAfterLogin(session?.roles ?? [])
      } else if (result.status === 'requiresTwoFactor') {
        setStep('totp')
      } else if (result.status === 'error') {
        setError(result.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await completeMfaChallenge(totpCode)
      const session = await refreshAuthState()
      navigateAfterLogin(session?.roles ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code.')
      setTotpCode('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (registerPassword !== registerConfirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (registerPassword.length < 14) {
      setError('Password must be at least 14 characters long.')
      return
    }

    if (!acceptTerms) {
      setError('You must accept the terms and privacy policy.')
      return
    }

    setIsLoading(true)

    try {
      await register(registerEmail, registerPassword)
      setActiveTab('login')
      setLoginEmail(registerEmail)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = getGoogleLoginUrl()
  }

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedValue(value)
      window.setTimeout(() => setCopiedValue(''), 1500)
    } catch {
      setError('Unable to copy to clipboard. Please copy the text manually.')
    }
  }

  // ── MFA TOTP step ─────────────────────────────────────────────────────────
  if (step === 'totp') {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <ShieldCheck className="h-7 w-7 text-primary-foreground" />
              </div>
              <span className="text-2xl font-semibold tracking-tight text-foreground">Lunas</span>
            </Link>
            <p className="mt-4 text-muted-foreground">Two-factor authentication required</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Enter verification code</CardTitle>
              <CardDescription>
                Open your authenticator app and enter the 6-digit code for your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <form onSubmit={handleTotpSubmit} className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={totpCode}
                    onChange={setTotpCode}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || totpCode.length !== 6}>
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</>
                  ) : (
                    <>Verify<ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setStep('credentials'); setError(''); setTotpCode('') }}
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                  Back to sign in
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ── Normal credentials step ───────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Shield className="h-7 w-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-semibold tracking-tight text-foreground">
              Lunas
            </span>
          </Link>
          <p className="mt-4 text-muted-foreground">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Auth Card */}
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              {error && (
                <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Login Form */}
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="login-email" type="email" placeholder="you@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="pl-10" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="pl-10 pr-10" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked as boolean)} />
                    <Label htmlFor="remember-me" className="text-sm text-muted-foreground cursor-pointer">Remember me</Label>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</>
                    ) : (
                      <>Sign In<ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </form>

                {/* Google OAuth */}
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><Separator /></div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Continue with Google
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register" className="mt-0">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="register-email" type="email" placeholder="you@example.com" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} className="pl-10" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="register-password" type={showPassword ? 'text' : 'password'} placeholder="Create a password (14+ chars)" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} className="pl-10 pr-10" required minLength={14} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Must be at least 14 characters.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="register-confirm-password" type={showPassword ? 'text' : 'password'} placeholder="Confirm your password" value={registerConfirmPassword} onChange={(e) => setRegisterConfirmPassword(e.target.value)} className="pl-10" required />
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox id="accept-terms" checked={acceptTerms} onCheckedChange={(checked) => setAcceptTerms(checked as boolean)} className="mt-1" />
                    <Label htmlFor="accept-terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                      I agree to the <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and Terms of Service
                    </Label>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</>
                    ) : (
                      <>Create Account<ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Test Accounts */}
        <Card className="mt-6 bg-muted/30 border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Test Accounts</CardTitle>
            <CardDescription className="text-xs">For grader use</CardDescription>
          </CardHeader>
          <CardContent className="text-xs space-y-3">
            {[
              {
                label: 'Admin (no MFA)',
                email: 'testadmin@lunas-project.site',
                password: 'super secure p@ssw0rd',
              },
              {
                label: 'Donor (no MFA)',
                email: 'testdonor@lunas-project.site',
                password: 'super secure p@ssw0rd',
              },
              {
                label: 'Staff (MFA enabled)',
                email: 'teststaff@lunas-project.site',
                password: 'super secure p@ssw0rd',
              },
            ].map((account) => (
              <div key={account.email} className="rounded-md border border-border/60 bg-background/70 p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-foreground">{account.label}</span>
                  {copiedValue === account.email || copiedValue === account.password ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                      <Check className="h-3 w-3" /> Copied
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono break-all text-foreground">{account.email}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => void handleCopy(account.email)}
                  >
                    <Copy className="mr-1 h-3.5 w-3.5" /> Copy email
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono break-all text-foreground">{account.password}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => void handleCopy(account.password)}
                  >
                    <Copy className="mr-1 h-3.5 w-3.5" /> Copy password
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
