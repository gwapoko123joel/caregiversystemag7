import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { ShieldCheck, RefreshCw, Menu } from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import BottomNav from '../../components/BottomNav'
import MobileHeader from '../../components/MobileHeader'
import LogoutModal from '../../components/LogoutModal'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import type { Profile, ActivityLog } from '../../types/database'
import type { User } from '@supabase/supabase-js'
import { AnimatePresence } from 'framer-motion'
import PageTransition from '../../components/PageTransition'
import { useSidebar } from '../../contexts/SidebarContext'

// Views
import AdminOverview from './views/AdminOverview'
import UserManagement from './views/UserManagement'
import AuditTrail from './views/AuditTrail'
import SystemHealth from './views/SystemHealth'
import SecurityOverview from './views/SecurityOverview'
import PractitionerVerificationView from './views/PractitionerVerificationView'
import FieldVerificationView from './views/FieldVerificationView'
import PatientManagementView from './views/PatientManagementView'
import AdminPatientDossier from './views/AdminPatientDossier'
import HealthAnalytics from './views/HealthAnalytics'
import ProfilePage from '../shared/ProfilePage'

export interface AdminDashboardContextType {
  users: Profile[]
  logs: ActivityLog[]
  health: {
    reportsToday: number
    criticalAlerts: number
    serverUptime: string
    dbStatus: string
    authStatus: string
    pushService: string
  }
  performance: any[]
  loadUsers: () => Promise<void>
  loadLogs: () => Promise<void>
  loadSystemData: () => Promise<void>
  loadData: () => Promise<void>
  user: User | null
  profile: Profile | null
  isLoading: boolean
  error: string | null
}

function AdminLayout() {
  const { user, profile, signOut } = useAuth()
  const { isCollapsed, isDesktop, toggleCollapse } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()

  // State
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<Profile[]>([])
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [health, setHealth] = useState({
    reportsToday: 0, criticalAlerts: 0, serverUptime: '99.98%',
    dbStatus: 'Operational', authStatus: 'Operational', pushService: 'Active',
  })
  const [performance, setPerformance] = useState<any[]>([])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      await Promise.all([loadUsers(), loadLogs(), loadSystemData(), loadPerformance()])
    } catch (err: any) {
      setError(err.message || 'Synchronization failed.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadUsers = useCallback(async () => {
    const { data, error: fetchErr } = await supabase
      .from('caregivers')
      .select('*')
      .order('status', { ascending: false })
      .order('created_at', { ascending: false })

    if (fetchErr) throw fetchErr

    // Add backward-compat access_id alias from unique_access_id
    const usersWithAlias = (data ?? []).map((u: any) => ({
      ...u,
      access_id: u.unique_access_id,
    }))

    setUsers(usersWithAlias as any[])
  }, [])

  const loadLogs = useCallback(async () => {
    const { data, error: fetchErr } = await supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100)

    if (fetchErr) throw fetchErr
    setLogs((data ?? []) as ActivityLog[])
  }, [])

  const loadSystemData = useCallback(async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const [{ count: reports, error: er1 }, { count: critical, error: er2 }] = await Promise.all([
      supabase.from('patient_monitoring_logs').select('log_id', { count: 'exact', head: true }).gte('recorded_at', today.toISOString()),
      supabase.from('alerts').select('alert_id', { count: 'exact', head: true }).eq('is_resolved', false),
    ])

    if (er1) throw er1
    if (er2) throw er2

    setHealth(prev => ({ ...prev, reportsToday: reports ?? 0, criticalAlerts: critical ?? 0 }))
  }, [])
  
  const loadPerformance = useCallback(async () => {
    const { data, error: fetchErr } = await supabase
      .from('caregiver_performance_summary')
      .select('*')
      .order('total_reports', { ascending: false })
      .limit(5)

    if (fetchErr) throw fetchErr
    setPerformance(data ?? [])
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const contextValue: AdminDashboardContextType = {
    users, logs, health, performance, loadUsers, loadLogs, loadSystemData, loadData, user, profile, isLoading, error
  }

  const handleConfirmLogout = async () => {
    await signOut()
    navigate('/')
  }

  // Derive title based on current path
  let title = "System Governance"
  let subTitle = "Bantayan Administrative Node — Security & Oversight"

  if (location.pathname.includes('/users')) {
    title = "User Management"
    subTitle = "Provisioning, Access Governance, & Policy Enforcement"
  } else if (location.pathname.includes('/logs')) {
    title = "System Audit Log"
    subTitle = "Immutable Global Activity Stream"
  } else if (location.pathname.includes('/health')) {
    title = "System Health"
    subTitle = "Core Delivery Pipeline & Operations Console"
  } else if (location.pathname.includes('/security')) {
    title = "Security Overview"
    subTitle = "Global Authorization Metrics & Security Rules Engine"
  } else if (location.pathname.includes('/profile')) {
    title = "My Operator Profile"
    subTitle = "Personalized Administrative Credentials & Node Metadata"
  } else if (location.pathname.includes('/patients/verification')) {
    title = "Field Verification"
    subTitle = "Verifying Patient Onboarding Requests"
  } else if (location.pathname.includes('/patients/roster')) {
    title = "Patient Roster"
    subTitle = "Global Health Registry Management"
  } else if (location.pathname.includes('/analytics')) {
    title = "Barangay Health Profile"
    subTitle = "Population Health Coordination • Dumaguete City"
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-primary font-sans text-text-main transition-colors duration-300 selection:bg-sky-500 selection:text-white pb-20 md:pb-0">
      <Sidebar onLogoutClick={() => setShowLogoutModal(true)} />

      <div className="flex-1 flex flex-col min-h-screen">
        <MobileHeader onLogoutClick={() => setShowLogoutModal(true)} />

        <main className="flex-1 flex flex-col relative overflow-hidden">
          {/* Background Gradients */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none opacity-50 dark:opacity-100 transition-opacity" />

          {/* Desktop Header */}
          <header className="hidden md:flex relative z-10 px-8 py-6 items-center justify-between border-b border-card-border bg-primary/80 backdrop-blur-md sticky top-0 transition-colors">
            <div className="flex items-center gap-4">
              {isCollapsed && isDesktop && (
                <button
                  onClick={toggleCollapse}
                  className="p-3 bg-card border border-card-border rounded-xl text-sidebar-text-muted hover:text-sky-500 hover:border-sky-500 transition-all shadow-sm"
                  title="Expand Sidebar"
                >
                  <Menu size={20} />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-black tracking-tight uppercase text-text-main transition-colors leading-tight">{title}</h1>
                <p className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-[0.2em] mt-1 transition-colors">{subTitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => { loadUsers(); loadLogs(); loadSystemData(); }}
                className="px-6 py-3 bg-card hover:bg-slate-50 dark:hover:bg-white/5 border border-card-border rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all text-text-main active:scale-95 shadow-sm"
              >
                <RefreshCw size={14} className="text-sky-500" /> Sync Node
              </button>
              <div className="p-[2px] bg-gradient-to-tr from-sky-400 to-sky-600 rounded-full shadow-[0_0_15px_rgba(0,186,255,0.3)]">
                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
                  <ShieldCheck size={16} className="text-sky-400" />
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 p-4 md:p-8 relative z-10 overflow-y-auto">
            <AnimatePresence mode="wait">
              {location.pathname.includes('/admin/patient/') ? (
                <PageTransition key="patient-dossier">
                  <AdminPatientDossier 
                    patientId={location.pathname.split('/').pop()} 
                    onBack={() => navigate('/dashboard/admin/patients/roster')} 
                  />
                </PageTransition>
              ) : (
                <PageTransition key={location.pathname.split('/').filter(Boolean)[1] || 'root'}>
                  <Outlet context={contextValue} />
                </PageTransition>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <BottomNav />

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="logs" element={<AuditTrail />} />
        <Route path="health" element={<SystemHealth />} />
        <Route path="security" element={<SecurityOverview />} />
        <Route path="verification" element={<PractitionerVerificationView />} />
        <Route path="patients/verification" element={<FieldVerificationView />} />
        <Route path="patients/roster" element={<PatientManagementView />} />
        <Route path="analytics" element={<HealthAnalytics />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/dashboard/admin" replace />} />
      </Route>
    </Routes>
  )
}