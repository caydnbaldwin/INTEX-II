import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { PublicLayout } from './layouts/PublicLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { LandingPage } from './pages/landing'
import { ImpactDashboard } from './pages/impact-dashboard'
import { LoginPage } from './pages/login'
import { PrivacyPolicy } from './pages/privacy-policy'
import { AdminDashboard } from './pages/admin/dashboard'
import { CaseloadInventory } from './pages/admin/caseload'
import { ProcessRecording } from './pages/admin/process-recording'
import { HomeVisitation } from './pages/admin/home-visitation'
import { DonorsManagement } from './pages/admin/donors'
import { ReportsAnalytics } from './pages/admin/reports'
import { DonorPortal } from './pages/donor/portal'
import ManageMFAPage from './pages/ManageMFAPage'
import MfaChallengePage from './pages/MfaChallengePage'
import CookieConsentBanner from './components/CookieConsentBanner'

function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode
  requiredRole?: string
}) {
  const { isAuthenticated, isLoading, authSession } = useAuth()

  // DEV BYPASS: allow access if ?bypass=true is in the URL or sessionStorage
  const bypass = new URLSearchParams(window.location.search).has('bypass') ||
    sessionStorage.getItem('devBypass') === 'true'
  if (bypass) {
    sessionStorage.setItem('devBypass', 'true')
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (requiredRole && !authSession.roles.includes(requiredRole))
    return <Navigate to="/" replace />

  return <>{children}</>
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="impact" element={<ImpactDashboard />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
        </Route>

        {/* Admin routes */}
        <Route
          path="admin"
          element={
            <ProtectedRoute requiredRole="Admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="caseload" element={<CaseloadInventory />} />
          <Route path="process-recording" element={<ProcessRecording />} />
          <Route path="visitation" element={<HomeVisitation />} />
          <Route path="donors" element={<DonorsManagement />} />
          <Route path="reports" element={<ReportsAnalytics />} />
        </Route>

        {/* Donor routes */}
        <Route
          path="donor"
          element={
            <ProtectedRoute requiredRole="Donor">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DonorPortal />} />
        </Route>

        {/* MFA management — accessible to any authenticated user */}
        <Route
          path="mfa"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ManageMFAPage />} />
        </Route>

        {/* MFA challenge — public, shown after Google OAuth when MFA is required */}
        <Route path="mfa-challenge" element={<MfaChallengePage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CookieConsentBanner />
    </>
  )
}
