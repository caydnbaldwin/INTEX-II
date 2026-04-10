import { lazy, Suspense, type ReactNode } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import CookieConsentBanner from './components/CookieConsentBanner'

const PublicLayout = lazy(() =>
  import('./layouts/PublicLayout').then((m) => ({ default: m.PublicLayout })),
)
const AdminLayout = lazy(() =>
  import('./layouts/AdminLayout').then((m) => ({ default: m.AdminLayout })),
)
const LandingPage = lazy(() =>
  import('./pages/landing').then((m) => ({ default: m.LandingPage })),
)
const ImpactDashboard = lazy(() =>
  import('./pages/impact-dashboard').then((m) => ({ default: m.ImpactDashboard })),
)
const LoginPage = lazy(() =>
  import('./pages/login').then((m) => ({ default: m.LoginPage })),
)
const PrivacyPolicy = lazy(() =>
  import('./pages/privacy-policy').then((m) => ({ default: m.PrivacyPolicy })),
)
const ContactPage = lazy(() =>
  import('./pages/contact').then((m) => ({ default: m.ContactPage })),
)
const AdminDashboard = lazy(() =>
  import('./pages/admin/dashboard').then((m) => ({ default: m.AdminDashboard })),
)
const CaseloadInventory = lazy(() =>
  import('./pages/admin/caseload').then((m) => ({ default: m.CaseloadInventory })),
)
const ProcessRecording = lazy(() =>
  import('./pages/admin/process-recording').then((m) => ({ default: m.ProcessRecording })),
)
const HomeVisitation = lazy(() =>
  import('./pages/admin/home-visitation').then((m) => ({ default: m.HomeVisitation })),
)
const DonorsManagement = lazy(() =>
  import('./pages/admin/donors').then((m) => ({ default: m.DonorsManagement })),
)
const ReportsAnalytics = lazy(() =>
  import('./pages/admin/reports').then((m) => ({ default: m.ReportsAnalytics })),
)
const EmailTemplates = lazy(() =>
  import('./pages/admin/email-templates').then((m) => ({ default: m.EmailTemplates })),
)
const BoardingManagement = lazy(() =>
  import('./pages/admin/boarding').then((m) => ({ default: m.BoardingManagement })),
)
const AiChatPage = lazy(() =>
  import('./pages/admin/chat').then((m) => ({ default: m.AiChatPage })),
)
const ExpansionPlanning = lazy(() =>
  import('./pages/admin/expansion').then((m) => ({ default: m.ExpansionPlanning })),
)
const SocialMediaGuide = lazy(() =>
  import('./pages/admin/social-media').then((m) => ({ default: m.SocialMediaRecommendation })),
)
const UserManagement = lazy(() =>
  import('./pages/admin/user-management').then((m) => ({ default: m.UserManagement })),
)
const DonorPortal = lazy(() =>
  import('./pages/donor/portal').then((m) => ({ default: m.DonorPortal })),
)
const SafehouseDetail = lazy(() =>
  import('./pages/safehouse-detail').then((m) => ({ default: m.SafehouseDetail })),
)
const DonatePage = lazy(() =>
  import('./pages/donate').then((m) => ({ default: m.DonatePage })),
)
const ManageMFAPage = lazy(() => import('./pages/ManageMFAPage'))
const MfaChallengePage = lazy(() => import('./pages/MfaChallengePage'))

function ProtectedRoute({
  children,
  requiredRole,
  redirectTo,
}: {
  children: ReactNode
  requiredRole?: string | string[]
  redirectTo?: string
}) {
  const { isAuthenticated, isLoading, authSession } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  const allowed = !requiredRole || (
    Array.isArray(requiredRole)
      ? requiredRole.some((r) => authSession.roles.includes(r))
      : authSession.roles.includes(requiredRole)
  )
  if (!allowed) return <Navigate to={redirectTo ?? '/'} replace />

  return <>{children}</>
}

function AdminIndexRedirect() {
  const { authSession } = useAuth()

  return authSession.roles.includes('Admin')
    ? <AdminDashboard />
    : <Navigate to="/admin/caseload" replace />
}

export default function App() {
  return (
    <>
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        }
      >
        <Routes>
          {/* Public routes */}
          <Route element={<PublicLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="impact" element={<ImpactDashboard />} />
            <Route path="impact/safehouse/:id" element={<SafehouseDetail />} />
            <Route path="donate" element={<DonatePage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="privacy" element={<PrivacyPolicy />} />
          </Route>

          {/* Admin routes */}
          <Route
            path="admin"
            element={
              <ProtectedRoute requiredRole={['Admin', 'Staff']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminIndexRedirect />} />
            <Route
              path="chat"
              element={
                <ProtectedRoute requiredRole="Admin" redirectTo="/admin/caseload">
                  <AiChatPage />
                </ProtectedRoute>
              }
            />
            <Route path="caseload" element={<CaseloadInventory />} />
            <Route path="process-recording" element={<ProcessRecording />} />
            <Route path="visitation" element={<HomeVisitation />} />
            <Route
              path="donors"
              element={
                <ProtectedRoute requiredRole="Admin" redirectTo="/admin/caseload">
                  <DonorsManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="email-templates"
              element={
                <ProtectedRoute requiredRole="Admin" redirectTo="/admin/caseload">
                  <EmailTemplates />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute requiredRole="Admin" redirectTo="/admin/caseload">
                  <ReportsAnalytics />
                </ProtectedRoute>
              }
            />
            <Route path="safehouses/boarding" element={<BoardingManagement />} />
            <Route
              path="expansion"
              element={
                <ProtectedRoute requiredRole="Admin" redirectTo="/admin/caseload">
                  <ExpansionPlanning />
                </ProtectedRoute>
              }
            />
            <Route
              path="social-media"
              element={
                <ProtectedRoute requiredRole="Admin" redirectTo="/admin/caseload">
                  <SocialMediaGuide />
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute requiredRole="Admin" redirectTo="/admin/caseload">
                  <UserManagement />
                </ProtectedRoute>
              }
            />
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
      </Suspense>
      <CookieConsentBanner />
    </>
  )
}
