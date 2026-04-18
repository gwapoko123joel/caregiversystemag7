import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { type ReactNode, useEffect } from 'react'
import { ShieldAlert } from 'lucide-react'
import { Toaster } from 'sonner'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CaregiverDashboard from './pages/caregiver/CaregiverDashboard'
import PractitionerDashboard from './pages/practitioner/PractitionerDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import LandingPage from './pages/LandingPage'

// ── Loading Spinner ──────────────────────────────────────────

function FullPageSpinner() {
  return (
    <div style={{ 
      minHeight:'100svh', 
      display:'flex', 
      alignItems:'center', 
      justifyContent:'center', 
      background:'#1A052E', 
      fontFamily:'Inter, system-ui, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Glows */}
      <div style={{ position: 'absolute', top:'-10%', right:'-10%', width:'600px', height:'600px', background:'rgba(57, 255, 20, 0.05)', filter:'blur(100px)', borderRadius:'50%' }} />
      <div style={{ position: 'absolute', bottom:'-10%', left:'-10%', width:'400px', height:'400px', background:'rgba(139, 92, 246, 0.1)', filter:'blur(80px)', borderRadius:'50%' }} />

      <div style={{ textAlign:'center', position: 'relative', zIndex: 10 }}>
        <div style={{ 
          width:64, 
          height:64, 
          border:'2px solid rgba(57, 255, 20, 0.1)', 
          borderTopColor:'#39FF14', 
          borderRadius:'50%', 
          animation:'spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite', 
          margin:'0 auto 2rem',
          boxShadow: '0 0 30px rgba(57, 255, 20, 0.2)'
        }} />
        <h2 style={{ color:'white', fontSize:'1.25rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', margin: '0 0 0.5rem', fontStyle: 'italic' }}>BantayanCare</h2>
        <p style={{ color:'#64748b', fontSize:'0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin:0 }}>Authenticating Secure Node…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

function PendingApproval() {
  const { signOut } = useAuth()
  return (
    <div style={{ minHeight:'100svh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc', padding:'2rem' }}>
      <div className="panel" style={{ maxWidth: 450, textAlign: 'center', padding: '3rem' }}>
        <div style={{ background: 'var(--amber-bg)', color: 'var(--amber)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <ShieldAlert size={32} />
        </div>
        <h2 style={{ marginBottom: '1rem' }}>Account Pending Approval</h2>
        <p style={{ color: 'var(--gray-500)', marginBottom: '2rem', lineHeight: 1.6 }}>
          Thank you for registering with BantayanCare. Your account is currently <strong>pending administrator authorization</strong>. 
          Please contact your supervisor to verify your credentials.
        </p>
        <div className="flex flex-col gap-3">
          <button className="btn btn--primary btn--full" onClick={() => window.location.reload()}>Refresh Status</button>
          <button className="btn btn--ghost btn--full" onClick={() => signOut()}>Sign Out</button>
        </div>
      </div>
    </div>
  )
}

// ── Protected Route (requires auth) ─────────────────────────

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

// ── Guest Route (redirect if already authed) ─────────────────

function GuestRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  return (!user || (user && !profile)) ? <>{children}</> : <Navigate to="/dashboard" replace />
}

// ── Role-Based Dashboard Router ───────────────────────────────
// Reads profile.role and redirects to the correct dashboard URL

function RoleRouter() {
  const { profile, loading, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // 1. Still fetching auth state? WAIT.
    if (loading) return
    
    // 2. No user? Back to login.
    if (!user) {
      console.warn('[RoleRouter] No authenticated user found, redirecting to login.')
      navigate('/login', { replace: true })
      return
    }

    // 3. User present but no profile? Definitive check for orphan session.
    if (!profile) {
      console.error('[RoleRouter] User authenticated but no profile found in caregivers table for UID:', user.id)
      // Soft redirect to login (GuestRoute will allow staying there because profile=null)
      navigate('/login?error=profile_not_found', { replace: true })
      return
    }

    // 4. Check account status
    if (profile.status === 'pending' || profile.status === 'revoked') {
      console.log('[RoleRouter] Account status:', profile.status)
      return // Component will render PendingApproval
    }

    // 5. Success! Navigate to the appropriate dashboard
    console.log('[RoleRouter] Routing user to dashboard for role:', profile.role)
    switch (profile.role) {
      case 'caregiver':            navigate('/dashboard/caregiver',     { replace: true }); break
      case 'medical_practitioner': navigate('/dashboard/practitioner',  { replace: true }); break
      case 'admin':                navigate('/dashboard/admin',         { replace: true }); break
      default:                     navigate('/dashboard/caregiver',     { replace: true }); break
    }
  }, [profile, loading, navigate, user])

  if (profile?.status === 'pending' || profile?.status === 'revoked') {
    return <PendingApproval />
  }

  return <FullPageSpinner />
}

import { AnimatePresence } from 'framer-motion'
import PageTransition from './components/PageTransition'

function AppRoutes() {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />

        {/* Auth (guest only) */}
        <Route path="/login" element={<GuestRoute><PageTransition><LoginPage /></PageTransition></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><PageTransition><RegisterPage /></PageTransition></GuestRoute>} />

        {/* Role dispatcher */}
        <Route path="/dashboard" element={<ProtectedRoute><RoleRouter /></ProtectedRoute>} />

        {/* Role-specific dashboards - These will have internal transitions */}
        <Route path="/dashboard/caregiver/*" element={<ProtectedRoute><CaregiverDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/practitioner/*" element={<ProtectedRoute><PractitionerDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/admin/*" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

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
