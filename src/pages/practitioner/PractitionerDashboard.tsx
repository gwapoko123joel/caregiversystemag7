import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Activity, VolumeX, Volume2, Monitor, Menu, ShieldAlert
} from 'lucide-react'
import { Routes, Route, useLocation, useNavigate, Navigate, Outlet } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { ErrorBoundary } from '../../components/ErrorBoundary'
import BottomNav from '../../components/BottomNav'
import MobileHeader from '../../components/MobileHeader'
import LogoutModal from '../../components/LogoutModal'
import { useTheme } from '../../contexts/ThemeContext'
import AvailabilityToggle from '../../components/AvailabilityToggle'
import { useSidebar } from '../../contexts/SidebarContext'

import { supabase } from '../../lib/supabaseClient'
import ConsultationModal from '../../components/ConsultationModal'
import { useAuth } from '../../hooks/useAuth'
import { AnimatePresence } from 'framer-motion'
import PageTransition from '../../components/PageTransition'
import { useOutletContext } from 'react-router-dom'

// Import Sub-Views
import PractitionerOverview from './views/PractitionerOverview'
import PatientFeed from './views/PatientFeed'
import AlertCenter from './views/AlertCenter'
import HistoryLogs from './views/HistoryLogs'
import PatientDossier from './views/PatientDossier'
import ContactConsole from './views/ContactConsole'
import PractitionerCredentialsForm from './views/PractitionerCredentialsForm'
import PatientReferralForm from './views/PatientReferralForm'
import ProfilePage from '../shared/ProfilePage'

import type { 
  AlertItem, 
  PatientWithLogs, 
  PractitionerDashboardContextType 
} from './types'

function PractitionerLayout() {
  const { user, signOut } = useAuth()
  const { isCollapsed, isDesktop, toggleCollapse } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()
  const { theme: _theme } = useTheme()
  const [patients, setPatients] = useState<PatientWithLogs[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showCall, setShowCall] = useState(false)
  const [selectedPatientForCall, setSelectedPatientForCall] = useState<string | undefined>()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const audioCtx = useRef<AudioContext | null>(null)
  const lastAlertCount = useRef(0)
  const [activeSOS, setActiveSOS] = useState<any>(null);

  const playAlert = useCallback(() => {
    if (!soundEnabled) return
    try {
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const ctx = audioCtx.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.value = 880
      gain.gain.setValueAtTime(0.4, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.7)
    } catch { /* block */ }
  }, [soundEnabled])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    console.log("Practitioner Node: Initiating Data Sync...");

    try {
      // 1. Fetch Patients with basic logs
      const { data: pData, error: pError } = await supabase
        .from('patients')
        .select(`
          *,
          patient_monitoring_logs (*)
        `);

      if (pError) {
        console.error("Patient Fetch Error:", pError);
      } else if (pData) {
        const processedPatients: PatientWithLogs[] = (pData as any[]).map(p => {
           const logs = p.patient_monitoring_logs || [];
           const sortedLogs = [...logs].sort((a,b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
           // Add a mock caregiver_name since we removed the join
           const mappedLogs = sortedLogs.map(l => ({ ...l, caregiver_name: 'Field Personnel' }));
           return { 
             ...p, 
             patient_monitoring_logs: mappedLogs,
             latest_log: mappedLogs[0] || null
           };
        });
        setPatients(processedPatients);
      }

      // 2. Fetch Alerts (Simplified join)
      const { data: alertData, error: aError } = await supabase
        .from('alerts')
        .select('*, patients(*)')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      if (aError) {
        console.error("Alert Fetch Error:", aError);
      } else if (alertData) {
        const mappedAlerts = alertData.map((a: any) => ({
          id: a.alert_id,
          patient_name: a.patients ? `${a.patients.first_name} ${a.patients.last_name}` : 'Unknown Patient',
          status: a.severity,
          time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          vitals: a.description,
          dismissed: false,
          patient_id: a.patient_id
        }));

        const urgentCount = mappedAlerts.filter((a: AlertItem) => a.status === 'critical').length;
        if (urgentCount > lastAlertCount.current) playAlert();
        
        setAlerts(mappedAlerts);
        lastAlertCount.current = urgentCount;
      }
    } catch (err) {
      console.error("Critical Sync Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [playAlert])

  useEffect(() => {
    loadData()
    const channel = supabase
      .channel('practitioner-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => {
        loadData()
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadData, playAlert])

  useEffect(() => {
    console.log("Practitioner Node: Listening for Global SOS...");

    const channel = supabase
      .channel('global-sos-stream') // Unique channel name for real-time broadcast
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'emergency_dispatches',
          filter: 'status=eq.active' // Only listen for NEW active emergencies
        }, 
        async (payload) => {
          console.log("🚨 SOS RECEIVED:", payload);
          
          // Fetch patient details to show on the red screen
          const { data: patient } = await supabase
            .from('patients')
            .select('*')
            .eq('patient_id', payload.new.patient_id)
            .single();

          if (patient) {
            setActiveSOS({ ...payload.new, patient });
            // Use the established playAlert function for the demo
            playAlert();
          }
        }
      )
      .subscribe((status) => {
        console.log("SOS Subscription Status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playAlert]);

  async function handleSOSResponse(dispatchId: string) {
    if (!user) return;
    try {
      // 1. Tell the database the Doctor is taking over
      const { error } = await supabase
        .from('emergency_dispatches')
        .update({ 
          status: 'responding', 
          responded_by: user.id 
        })
        .eq('dispatch_id', dispatchId);

      if (error) throw error;

      // 2. Clear the red screen locally
      setActiveSOS(null);

      // 3. Navigate the doctor to the patient's record immediately
      navigate(`/dashboard/practitioner/patient/${activeSOS.patient_id}`);

    } catch (err: any) {
      console.error("SOS Response Error:", err.message);
    }
  }

  const dismissAlert = (id: string | number) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, dismissed: true } : a))
  }

  const initiateCall = (_caregiverName?: string, patientName?: string) => {
    setSelectedPatientForCall(patientName)
    setShowCall(true)
  }

  const handleConfirmLogout = async () => {
    await signOut()
    navigate('/')
  }

  // Derive global data
  const criticalAlerts = useMemo(() => alerts.filter(a => a.status === 'critical' && !a.dismissed), [alerts])
  const alertCount = useMemo(() => criticalAlerts.length, [criticalAlerts])
  const allLogs = useMemo(() => {
    return patients.flatMap(p => 
      (p.patient_monitoring_logs || []).map(l => ({
        ...l,
        patient_name: `${p.first_name} ${p.last_name}`,
        caregiver_name: (l as any).caregiver_name || 'Field Personnel'
      }))
    ).sort((a,b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
  }, [patients])

  const contextValue: PractitionerDashboardContextType = {
    patients, alerts, alertCount, isLoading, criticalAlerts, allLogs, initiateCall, loadData, dismissAlert
  }

  // Context-aware Header Title
  const getHeaderTitle = () => {
    if (location.pathname.includes('/feed')) return 'Node Telemetry Feed'
    if (location.pathname.includes('/alerts')) return 'Clinical Threshold Inbox'
    if (location.pathname.includes('/contact')) return 'Direct Consultation Console'
    if (location.pathname.includes('/history')) return 'Historical Node Archive'
    if (location.pathname.includes('/patient/')) return 'Clinical Subject Dossier'
    if (location.pathname.includes('/profile')) return 'Operator Profile Node'
    if (location.pathname.includes('/referral')) return 'Clinical Referral Entry'
    return 'Regional Operations Center'
  }
  return (
    <div className="min-h-screen bg-[#020617]">
      <LogoutModal 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />

      {/* SOS EMERGENCY OVERLAY */}
      {activeSOS && (
        <div className="fixed inset-0 z-[9999] bg-red-600/95 backdrop-blur-xl flex items-center justify-center p-6 text-white animate-in fade-in zoom-in duration-300">
          <div className="max-w-md w-full text-center space-y-8">
            <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <ShieldAlert size={80} />
            </div>
            <div>
              <h1 className="text-5xl font-black uppercase tracking-tighter">SOS ACTIVE</h1>
              <p className="text-xl font-medium mt-2 opacity-80">Life-Threatening Emergency Detected</p>
            </div>
            
            <div className="bg-white/10 p-8 rounded-[40px] border border-white/20 shadow-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-60">Subject Identity</p>
              <h2 className="text-3xl font-black uppercase">{activeSOS.patient?.first_name} {activeSOS.patient?.last_name}</h2>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-60">Last Known Location</p>
                <p className="text-sm font-bold uppercase">{activeSOS.patient?.address || 'Location Not Specified'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => handleSOSResponse(activeSOS.dispatch_id)}
                className="w-full py-6 bg-white text-red-600 rounded-3xl font-black uppercase tracking-widest text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all"
              >
                I AM RESPONDING NOW
              </button>
              
              <button 
                onClick={() => setActiveSOS(null)}
                className="text-xs font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity"
              >
                Dismiss Alert
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row min-h-screen font-sans text-text-main transition-colors duration-300 selection:bg-sky-500 selection:text-white pb-20 md:pb-0">
        <Sidebar onLogoutClick={() => setShowLogoutModal(true)} />

        <div className="flex-1 flex flex-col min-h-screen">
          <MobileHeader onLogoutClick={() => setShowLogoutModal(true)} />
          
          <main className={`flex-1 flex flex-col relative overflow-hidden transition-all duration-700 ${alertCount > 0 ? 'ring-4 ring-sky-500/50 shadow-[inset_0_0_100px_rgba(0,186,255,0.2)] animate-pulse-slow' : ''}`}>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none opacity-50 dark:opacity-100 transition-opacity" />
            
            {/* Desktop Header */}
            <header className={`hidden md:flex relative z-50 px-8 py-6 items-center justify-between border-b backdrop-blur-xl sticky top-0 transition-all duration-500 ${alertCount > 0 ? 'bg-rose-500/10 border-rose-500/40 shadow-[0_4px_15px_rgba(239,68,68,0.1)]' : 'bg-slate-900/40 border-white/5'}`}>
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
                  <div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3 leading-tight transition-all">
                       <Monitor size={20} className="text-sky-500" /> {getHeaderTitle()}
                    </h1>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1 ml-9 transition-colors">Barangay Monitoring Network — Real-time Feed</p>
                  </div>
                 </div>
              </div>

              <div className="flex items-center gap-4">
                <AvailabilityToggle />
                <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-3 rounded-xl border transition-all ${soundEnabled ? 'bg-sky-500/10 border-sky-500/30 text-sky-500 shadow-sm' : 'bg-card border-card-border text-sidebar-text-muted shadow-sm'}`}>
                  {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
                <button onClick={loadData} className="px-6 py-3 bg-slate-900/40 hover:bg-slate-900/60 border border-white/5 rounded-xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all shadow-2xl">
                  <Activity size={16} className="text-sky-500" /> Sync Network
                </button>
              </div>
            </header>

            <div className="flex-1 p-4 md:p-8 relative z-10 overflow-y-auto">
              <AnimatePresence mode="wait">
                <PageTransition key={location.pathname}>
                   <Outlet context={contextValue} />
                </PageTransition>
              </AnimatePresence>
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
      <ConsultationModal 
        isOpen={showCall}
        onClose={() => setShowCall(false)}
        practitionerName={user?.user_metadata?.full_name || 'Practitioner'}
        patientName={selectedPatientForCall || 'Patient'}
        onEndCall={() => setShowCall(false)}
      />
    </div>
  )
}

export default function PractitionerDashboard() {

  return (
    <Routes>
      <Route element={
        <ErrorBoundary>
          <PractitionerLayout />
        </ErrorBoundary>
      }>
        <Route index element={
          <PractitionerOverviewWrapper />
        } />
        <Route path="feed" element={<PatientFeedWrapper />} />
        <Route path="alerts" element={<AlertCenterWrapper />} />
        <Route path="contact" element={<ContactConsoleWrapper />} />
        <Route path="onboarding" element={<PractitionerCredentialsForm />} />
        <Route path="history" element={<HistoryLogsWrapper />} />
        <Route path="patient/:id" element={<PatientDossierWrapper />} />
        <Route path="referral" element={<PatientReferralFormWrapper />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/dashboard/practitioner" replace />} />
      </Route>
    </Routes>
  )
}

// Wrapper components to extract data from Outlet context

function PractitionerOverviewWrapper() {
  const ctx = useOutletContext<PractitionerDashboardContextType>()
  return (
    <PractitionerOverview 
      patientsCount={ctx.patients.length}
      alertCount={ctx.alertCount}
      totalAlerts={ctx.allLogs.length}
      criticalAlerts={ctx.criticalAlerts}
      initiateCall={ctx.initiateCall}
    />
  )
}

function PatientFeedWrapper() {
  const ctx = useOutletContext<PractitionerDashboardContextType>()
  return <PatientFeed patients={ctx.patients} loading={ctx.isLoading} />
}

function AlertCenterWrapper() {
  const ctx = useOutletContext<PractitionerDashboardContextType>()
  return (
    <AlertCenter 
      alerts={ctx.alerts} 
      alertCount={ctx.alertCount} 
      dismissAlert={ctx.dismissAlert}
      initiateCall={ctx.initiateCall}
    />
  )
}

function ContactConsoleWrapper() {
  const ctx = useOutletContext<PractitionerDashboardContextType>()
  return (
    <ContactConsole 
      onInitiateCall={() => { ctx.initiateCall('Field Caregiver', 'Active Subject') }} 
      onInitiateSMS={() => { window.location.href = `sms:+639000000000` }}
    />
  )
}

function HistoryLogsWrapper() {
  return <HistoryLogs />
}

function PatientDossierWrapper() {
  const ctx = useOutletContext<PractitionerDashboardContextType>()
  return <PatientDossier initiateCall={ctx.initiateCall} />
}

function PatientReferralFormWrapper() {
  const navigate = useNavigate()
  return <PatientReferralForm onBack={() => navigate('/dashboard/practitioner')} />
}
