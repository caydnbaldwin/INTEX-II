import { useCookieConsent } from '@/context/CookieConsentContext'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export default function CookieConsentBanner() {
  const { consentStatus, acceptConsent, rejectConsent } = useCookieConsent()

  if (consentStatus !== 'pending') return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      aria-modal="true"
      className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-border bg-background/95 backdrop-blur-sm px-6 py-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground max-w-xl">
          We use cookies to keep you signed in and remember your preferences.
          We do not use advertising or tracking cookies.{' '}
          <Link to="/privacy" className="text-primary underline underline-offset-4 hover:text-primary/80">
            Privacy Policy
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={rejectConsent}>
            Reject
          </Button>
          <Button size="sm" onClick={acceptConsent} autoFocus>
            Accept
          </Button>
        </div>
      </div>
    </div>
  )
}
