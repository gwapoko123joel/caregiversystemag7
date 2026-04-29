import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'

// Auth Pages
import HealthWorkerLoginPage from './pages/auth/HealthWorkerLoginPage'
import GovernanceLoginPage from './pages/auth/GovernanceLoginPage'
import RegisterPage from './pages/RegisterPage'

// Dashboards
import CaregiverDashboard from './pages/caregiver/CaregiverDashboard'
import PractitionerDashboard from './pages/practitioner/PractitionerDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import LandingPage from './pages/LandingPage'

// Components
import ProtectedRoute from './components/auth/ProtectedRoute'
import PageTransition from './components/PageTransition'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from './hooks/useAuth'

// ── Role Router Page (Internal Redirect) ─────────────────────────
function RoleRouter() {
  const { profile, loading, user } = useAuth()

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  // If status is pending or revoked (from existing system)
  if (profile?.status === 'pending' || profile?.status === 'revoked') {
    return <Navigate to="/" replace /> // Handling this better in login page
  }

  switch (profile?.role) {
    case 'caregiver':            return <Navigate to="/dashboard/caregiver" replace />
    case 'medical_practitioner': return <Navigate to="/dashboard/practitioner" replace />
    case 'admin':                return <Navigate to="/dashboard/admin" replace />
    default:                     return <Navigate to="/login" replace />
  }
}

function AppRoutes() {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        
        {/* Auth Pages */}
        <Route path="/login" element={<PageTransition><HealthWorkerLoginPage /></PageTransition>} />
        <Route path="/governance" element={<PageTransition><GovernanceLoginPage /></PageTransition>} />
        <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />

        {/* Role dispatcher */}
        <Route path="/dashboard" element={<ProtectedRoute><RoleRouter /></ProtectedRoute>} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard/caregiver/*"
          element={
            <ProtectedRoute allowedRoles={['caregiver']}>
              <CaregiverDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/practitioner/*"
          element={
            <ProtectedRoute allowedRoles={['medical_practitioner']}>
              <PractitionerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Toaster richColors position="top-right" />
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
