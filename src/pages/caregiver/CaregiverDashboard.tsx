import { useState, useEffect, useCallback } from 'react'
import {
  Activity, Phone
} from 'lucide-react'
import { Routes, Route, useLocation, useNavigate, Navigate, Outlet } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import BottomNav from '../../components/BottomNav'
import MobileHeader from '../../components/MobileHeader'
import LogoutModal from '../../components/LogoutModal'
import VideoCallModal from '../../components/VideoCallModal'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { AnimatePresence } from 'framer-motion'
import PageTransition from '../../components/PageTransition'

// Import Sub-Views
import DashboardHome from './views/DashboardHome'
import ReportView from './views/ReportView'
import HistoryView from './views/HistoryView'
import ProfilePage from '../ProfilePage'

import type { Patient, PatientMonitoringLog } from '../../lib/supabaseClient'

export interface CaregiverDashboardContextType {
  patient: Patient | null
  isLoading: boolean
  recentLogs: PatientMonitoringLog[]
  loadData: () => Promise<void>
  form: any
  setField: (field: string, value: any) => void
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  submitting: boolean
  submitSuccess: boolean
  error: string | null
  imagePreview: string | null
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeImage: () => void
}

function CaregiverLayout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [recentLogs, setRecentLogs] = useState<PatientMonitoringLog[]>([])
  const [loadingPatient, setLoadingPatient] = useState(true)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showCall, setShowCall] = useState(false)

  // Form State
  const [form, setForm] = useState({
    physical_status: 'stable',
    blood_pressure: '',
    heart_rate: '',
    oxygen_saturation: '',
    notes: '',
    image_url: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!user) return
    setLoadingPatient(true)
    
    // Get the patient assigned to this caregiver
    const { data: assignment } = await supabase
      .from('patients')
      .select('*, patient_monitoring_logs(*)')
      .eq('caregiver_id', user.id)
      .single()

    if (assignment) {
      setPatient(assignment)
      const sortedLogs = [...assignment.patient_monitoring_logs].sort((a,b) => 
        new Date(b.recorded_at!).getTime() - new Date(a.recorded_at!).getTime()
      )
      setRecentLogs(sortedLogs)
    }
    setLoadingPatient(false)
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  const setField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setField('image_url', '')
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!patient || !user) return
    
    setSubmitting(true)
    setError(null)
    setSubmitSuccess(false)

    try {
      let uploadedUrl = ''
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('patient-logs')
          .upload(fileName, imageFile)

        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('patient-logs').getPublicUrl(uploadData.path)
        uploadedUrl = publicUrl
      }

      const { error: insertError } = await supabase
        .from('patient_monitoring_logs')
        .insert({
          patient_id: patient.patient_id,
          caregiver_id: user.id,
          physical_status: form.physical_status,
          vital_signs: {
            blood_pressure: form.blood_pressure,
            heart_rate: parseInt(form.heart_rate),
            oxygen_saturation: parseInt(form.oxygen_saturation)
          },
          notes: form.notes,
          image_url: uploadedUrl
        })

      if (insertError) throw insertError

      setSubmitSuccess(true)
      setForm({
        physical_status: 'stable',
        blood_pressure: '',
        heart_rate: '',
        oxygen_saturation: '',
        notes: '',
        image_url: ''
      })
      removeImage()
      loadData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmLogout = async () => {
    await signOut()
    navigate('/')
  }

  const contextValue: CaregiverDashboardContextType = {
    patient,
    isLoading: loadingPatient,
    recentLogs,
    loadData,
    form,
    setField,
    handleSubmit,
    submitting,
    submitSuccess,
    error,
    imagePreview,
    handleImageChange,
    removeImage
  }

  const getHeaderTitle = () => {
    if (location.pathname.includes('/report')) return 'New Telemetry Report'
    if (location.pathname.includes('/history')) return 'Clinical History Archive'
    if (location.pathname.includes('/call')) return 'Direct Emergency Link'
    if (location.pathname.includes('/profile')) return 'Operator Profile'
    return 'Caregiver Portal'
  }

  return (
    <>
      <LogoutModal 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />

      <div className="flex flex-col md:flex-row min-h-screen bg-primary font-sans text-text-main transition-colors duration-300 selection:bg-sky-500 selection:text-white pb-20 md:pb-0">
        <Sidebar onLogoutClick={() => setShowLogoutModal(true)} />

        <div className="flex-1 flex flex-col min-h-screen">
          <MobileHeader onLogoutClick={() => setShowLogoutModal(true)} />
          
          <main className="flex-1 flex flex-col relative overflow-hidden transition-all duration-700">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none opacity-50 dark:opacity-100 transition-opacity" />
            
            {/* Desktop Header */}
            <header className="hidden md:flex relative z-50 px-8 py-6 items-center justify-between border-b border-card-border bg-primary/80 backdrop-blur-md sticky top-0 transition-all duration-500">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-500/10 rounded-2xl border border-sky-500/20">
                   <Activity size={20} className="text-sky-500" />
                </div>
                <div>
                   <h1 className="text-2xl font-black tracking-tight uppercase italic text-text-main transition-colors leading-tight">
                      {getHeaderTitle()}
                   </h1>
                   <div className="flex items-center gap-2 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-[0.2em] transition-colors leading-none">Node Connected — Encrypted Feed</p>
                   </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowCall(true)}
                  className="px-6 py-3 node-urgent font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-harmonized flex items-center gap-2 hover:scale-105 active:scale-95 border-none"
                >
                  <Phone size={14} className="fill-current text-current" /> Emergency Link
                </button>
              </div>
            </header>

            {/* Sub-view Content Area */}
            <div className="flex-1 p-4 md:p-8 relative z-10 overflow-y-auto overflow-x-hidden transition-colors">
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

      {showCall && (
        <VideoCallModal
          caregiverName={user?.user_metadata?.first_name}
          patientName={`${patient?.first_name} ${patient?.last_name}`}
          onClose={() => setShowCall(false)}
        />
      )}
    </>
  )
}

export default function CaregiverDashboard() {
  return (
    <Routes>
      <Route element={<CaregiverLayout />}>
        <Route index element={<DashboardHomeWrapper />} />
        <Route path="report" element={<ReportViewWrapper />} />
        <Route path="history" element={<HistoryViewWrapper />} />
        <Route path="call" element={<EmergencyCallWrapper />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/dashboard/caregiver" replace />} />
      </Route>
    </Routes>
  )
}

// Wrapper components to extract data from Outlet context
import { useOutletContext } from 'react-router-dom'

function DashboardHomeWrapper() {
  const ctx = useOutletContext<CaregiverDashboardContextType>()
  return (
    <DashboardHome 
      patient={ctx.patient} 
      loadingPatient={ctx.isLoading} 
      recentLogs={ctx.recentLogs.slice(0, 5)} 
    />
  )
}

function ReportViewWrapper() {
  const ctx = useOutletContext<CaregiverDashboardContextType>()
  return (
    <ReportView 
      patient={ctx.patient}
      form={ctx.form}
      setField={ctx.setField}
      handleSubmit={ctx.handleSubmit}
      submitting={ctx.submitting}
      submitSuccess={ctx.submitSuccess}
      error={ctx.error}
      imagePreview={ctx.imagePreview}
      handleImageChange={ctx.handleImageChange}
      removeImage={ctx.removeImage}
    />
  )
}

function HistoryViewWrapper() {
  const ctx = useOutletContext<CaregiverDashboardContextType>()
  return <HistoryView logs={ctx.recentLogs} />
}

function EmergencyCallWrapper() {
  return (
    <div className="h-full flex items-center justify-center">
       <div className="text-center space-y-6">
          <div className="w-24 h-24 node-urgent rounded-full flex items-center justify-center mx-auto animate-pulse border-none">
             <Phone size={40} className="text-current" />
          </div>
          <h2 className="text-2xl font-black text-text-main uppercase italic transition-colors">Initializing Emergency Link...</h2>
          <button 
            onClick={() => { /* This is handled by a state in layout, but we can trigger it here */ window.location.reload(); }}
            className="px-12 py-5 node-urgent rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] shadow-harmonized border-none"
          >
             Launch Video Console
          </button>
       </div>
    </div>
  )
}
