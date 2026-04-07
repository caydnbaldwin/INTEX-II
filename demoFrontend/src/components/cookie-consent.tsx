import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'

const COOKIE_CONSENT_KEY = 'safe-haven-cookie-consent'

type ConsentState = 'pending' | 'accepted' | 'declined'

export function CookieConsent() {
  const [consentState, setConsentState] = useState<ConsentState>('pending')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check for existing consent
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (savedConsent) {
      setConsentState(savedConsent as ConsentState)
    } else {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
    setConsentState('accepted')
    setIsVisible(false)
    // Here you would enable analytics/tracking cookies
  }

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined')
    setConsentState('declined')
    setIsVisible(false)
    // Here you would disable non-essential cookies
  }

  const handleClose = () => {
    setIsVisible(false)
  }

  if (consentState !== 'pending' || !isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <Card className="mx-auto max-w-4xl shadow-lg border-primary/20">
        <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 pr-4">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold text-foreground">
                Cookie Preferences
              </h3>
              <button
                onClick={handleClose}
                className="md:hidden -mt-1 -mr-1 p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              We use cookies to enhance your browsing experience, analyze site traffic, 
              and personalize content. By clicking &quot;Accept All&quot;, you consent to our use of cookies. 
              Read our{' '}
              <Link to="/privacy" className="text-primary underline underline-offset-2 hover:text-primary/80">
                Privacy Policy
              </Link>{' '}
              for more information about how we handle your data.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button variant="outline" onClick={handleDecline} className="sm:order-1">
              Decline
            </Button>
            <Button onClick={handleAccept} className="sm:order-2">
              Accept All
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
