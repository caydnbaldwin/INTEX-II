import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CookieConsentProvider } from './context/CookieConsentContext'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CookieConsentProvider>
          <App />
        </CookieConsentProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
