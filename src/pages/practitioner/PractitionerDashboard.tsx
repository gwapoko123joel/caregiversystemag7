import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Activity, VolumeX, Volume2, Monitor, Heart, Phone
} from 'lucide-react'
import { Routes, Route, useLocation, useNavigate, Navigate, Outlet } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import BottomNav from '../../components/BottomNav'
import MobileHeader from '../../components/MobileHeader'
import LogoutModal from '../../components/LogoutModal'
import { useTheme } from '../../contexts/ThemeContext'
import VideoCallModal from '../../components/VideoCallModal'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { AnimatePresence } from 'framer-motion'
import PageTransition from '../../components/PageTransition'

// Import Sub-Views
import PractitionerOverview from './views/PractitionerOverview'
import PatientFeed from './views/PatientFeed'
import AlertCenter from './views/AlertCenter'
import HistoryLogs from './views/HistoryLogs'
import PatientDossier from './views/PatientDossier'
import VideoConsole from './views/VideoConsole'

export interface AlertItem {
  id: number
  patient_name: string
  status: string
  time: string
  vitals: string
  dismissed: boolean
}

export interface MonitoringLog {
  log_id: number
  recorded_at: string
  physical_status: string
  image_url: string | null
  vital_signs: {
    blood_pressure?: string
    heart_rate?: number
    oxygen_saturation?: number
  } | null
  notes: string | null
  caregiver_name?: string
  caregivers?: {
    first_name: string
    last_name: string
  }
}

export interface Patient {
  patient_id: number
  first_name: string
  last_name: string
  date_of_birth: string | null
  address: string | null
  patient_monitoring_logs: MonitoringLog[]
}

export interface PractitionerDashboardContextType {
  patients: Patient[]
  alerts: AlertItem[]
  alertCount: number
  isLoading: boolean
  criticalAlerts: AlertItem[]
  allLogs: any[]
  initiateCall: (caregiverName?: string, patientName?: string) => void
  loadData: () => Promise<void>
  dismissAlert: (id: number) => void
}

function PractitionerLayout() {
  const { signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [patients, setPatients] = useState<Patient[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [alertCount, setAlertCount] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showCall, setShowCall] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  
  const [selectedCaregiver, setSelectedCaregiver] = useState<string | undefined>()
  const [selectedPatientForCall, setSelectedPatientForCall] = useState<string | undefined>()
  
  const [isLoading, setIsLoading] = useState(true)
  const audioCtx = useRef<AudioContext | null>(null)

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
    const { data: pData, error } = await supabase
      .from('patients')
      .select(`
        *,
        patient_monitoring_logs (
          *,
          caregivers ( first_name, last_name )
        )
      `)

    if (!error && pData) {
      const processedPatients: Patient[] = (pData as unknown as Patient[]).map(p => {
         const sortedLogs = [...(p.patient_monitoring_logs || [])].sort((a,b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
         return { ...p, patient_monitoring_logs: sortedLogs }
      })
      setPatients(processedPatients);

      const allLogs = processedPatients.flatMap(p => 
         p.patient_monitoring_logs.map((l: MonitoringLog) => ({
            ...l,
            patient_name: `${p.first_name} ${p.last_name}`,
            caregiver_name: l.caregivers ? `${l.caregivers.first_name} ${l.caregivers.last_name}` : 'Unknown'
         }))
      );
      
      const newAlerts = allLogs
        .filter((r: any) => r.physical_status === 'critical' || r.physical_status === 'warning')
        .map((r: any) => ({
          id: r.log_id,
          patient_name: r.patient_name,
          status: r.physical_status,
          time: new Date(r.recorded_at).toLocaleString('en-PH', { timeStyle: 'short' }),
          vitals: [
            r.vital_signs?.blood_pressure && `BP ${r.vital_signs.blood_pressure}`,
            r.vital_signs?.heart_rate && `${r.vital_signs.heart_rate} BPM`,
            r.vital_signs?.oxygen_saturation && `SpO2 ${r.vital_signs.oxygen_saturation}%`,
          ].filter(Boolean).join(' · '),
          dismissed: false,
        }))
      
      const urgentCount = newAlerts.filter((a: AlertItem) => a.status === 'critical' && !a.dismissed).length
      if (urgentCount > alertCount) playAlert()
      
      setAlerts(newAlerts)
      setAlertCount(urgentCount)
    }
    setIsLoading(false)
  }, [alertCount, playAlert])

  useEffect(() => {
    loadData()
    const channel = supabase
      .channel('practitioner-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'patient_monitoring_logs' }, (payload) => {
        if ((payload.new as MonitoringLog).physical_status === 'critical') playAlert()
        loadData()
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadData, playAlert])

  const dismissAlert = (id: number) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, dismissed: true } : a))
    setAlertCount((c) => Math.max(0, c - 1))
  }

  const initiateCall = (caregiverName?: string, patientName?: string) => {
    setSelectedCaregiver(caregiverName)
    setSelectedPatientForCall(patientName)
    setShowCall(true)
  }

  const handleConfirmLogout = async () => {
    await signOut()
    navigate('/')
  }

  // Derive global data
  const criticalAlerts = useMemo(() => alerts.filter(a => a.status === 'critical' && !a.dismissed), [alerts])
  const allLogs = useMemo(() => {
    return patients.flatMap(p => 
      p.patient_monitoring_logs.map(l => ({
        ...l,
        patient_name: `${p.first_name} ${p.last_name}`,
        caregiver_name: l.caregivers ? `${l.caregivers.first_name} ${l.caregivers.last_name}` : 'Unknown'
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
    if (location.pathname.includes('/video')) return 'High-Bandwidth Consultation'
    if (location.pathname.includes('/history')) return 'Historical Node Archive'
    if (location.pathname.includes('/patient/')) return 'Clinical Subject Dossier'
    return 'Regional Operations Center'
  }

  return (
    <>
      <LogoutModal 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />

      {showCall && (
        <VideoCallModal
          caregiverName={selectedCaregiver}
          patientName={selectedPatientForCall}
          onClose={() => setShowCall(false)}
        />
      )}
      
      <div className="flex flex-col md:flex-row min-h-screen bg-primary font-sans text-text-main transition-colors duration-300 selection:bg-sky-500 selection:text-white pb-20 md:pb-0">
        <Sidebar alertCount={alertCount} onLogoutClick={() => setShowLogoutModal(true)} />

        <div className="flex-1 flex flex-col min-h-screen">
          <MobileHeader onLogoutClick={() => setShowLogoutModal(true)} />
          
          <main className={`flex-1 flex flex-col relative overflow-hidden transition-all duration-700 ${alertCount > 0 ? 'ring-4 ring-sky-500/50 shadow-[inset_0_0_100px_rgba(0,186,255,0.2)] animate-pulse-slow' : ''}`}>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none opacity-50 dark:opacity-100 transition-opacity" />
            
            {/* Desktop Header */}
            <header className={`hidden md:flex relative z-50 px-8 py-6 items-center justify-between border-b bg-primary/80 backdrop-blur-md sticky top-0 transition-all duration-500 ${alertCount > 0 ? 'border-sky-500/40 shadow-[0_4px_15px_rgba(0,186,255,0.1)]' : 'border-card-border'}`}>
              <div className="flex items-center gap-4">
                 <div>
                   <h1 className="text-2xl font-black tracking-tight uppercase italic flex items-center gap-3 text-text-main transition-colors leading-tight">
                      <Monitor size={20} className="text-sky-500" /> {getHeaderTitle()}
                   </h1>
                   <p className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-[0.2em] mt-1 ml-9 transition-colors">Barangay Monitoring Network — Real-time Feed</p>
                 </div>
              </div>

              <div className="flex items-center gap-4">
                <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-3 rounded-xl border transition-all ${soundEnabled ? 'bg-sky-500/10 border-sky-500/30 text-sky-500 shadow-sm' : 'bg-card border-card-border text-sidebar-text-muted shadow-sm'}`}>
                  {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
                <button onClick={loadData} className="px-6 py-3 bg-card hover:bg-slate-50 dark:hover:bg-white/5 border border-card-border rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">
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
    </>
  )
}

export default function PractitionerDashboard() {
  const { patients, loading } = usePractitionerData(); // Placeholder logic to show structure

  return (
    <Routes>
      <Route element={<PractitionerLayout />}>
        <Route index element={
          <PractitionerOverviewWrapper />
        } />
        <Route path="feed" element={<PatientFeedWrapper />} />
        <Route path="alerts" element={<AlertCenterWrapper />} />
        <Route path="video" element={<VideoConsoleWrapper />} />
        <Route path="history" element={<HistoryLogsWrapper />} />
        <Route path="patient/:id" element={<PatientDossierWrapper />} />
        <Route path="*" element={<Navigate to="/dashboard/practitioner" replace />} />
      </Route>
    </Routes>
  )
}

// Wrapper components to extract data from Outlet context
import { useOutletContext } from 'react-router-dom'

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

function VideoConsoleWrapper() {
  const ctx = useOutletContext<PractitionerDashboardContextType>()
  return <VideoConsole initiateCall={ctx.initiateCall} />
}

function HistoryLogsWrapper() {
  const ctx = useOutletContext<PractitionerDashboardContextType>()
  return <HistoryLogs logs={ctx.allLogs} />
}

function PatientDossierWrapper() {
  const ctx = useOutletContext<PractitionerDashboardContextType>()
  const location = useLocation()
  const patientId = location.pathname.split('/').pop()
  const patient = ctx.patients.find(p => p.patient_id.toString() === patientId)
  
  if (!patient) return <div className="text-center py-20 text-sidebar-text-muted font-black uppercase tracking-widest text-xs">Patient not found in network.</div>
  
  return <PatientDossier patient={patient} initiateCall={ctx.initiateCall} />
}

// Minimal hook to satisfy PractitionerDashboard structure before layout mount
function usePractitionerData() {
  return { patients: [], loading: false }
}
