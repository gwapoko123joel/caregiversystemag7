import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from '../../../hooks/useAuth'
import ReportView from './ReportView' // Your UI component
import { UserSearch } from 'lucide-react'

export default function SubmitReport() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // 1. Get Patient from Navigation State (passed from History/Roster)
  const [patient] = useState<any>(location.state?.patient || null)

  // 2. Form State
  const [form, setForm] = useState({
    blood_pressure: '',
    heart_rate: '',
    temperature: '',
    oxygen_saturation: '',
    physical_status: 'stable' as 'stable' | 'warning' | 'critical',
    notes: ''
  })

  // 3. Status States
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const setField = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }))

  // Handle Image Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  // 4. THE SUBMIT LOGIC
  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!user || !patient) return

    setSubmitting(true)
    setError(null)

    try {
      let imageUrl = null

      // 1. Upload Image (If exists)
      if (imageFile) {
        const fileName = `${patient.patient_id}/${Date.now()}.jpg`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('patient-photos')
          .upload(fileName, imageFile)
        if (uploadError) throw uploadError
        imageUrl = uploadData.path
      }

      // 2. Insert the Monitoring Log
      const { data: logData, error: insertError } = await supabase
        .from('patient_monitoring_logs')
        .insert({
          patient_id: patient.patient_id,
          caregiver_id: user.id,
          physical_status: form.physical_status,
          notes: form.notes,
          image_url: imageUrl,
          vital_signs: {
            blood_pressure: form.blood_pressure,
            heart_rate: form.heart_rate,
            temperature: form.temperature,
            oxygen_saturation: form.oxygen_saturation
          }
        })
        .select()
        .single()

      if (insertError) throw insertError

      // 3. BROADCAST ALERT LOGIC
      const sys = parseInt(form.blood_pressure.split('/')[0])
      const o2 = parseInt(form.oxygen_saturation)

      // Determine if this is an emergency
      const isCritical = sys > 160 || o2 < 90 || form.physical_status === 'critical'
      const isWarning = sys > 140 || o2 < 95 || form.physical_status === 'warning'

      if (isCritical || isWarning) {
        console.log("Emergency status detected. Dispatching alert...");

        const { error: alertError } = await supabase
          .from('alerts')
          .insert({
            // FORCE TO NUMBER
            patient_id: Number(patient.patient_id), 
            log_id: Number(logData.log_id),
            severity: isCritical ? 'critical' : 'warning',
            description: `Emergency: BP ${form.blood_pressure} | O2 ${form.oxygen_saturation}%`,
            is_resolved: false
          })

        if (alertError) {
          alert("DATABASE REJECTED ALERT: " + alertError.message);
        }
      }

      setSubmitSuccess(true)
      // Redirect slightly slower so the user sees the success message
      setTimeout(() => navigate('/dashboard/caregiver/history'), 2500)

    } catch (err: any) {
      console.error("Critical System Error:", err)
      setError(err.message || "Connection failed. Please check network.")
    } finally {
      setSubmitting(false)
    }
  }

  // 5. If no patient is selected, show a "Select Patient" state
  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card border border-card-border rounded-[32px] text-center max-w-2xl mx-auto mt-10">
        <div className="w-20 h-20 bg-sky-500/10 rounded-full flex items-center justify-center mb-6">
          <UserSearch size={40} className="text-sky-500" />
        </div>
        <h2 className="text-xl font-black text-text-main uppercase tracking-widest mb-2">No Patient Selected</h2>
        <p className="text-sidebar-text-muted mb-8 text-sm">
          To ensure medical accuracy, please select a patient from your roster before submitting a report.
        </p>
        <button
          onClick={() => navigate('/dashboard/caregiver/history')}
          className="px-8 py-4 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
        >
          Go to Patient Roster
        </button>
      </div>
    )
  }

  return (
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
  )
}
