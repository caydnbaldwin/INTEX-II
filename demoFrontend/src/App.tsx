import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout'
import { LandingPage } from './pages/landing'
import { ImpactDashboard } from './pages/impact-dashboard'
import { LoginPage } from './pages/login'
import { PrivacyPolicy } from './pages/privacy-policy'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="impact" element={<ImpactDashboard />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="privacy" element={<PrivacyPolicy />} />
      </Route>
    </Routes>
  )
}

export default App
