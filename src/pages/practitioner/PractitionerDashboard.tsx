import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Activity, VolumeX, Volume2, Monitor
} from 'lucide-react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import VideoCallModal from '../../components/VideoCallModal'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'

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

export default function PractitionerDashboard() {
  useAuth()
  const location = useLocation()
  const [patients, setPatients] = useState<Patient[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [alertCount, setAlertCount] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showCall, setShowCall] = useState(false)
  
  const [selectedCaregiver, setSelectedCaregiver] = useState<string | undefined>()
  const [selectedPatientForCall, setSelectedPatientForCall] = useState<string | undefined>()
  
  const [loading, setLoading] = useState(true)
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
    setLoading(true)
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
    setLoading(false)
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
      {showCall && (
        <VideoCallModal
          caregiverName={selectedCaregiver}
          patientName={selectedPatientForCall}
          onClose={() => setShowCall(false)}
        />
      )}
      
      <div className="flex min-h-screen bg-brand-dark font-sans text-white overflow-x-hidden selection:bg-brand-neon-green selection:text-brand-dark">
        <Sidebar alertCount={alertCount} />

        <main className={`flex-1 flex flex-col relative overflow-hidden transition-all duration-700 ${alertCount > 0 ? 'ring-4 ring-red-600/50 shadow-[inset_0_0_100px_rgba(220,38,38,0.2)]' : ''}`}>
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-purple/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          
          <header className={`relative z-50 px-8 py-6 flex items-center justify-between border-b bg-brand-dark/50 backdrop-blur-md sticky top-0 transition-colors duration-500 ${alertCount > 0 ? 'border-red-500/30' : 'border-white/5'}`}>
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase italic flex items-center gap-3">
                 <Monitor size={24} className="text-brand-neon-green" /> {getHeaderTitle()}
              </h1>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mt-1 ml-9">Barangay Monitoring Network — Real-time Feed</p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-3 rounded-xl border transition-all ${soundEnabled ? 'bg-brand-neon-green/10 border-brand-neon-green/30 text-brand-neon-green' : 'bg-white/5 border-white/5 text-gray-600'}`}>
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <button onClick={loadData} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center gap-2 text-xs font-black uppercase transition-all">
                <Activity size={16} className="text-brand-neon-green" /> Sync Network
              </button>
            </div>
          </header>

          <div className="flex-1 p-8 relative z-10 overflow-y-auto">
            <Routes>
              <Route path="/" element={
                <PractitionerOverview 
                  patientsCount={patients.length}
                  alertCount={alertCount}
                  totalAlerts={alerts.length}
                  criticalAlerts={criticalAlerts}
                  initiateCall={initiateCall}
                />
              } />
              <Route path="/feed" element={<PatientFeed patients={patients} loading={loading} />} />
              <Route path="/alerts" element={
                <AlertCenter 
                  alerts={alerts} 
                  alertCount={alertCount} 
                  dismissAlert={dismissAlert}
                  initiateCall={initiateCall}
                />
              } />
              <Route path="/video" element={<VideoConsole initiateCall={initiateCall} />} />
              <Route path="/history" element={<HistoryLogs logs={allLogs} />} />
              <Route path="/patient/:id" element={
                (() => {
                  const patientId = location.pathname.split('/').pop()
                  const patient = patients.find(p => p.patient_id.toString() === patientId)
                  return patient ? (
                    <PatientDossier 
                      patient={patient} 
                      initiateCall={initiateCall} 
                    />
                  ) : <div className="text-center py-20 text-gray-500">Patient not found in network.</div>
                })()
              } />
            </Routes>
          </div>
        </main>
      </div>
    </>
  )
}
