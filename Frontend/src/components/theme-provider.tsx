import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useCookieConsent } from '@/context/CookieConsentContext'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  canSetTheme: boolean
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function getCookieValue(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { consentStatus } = useCookieConsent()
  const [theme, setThemeState] = useState<Theme>('light')

  // Read theme from cookie only when consent is accepted
  useEffect(() => {
    if (consentStatus === 'accepted') {
      const saved = getCookieValue('user-theme')
      if (saved === 'dark' || saved === 'light') {
        setThemeState(saved)
      }
    } else if (consentStatus === 'rejected') {
      // Force light theme and ensure cookie is deleted
      setThemeState('light')
      document.cookie = 'user-theme=; Max-Age=0; path=/; Secure'
    }
  }, [consentStatus])

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  function setTheme(newTheme: Theme) {
    setThemeState(newTheme)
    if (consentStatus === 'accepted') {
      // Set browser-accessible cookie (not httpOnly) so React can read it
      document.cookie = `user-theme=${newTheme}; path=/; max-age=${60 * 60 * 24 * 365}; Secure; SameSite=Lax`
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, canSetTheme: consentStatus === 'accepted' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
