import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CookieConsentProvider } from './context/CookieConsentContext'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from './components/ui/sonner'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CookieConsentProvider>
          <ThemeProvider>
            <App />
            <Toaster />
          </ThemeProvider>
        </CookieConsentProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
