import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { 
  Routes, 
  Route, 
  useLocation, 
  Navigate 
} from 'react-router-dom'
import {
  Phone,
  Zap,
  ShieldAlert
} from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import VideoCallModal from '../../components/VideoCallModal'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import type { Patient, PatientMonitoringLog, VitalSigns } from '../../lib/supabaseClient'

// Import Sub-Views
import DashboardHome from './views/DashboardHome'
import ReportView from './views/ReportView'
import HistoryView from './views/HistoryView'

interface ReportForm {
  blood_pressure: string
  heart_rate: string
  temperature: string
  oxygen_saturation: string
  respiratory_rate: string
  weight: string
  blood_glucose: string
  pain_level: number
  physical_status: 'stable' | 'warning' | 'critical'
  notes: string
}

const EMPTY_FORM: ReportForm = {
  blood_pressure: '',
  heart_rate: '',
  temperature: '',
  oxygen_saturation: '',
  respiratory_rate: '',
  weight: '',
  blood_glucose: '',
  pain_level: 0,
  physical_status: 'stable',
  notes: '',
}

export default function CaregiverDashboard() {
  const { profile, user } = useAuth()
  const location = useLocation()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [recentLogs, setRecentLogs] = useState<PatientMonitoringLog[]>([])
  const [form, setForm] = useState<ReportForm>(EMPTY_FORM)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCall, setShowCall] = useState(false)
  const [loadingPatient, setLoadingPatient] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const now = new Date()

  // ── Fetch assigned patient ─────────────────────────
  useEffect(() => {
    if (!user?.id || profile?.status === 'pending') return
    
    async function loadAssignedPatient() {
      setLoadingPatient(true)
      const { data: assignment, error: assignErr } = await supabase
        .from('caregiver_patient_assignments')
        .select('patient_id')
        .eq('caregiver_id', user!.id)
        .maybeSingle()

      if (assignErr || !assignment) {
        setLoadingPatient(false)
        return
      }

      const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('patient_id', assignment.patient_id)
        .single()

      if (patientData) {
        setPatient(patientData as Patient)
      }
      setLoadingPatient(false)
    }

    loadAssignedPatient()
  }, [user, profile?.status])

  // ── Fetch recent logs ──────────────────────────────────────────────────
  useEffect(() => {
    if (!patient?.patient_id || profile?.status === 'pending') return
    
    async function loadLogs() {
      const { data } = await supabase
        .from('patient_monitoring_logs')
        .select('*')
        .eq('patient_id', patient?.patient_id)
        .order('recorded_at', { ascending: false })
      
      setRecentLogs((data ?? []) as PatientMonitoringLog[])
    }

    loadLogs()
  }, [patient?.patient_id, profile?.status])

  function setField<K extends keyof ReportForm>(key: K, val: ReportForm[K]) {
    setForm((p) => ({ ...p, [key]: val }))
  }

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit() {
    if (!patient || !user) {
      setError('No patient assigned to this session.')
      return
    }
    setSubmitting(true)
    setError(null)

    let finalImageUrl: string | null = null

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const fileName = `${patient.patient_id}/${Date.now()}.${ext}`
      const { data, error: uploadErr } = await supabase.storage
        .from('patient-photos')
        .upload(fileName, imageFile)
      
      if (!uploadErr && data) {
        const { data: urlData } = supabase.storage.from('patient-photos').getPublicUrl(fileName)
        finalImageUrl = urlData.publicUrl
      }
    }

    const vital_signs: VitalSigns = {
      blood_pressure: form.blood_pressure || undefined,
      heart_rate: form.heart_rate ? parseInt(form.heart_rate) : undefined,
      temperature: form.temperature ? parseFloat(form.temperature) : undefined,
      oxygen_saturation: form.oxygen_saturation ? parseInt(form.oxygen_saturation) : undefined,
      respiratory_rate: form.respiratory_rate ? parseInt(form.respiratory_rate) : undefined,
      weight: form.weight ? parseFloat(form.weight) : undefined,
      blood_glucose: form.blood_glucose ? parseFloat(form.blood_glucose) : undefined,
      pain_level: form.pain_level,
    }

    const { error: insertErr } = await supabase
      .from('patient_monitoring_logs')
      .insert({
        patient_id: patient.patient_id,
        caregiver_id: user.id,
        vital_signs,
        physical_status: form.physical_status,
        image_url: finalImageUrl,
        notes: form.notes,
        recorded_at: new Date().toISOString(),
      })

    if (insertErr) {
      setError(insertErr.message)
      setSubmitting(false)
      return
    }

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      user_type: profile?.role ?? 'caregiver',
      action: 'SUBMIT_REPORT',
      details: { patient_id: patient.patient_id, status: form.physical_status },
    })

    if (form.physical_status === 'critical') {
      await supabase.from('alerts').insert({
        patient_id: patient.patient_id,
        alert_type: 'emergency',
        message: `Emergency status reported for ${patient.first_name} ${patient.last_name}`,
        triggered_by: user.id,
      })
    }

    setSubmitting(false)
    setSubmitSuccess(true)
    setForm(EMPTY_FORM)
    setImageFile(null)
    setImagePreview(null)
    
    // Refresh history
    const { data } = await supabase
      .from('patient_monitoring_logs')
      .select('*')
      .eq('patient_id', patient.patient_id)
      .order('recorded_at', { ascending: false })
    setRecentLogs((data ?? []) as PatientMonitoringLog[])
    
    setTimeout(() => setSubmitSuccess(false), 3000)
  }

  // ── Get view title based on route ──────────────────────────────────
  const getViewTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard/caregiver') return 'On-the-Ground Portal';
    if (path.includes('/patient')) return 'Patient Dossier';
    if (path.includes('/report')) return 'Clinical Intel Center';
    if (path.includes('/history')) return 'Telemetry Archives';
    if (path.includes('/call')) return 'Emergency Link';
    return 'Caregiver Portal';
  }

  if (profile?.status === 'pending') {
    return (
      <div className="flex min-h-screen bg-brand-dark font-sans text-white overflow-hidden items-center justify-center p-6 relative">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-purple/20 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-purple/10 blur-[120px] rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none" />
        
        <div className="w-full max-w-md bg-[#1e1b4b]/50 backdrop-blur-3xl border border-white/5 rounded-[40px] p-12 text-center relative overflow-hidden group hover:border-yellow-500/30 transition-all">
          <div className="absolute -inset-10 bg-yellow-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-yellow-500/10 flex items-center justify-center mb-8 border-2 border-yellow-500/20 shadow-[0_0_40px_rgba(234,179,8,0.3)]">
              <ShieldAlert size={40} className="text-yellow-500" />
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-4 leading-none">Security Clearance Pending</h2>
            <p className="text-gray-400 font-bold text-sm leading-relaxed mb-10 tracking-widest max-w-[280px]">
              Access to real-time network operations requires administrative authorization.
            </p>
            <div className="w-full space-y-3">
               <button onClick={() => window.location.reload()} className="w-full py-4 text-xs font-black text-brand-dark uppercase tracking-widest rounded-2xl bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)] transition-all flex items-center justify-center gap-2">
                 <Zap size={16} /> Recheck Status
               </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {showCall && (
        <VideoCallModal
          patientName={`${patient?.first_name} ${patient?.last_name}`}
          caregiverName={`${profile?.first_name} ${profile?.last_name}`}
          onClose={() => setShowCall(false)}
        />
      )}

      <div className="flex min-h-screen bg-brand-dark font-sans text-white overflow-x-hidden selection:bg-brand-neon-green selection:text-brand-dark">
        <Sidebar />

        <main className="flex-1 flex flex-col relative overflow-hidden h-screen bg-brand-dark">
          {/* Background Gradients */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-purple/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          
          {/* Topbar */}
          <header className="relative z-20 px-8 py-6 flex items-center justify-between border-b border-white/5 bg-brand-dark/50 backdrop-blur-md sticky top-0 shrink-0">
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase italic">{getViewTitle()}</h1>
              <div className="flex items-center gap-2 mt-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-brand-neon-green animate-pulse" />
                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Live Deployment — {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toUpperCase()}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowCall(true)}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center gap-2 hover:scale-105 active:scale-95"
              >
                <Phone size={14} className="fill-white" /> Emergency Link
              </button>
            </div>
          </header>

          {/* Sub-view Content Area */}
          <div className="flex-1 p-8 relative z-10 overflow-y-auto overflow-x-hidden">
            <Routes>
              {/* Home / Overview */}
              <Route index element={
                <DashboardHome 
                  patient={patient} 
                  loadingPatient={loadingPatient} 
                  recentLogs={recentLogs.slice(0, 5)} 
                />
              } />

              {/* Patient Dossier (Detailed View, reuse home card for now) */}
              <Route path="patient" element={
                <DashboardHome 
                  patient={patient} 
                  loadingPatient={loadingPatient} 
                  recentLogs={[]} 
                />
              } />

              {/* Clinical Report Submission */}
              <Route path="report" element={
                <ReportView 
                  patient={patient}
                  form={form}
                  setField={setField}
                  handleSubmit={handleSubmit}
                  submitting={submitting}
                  submitSuccess={submitSuccess}
                  error={error}
                  imagePreview={imagePreview}
                  handleImageChange={handleImageChange}
                  removeImage={removeImage}
                />
              } />

              {/* Historical Telemetry Archive */}
              <Route path="history" element={
                <HistoryView logs={recentLogs} />
              } />

              {/* Emergency Call Redirect (Opens Modal) */}
              <Route path="call" element={
                <div className="h-full flex items-center justify-center">
                   <div className="text-center space-y-6">
                      <div className="w-24 h-24 bg-red-600/10 rounded-full flex items-center justify-center border border-red-600/20 mx-auto animate-pulse">
                         <Phone size={40} className="text-red-600" />
                      </div>
                      <h2 className="text-2xl font-black text-white uppercase italic">Initializing Emergency Link...</h2>
                      <button 
                        onClick={() => setShowCall(true)}
                        className="px-12 py-5 bg-red-600 rounded-3xl text-xs font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(220,38,38,0.5)]"
                      >
                         Launch Video Console
                      </button>
                   </div>
                </div>
              } />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/dashboard/caregiver" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </>
  )
}
