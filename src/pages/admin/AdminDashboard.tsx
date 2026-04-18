import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom'
import { ShieldCheck, RefreshCw } from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import type { Profile, ActivityLog } from '../../lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

// Views
import AdminOverview from './views/AdminOverview'
import UserManagement from './views/UserManagement'
import AuditTrail from './views/AuditTrail'
import SystemHealth from './views/SystemHealth'
import SecurityOverview from './views/SecurityOverview'

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
  loadUsers: () => Promise<void>
  loadLogs: () => Promise<void>
  loadSystemData: () => Promise<void>
  user: User | null
  profile: Profile | null
}

function AdminLayout() {
  const { user, profile } = useAuth()
  const location = useLocation()

  // State
  const [users, setUsers] = useState<Profile[]>([])
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [health, setHealth] = useState({
    reportsToday: 0, criticalAlerts: 0, serverUptime: '99.98%',
    dbStatus: 'Operational', authStatus: 'Operational', pushService: 'Active',
  })

  const loadUsers = useCallback(async () => {
    const { data } = await supabase
      .from('caregivers')
      .select('*')
      .order('status', { ascending: false })
      .order('created_at', { ascending: false })
    setUsers((data ?? []) as Profile[])
  }, [])

  const loadLogs = useCallback(async () => {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100)
    setLogs((data ?? []) as ActivityLog[])
  }, [])

  const loadSystemData = useCallback(async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const [{ count: reports }, { count: critical }] = await Promise.all([
      supabase.from('patient_monitoring_logs').select('log_id', { count: 'exact', head: true }).gte('recorded_at', today.toISOString()),
      supabase.from('alerts').select('alert_id', { count: 'exact', head: true }).eq('alert_type', 'emergency'),
    ])
    setHealth(prev => ({ ...prev, reportsToday: reports ?? 0, criticalAlerts: critical ?? 0 }))
  }, [])

  useEffect(() => {
    Promise.all([loadUsers(), loadLogs(), loadSystemData()]).catch(console.error)
  }, [loadUsers, loadLogs, loadSystemData])

  const contextValue: AdminDashboardContextType = {
    users, logs, health, loadUsers, loadLogs, loadSystemData, user, profile
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
  }

  return (
    <div className="flex min-h-screen bg-primary font-sans text-text-main transition-colors duration-300 selection:bg-sky-500 selection:text-white">
      <Sidebar />
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none opacity-50 dark:opacity-100 transition-opacity" />

        {/* Topbar */}
        <header className="relative z-10 px-8 py-6 flex items-center justify-between border-b border-card-border bg-primary/80 backdrop-blur-md sticky top-0 transition-colors">
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase text-text-main transition-colors">{title}</h1>
            <p className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-[0.2em] mt-1 transition-colors">{subTitle}</p>
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
        <div className="flex-1 p-8 relative z-10 overflow-y-auto">
          <Outlet context={contextValue} />
        </div>
      </main>
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
        <Route path="*" element={<Navigate to="/dashboard/admin" replace />} />
      </Route>
    </Routes>
  )
}
