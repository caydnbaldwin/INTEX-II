import { useEffect, useState } from 'react'
import { ShieldCheck, ShieldOff, Copy, Check, Loader2 } from 'lucide-react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { getMfaStatus, getMfaSetup, enableMfa, disableMfa } from '@/lib/authApi'
import { usePageTitle } from '@/hooks/usePageTitle'

type View = 'loading' | 'enabled' | 'disabled' | 'setup'

export default function ManageMFAPage() {
  usePageTitle('Manage MFA')
  const [view, setView] = useState<View>('loading')
  const [sharedKey, setSharedKey] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getMfaStatus()
      .then(enabled => setView(enabled ? 'enabled' : 'disabled'))
      .catch(() => setView('disabled'))
  }, [])

  async function startSetup() {
    setError('')
    setView('loading')
    try {
      const { sharedKey: key, qrCodeUri } = await getMfaSetup()
      setSharedKey(key)
      const dataUrl = await QRCode.toDataURL(qrCodeUri, { width: 200, margin: 2 })
      setQrDataUrl(dataUrl)
      setView('setup')
    } catch {
      setError('Failed to load setup. Please try again.')
      setView('disabled')
    }
  }

  async function handleEnable(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await enableMfa(code)
      setCode('')
      setView('enabled')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.')
      setCode('')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDisable() {
    setError('')
    setIsSubmitting(true)
    try {
      await disableMfa()
      setView('disabled')
    } catch {
      setError('Failed to disable MFA. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function copyKey() {
    void navigator.clipboard.writeText(sharedKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (view === 'loading') {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (view === 'enabled') {
    return (
      <div className="max-w-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Two-Factor Authentication</h1>
          <p className="text-muted-foreground mt-1">Manage your account's MFA settings.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              MFA is enabled
            </CardTitle>
            <CardDescription>
              Your account is protected with an authenticator app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Disabling MFA will remove the two-factor requirement from your account. You can re-enable it at any time.
            </p>
            <Button variant="destructive" onClick={() => void handleDisable()} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Disabling...</> : <>
                <ShieldOff className="mr-2 h-4 w-4" />Disable MFA
              </>}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (view === 'setup') {
    return (
      <div className="max-w-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Set Up Two-Factor Authentication</h1>
          <p className="text-muted-foreground mt-1">Scan the QR code with your authenticator app, then enter the code to verify.</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Step 1: QR code */}
            <div>
              <p className="text-sm font-medium mb-3">1. Scan this QR code with Google Authenticator, Authy, or any TOTP app</p>
              {qrDataUrl && (
                <div className="flex justify-center">
                  <img src={qrDataUrl} alt="MFA QR code" className="rounded-lg border border-border" />
                </div>
              )}
            </div>

            {/* Manual key fallback */}
            <div>
              <p className="text-sm font-medium mb-2">Can't scan? Enter this key manually:</p>
              <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
                <code className="flex-1 text-sm font-mono tracking-widest break-all">
                  {sharedKey.match(/.{1,4}/g)?.join(' ') ?? sharedKey}
                </code>
                <button type="button" onClick={copyKey} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Step 2: Verify code */}
            <form onSubmit={(e) => void handleEnable(e)} className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-3">2. Enter the 6-digit code from your app to verify and enable MFA</p>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={code} onChange={setCode}>
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
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting || code.length !== 6} className="flex-1">
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</> : <>
                    <ShieldCheck className="mr-2 h-4 w-4" />Enable MFA
                  </>}
                </Button>
                <Button type="button" variant="outline" onClick={() => setView('disabled')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // view === 'disabled'
  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Two-Factor Authentication</h1>
        <p className="text-muted-foreground mt-1">Add an extra layer of security to your account.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldOff className="h-5 w-5 text-muted-foreground" />
            MFA is not enabled
          </CardTitle>
          <CardDescription>
            Protect your account by requiring a verification code in addition to your password when you sign in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Works with Google Authenticator, Authy, 1Password, and more</li>
            <li>Required each time you sign in once enabled</li>
            <li>Can be disabled at any time from this page</li>
          </ul>
          <Button onClick={() => void startSetup()}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Set up MFA
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
