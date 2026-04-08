import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type ConsentStatus = 'pending' | 'accepted' | 'rejected';

const STORAGE_KEY = 'lunas-cookie-consent';

interface CookieConsentContextValue {
  consentStatus: ConsentStatus;
  acceptConsent: () => void;
  rejectConsent: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | undefined>(
  undefined
);

function readInitialStatus(): ConsentStatus {
  if (typeof window === 'undefined') return 'pending';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'accepted' || stored === 'rejected') return stored;
  return 'pending';
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>(readInitialStatus);

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      consentStatus,
      acceptConsent() {
        window.localStorage.setItem(STORAGE_KEY, 'accepted');
        setConsentStatus('accepted');
      },
      rejectConsent() {
        window.localStorage.setItem(STORAGE_KEY, 'rejected');
        setConsentStatus('rejected');
        // Remove non-essential cookies when consent is rejected
        document.cookie = 'user-theme=; Max-Age=0; path=/; Secure';
        document.cookie = 'sidebar_state=; Max-Age=0; path=/; Secure';
      },
    }),
    [consentStatus]
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context)
    throw new Error('useCookieConsent must be used within a CookieConsentProvider.');
  return context;
}
