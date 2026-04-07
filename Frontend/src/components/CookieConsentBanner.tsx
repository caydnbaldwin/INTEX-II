import { useCookieConsent } from '../context/CookieConsentContext';

/**
 * GDPR-compliant cookie consent banner.
 *
 * IS 414 requirement: "fully functional" — user can accept OR reject,
 * choice is persisted (localStorage), banner does not reappear after choice.
 *
 * Style this with Tailwind / Shadcn to match your final design.
 * The structure below is intentionally unstyled so it doesn't interfere
 * with your IS 413 UI work.
 */
export default function CookieConsentBanner() {
  const { consentStatus, acceptConsent, rejectConsent } = useCookieConsent();

  // Only show when the user hasn't made a choice yet
  if (consentStatus !== 'pending') return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: '1rem 1.5rem',
        background: '#1a1a1a',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
      }}
    >
      <p style={{ margin: 0, fontSize: '0.9rem', maxWidth: 680 }}>
        We use cookies to keep you signed in and remember your preferences.
        We do not use advertising or tracking cookies.{' '}
        <a href="/privacy-policy" style={{ color: '#90cdf4' }}>
          Privacy Policy
        </a>
      </p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={rejectConsent}
          style={{
            padding: '0.4rem 1rem',
            background: 'transparent',
            border: '1px solid #fff',
            color: '#fff',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Reject
        </button>
        <button
          onClick={acceptConsent}
          style={{
            padding: '0.4rem 1rem',
            background: '#3182ce',
            border: 'none',
            color: '#fff',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
