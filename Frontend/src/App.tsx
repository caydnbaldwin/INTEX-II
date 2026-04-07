import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { CookieConsentProvider } from '@/context/CookieConsentContext';
import AppShell from '@/components/layout/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';

// Auth pages (standalone — no AppShell)
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import LogoutPage from '@/pages/LogoutPage';

// AppShell pages
import HomePage from '@/pages/HomePage';
import ImpactPage from '@/pages/ImpactPage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';

// Protected pages
import DashboardPage from '@/pages/DashboardPage';
import DonorsPage from '@/pages/DonorsPage';
import ManageMFAPage from '@/pages/ManageMFAPage';

export default function App() {
  return (
    <CookieConsentProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Standalone auth pages */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/logout" element={<LogoutPage />} />

            {/* Public pages with AppShell */}
            <Route
              path="/"
              element={
                <AppShell>
                  <HomePage />
                </AppShell>
              }
            />
            <Route
              path="/impact"
              element={
                <AppShell>
                  <ImpactPage />
                </AppShell>
              }
            />
            <Route
              path="/privacy-policy"
              element={
                <AppShell>
                  <PrivacyPolicyPage />
                </AppShell>
              }
            />

            {/* Protected: any authenticated user */}
            <Route
              path="/mfa"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <ManageMFAPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />

            {/* Protected: Admin only */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AppShell>
                    <DashboardPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/donors"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AppShell>
                    <DonorsPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </CookieConsentProvider>
  );
}
