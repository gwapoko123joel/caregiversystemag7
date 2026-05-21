import { useState, useEffect, useCallback } from 'react'
import { Activity, Phone, Menu } from 'lucide-react'
import { Routes, Route, useLocation, useNavigate, Navigate, Outlet } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import BottomNav from '../../components/BottomNav'
import MobileHeader from '../../components/MobileHeader'
import LogoutModal from '../../components/LogoutModal'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { useSidebar } from '../../contexts/SidebarContext'
import { AnimatePresence } from 'framer-motion'
import PageTransition from '../../components/PageTransition'

// Import Sub-Views
import DashboardHome from './views/DashboardHome'
import PatientHistory from './views/PatientHistory'
import ProfilePage from '../shared/ProfilePage'
import EmergencyView from './views/EmergencyView'
import AvailableDoctorsView from './views/AvailableDoctorsView'
import PatientOnboardingForm from './views/PatientOnboardingForm'
import SubmitReport from './views/SubmitReport'

import type { Patient, PatientMonitoringLog } from '../../types/database'

export interface CaregiverDashboardContextType {
  patient: Patient | null
  assignedPatients: Patient[]
  userProfile: any | null
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
  practitioners: any[]
}

function CaregiverLayout() {
  const { user, userProfile, signOut } = useAuth()
  const { isCollapsed, isDesktop, toggleCollapse } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [assignedPatients, setAssignedPatients] = useState<Patient[]>([])
  const [recentLogs, setRecentLogs] = useState<PatientMonitoringLog[]>([])
  const [loadingPatient, setLoadingPatient] = useState(true)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [practitioners, setPractitioners] = useState<any[]>([])

  // Form State
  const [form, setForm] = useState({
    physical_status: 'stable',
    blood_pressure: '',
    heart_rate: '',
    temperature: '',
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

    const { data: assignments } = await supabase
      .from('caregiver_patient_assignments')
      .select('patient_id')
      .eq('caregiver_id', user.id)

    if (assignments && assignments.length > 0) {
      const patientIds = assignments.map(a => a.patient_id)
      const { data: patientList } = await supabase
        .from('patients')
        .select('*, patient_monitoring_logs(*)')
        .in('patient_id', patientIds)

      if (patientList) {
        setAssignedPatients(patientList)
        // Keep 'patient' as the first one for backward compatibility or featured display
        setPatient(patientList[0])
        
        // Consolidate logs from all patients for the dashboard activity feed
        const allLogs = patientList.flatMap(p => p.patient_monitoring_logs || [])
        const sortedLogs = allLogs.sort((a, b) =>
          new Date(b.recorded_at!).getTime() - new Date(a.recorded_at!).getTime()
        )
        setRecentLogs(sortedLogs)
      }
    }
    setLoadingPatient(false)

    // Load medical practitioners from the directory view
    const { data: docs } = await supabase
      .from('available_practitioners_directory')
      .select('*')

    if (docs) {
      setPractitioners(docs.map((d: any) => ({
        id: d.id ?? d.user_id ?? d.caregiver_id,
        full_name: d.full_name,
        specialty: d.specialization || d.specializations || 'General Practice',
        phone: d.phone || d.contact_number || '',
        is_available: d.availability_status === 'available' || d.status === 'available'
      })))
    }
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
            temperature: parseFloat(form.temperature),
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
        temperature: '',
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
    assignedPatients,
    userProfile: userProfile,
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
    removeImage,
    practitioners
  }

  const getHeaderTitle = () => {
    if (location.pathname.includes('/report')) return 'New Patient Report'
    if (location.pathname.includes('/history')) return 'Past Records'
    if (location.pathname.includes('/call')) return 'Emergency Support'
    if (location.pathname.includes('/profile')) return 'My Profile'
    return 'Caregiver Home'
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
                {isCollapsed && isDesktop && (
                  <button
                    onClick={toggleCollapse}
                    className="p-3 bg-card border border-card-border rounded-xl text-sidebar-text-muted hover:text-sky-500 hover:border-sky-500 transition-all cursor-pointer"
                    title="Expand Sidebar"
                  >
                    <Menu size={20} />
                  </button>
                )}
                <div className="p-3 bg-sky-500/10 rounded-2xl border border-sky-500/20">
                  <Activity size={20} className="text-sky-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-light tracking-tight uppercase  text-text-main transition-colors leading-tight">
                    {getHeaderTitle()}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-[0.2em] transition-colors leading-none">System Connected — Secure Line</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/dashboard/caregiver/call')}
                  className="px-6 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(244,63,94,0.2)] flex items-center gap-2 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
                >
                  <Phone size={14} className="fill-current" /> Call Support
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
        <Route path="doctors" element={<AvailableDoctorsView />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="onboarding" element={<PatientOnboardingFormWrapper />} />
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
      assignedPatients={ctx.assignedPatients}
      userProfile={ctx.userProfile} 
      loadingPatient={ctx.isLoading} 
      recentLogs={ctx.recentLogs} 
    />
  )
}

function ReportViewWrapper() {
  return <SubmitReport />
}

// HistoryViewWrapper
function HistoryViewWrapper() {
  return <PatientHistory />
}

function EmergencyCallWrapper() {
  return <EmergencyView />
}

function PatientOnboardingFormWrapper() {
  const navigate = useNavigate()
  return <PatientOnboardingForm onBack={() => navigate('/dashboard/caregiver')} />
}