import { useState, type FormEvent } from 'react'
import { 
  User, Calendar, Phone, MapPin, 
  FileText, Activity, AlertCircle, Loader2, 
  CheckCircle2, ArrowLeft, HeartPulse 
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from '../../../hooks/useAuth'

interface PatientOnboardingFormProps {
  onBack: () => void
}

export default function PatientOnboardingForm({ onBack }: PatientOnboardingFormProps) {
  const { user } = useAuth()
  
  // Form State
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('prefer_not_to_say')
  const [contact, setContact] = useState('')
  const[address, setAddress] = useState('')
  const [medicalHistory, setMedicalHistory] = useState('')

  const[submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)
    setError(null)

    try {
      // 1. Insert the new patient into the database
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          date_of_birth: dob || null,
          gender: gender,
          contact_number: contact.trim(),
          address: address.trim(),
          medical_history: medicalHistory.trim(),
          status: 'active',
          registration_status: 'active',
          registered_by: user.id
        })
        .select()
        .single()

      if (patientError) throw patientError

      // 2. IMMEDIATELY CREATE THE ASSIGNMENT
      if (newPatient) {
        const { error: assignmentError } = await supabase
          .from('caregiver_patient_assignments')
          .insert({
            caregiver_id: user.id,
            patient_id: newPatient.patient_id
          })

        if (assignmentError) throw assignmentError
      }

      // 3. Log the activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        user_type: 'caregiver',
        action: 'REGISTER_PATIENT',
        details: { patient_id: newPatient.patient_id, patient_name: `${firstName} ${lastName}` }
      })

      setSuccess(true)
    } catch (err: any) {
      console.error("Onboarding Error:", err)
      setError(err.message || 'Failed to register patient. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-card border border-card-border rounded-[32px] text-center animate-in fade-in zoom-in duration-500 shadow-xl max-w-2xl mx-auto mt-10">
        <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <CheckCircle2 size={48} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black text-text-main uppercase tracking-widest mb-2">Patient Registered</h2>
        <p className="text-sidebar-text-muted mb-8 max-w-md mx-auto text-sm">
          <strong className="text-sky-400">{firstName} {lastName}</strong> has been successfully added to the Barangay Health Registry and is now assigned to your active roster.
        </p>
        <button
          onClick={onBack}
          className="px-8 py-4 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-sky-500/20 active:scale-95"
        >
          <ArrowLeft size={16} /> Return to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-3 bg-card border border-card-border rounded-xl text-sidebar-text-muted hover:text-sky-500 transition-all active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-black tracking-tight uppercase text-text-main leading-tight">Patient Intake Form</h2>
          <p className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-[0.2em] mt-1">Field Registration & Profiling</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-[32px] p-6 md:p-8 shadow-sm space-y-8">
        
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <span className="text-sm text-red-400 font-medium">{error}</span>
          </div>
        )}

        {/* Section: Basic Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-card-border pb-2">
            <User size={16} className="text-sky-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-text-main">Personal Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest ml-1">First Name *</label>
              <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-primary/50 border border-card-border rounded-2xl py-3 px-4 text-text-main focus:outline-none focus:border-sky-500/50 transition-all text-sm font-medium" placeholder="Juan" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest ml-1">Last Name *</label>
              <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-primary/50 border border-card-border rounded-2xl py-3 px-4 text-text-main focus:outline-none focus:border-sky-500/50 transition-all text-sm font-medium" placeholder="Dela Cruz" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest ml-1">Date of Birth</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted" />
                <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full bg-primary/50 border border-card-border rounded-2xl py-3 pl-10 pr-4 text-text-main focus:outline-none focus:border-sky-500/50 transition-all text-sm font-medium [color-scheme:dark]" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest ml-1">Biological Sex</label>
              <select value={gender} onChange={e => setGender(e.target.value)} className="w-full bg-primary/50 border border-card-border rounded-2xl py-3 px-4 text-text-main focus:outline-none focus:border-sky-500/50 transition-all text-sm font-medium appearance-none">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section: Contact & Location */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-card-border pb-2">
            <MapPin size={16} className="text-emerald-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-text-main">Contact & Location</h3>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest ml-1">Contact Number</label>
            <div className="relative">
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted" />
              <input type="tel" value={contact} onChange={e => setContact(e.target.value)} className="w-full bg-primary/50 border border-card-border rounded-2xl py-3 pl-10 pr-4 text-text-main focus:outline-none focus:border-sky-500/50 transition-all text-sm font-medium" placeholder="+63 9XX XXX XXXX" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest ml-1">Complete Address (Purok/Sitio)</label>
            <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} className="w-full bg-primary/50 border border-card-border rounded-2xl py-3 px-4 text-text-main focus:outline-none focus:border-sky-500/50 transition-all text-sm font-medium resize-none" placeholder="Enter barangay address..." />
          </div>
        </div>

        {/* Section: Medical Context */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-card-border pb-2">
            <Activity size={16} className="text-rose-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-text-main">Clinical Profile</h3>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest ml-1">Known Medical History / Pre-existing Conditions</label>
            <textarea value={medicalHistory} onChange={e => setMedicalHistory(e.target.value)} rows={4} className="w-full bg-primary/50 border border-card-border rounded-2xl py-3 px-4 text-text-main focus:outline-none focus:border-sky-500/50 transition-all text-sm font-medium resize-none" placeholder="e.g. Hypertension, Diabetes Type 2, Asthma..." />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-card-border flex gap-3">
          <button type="button" onClick={onBack} className="flex-1 py-4 text-xs font-black text-sidebar-text-muted uppercase tracking-widest hover:text-text-main transition-all">
            Cancel
          </button>
          <button type="submit" disabled={submitting || !firstName || !lastName} className="flex-[2] py-4 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-sky-500/20 active:scale-95 flex items-center justify-center gap-2">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <><HeartPulse size={16} /> Register Patient</>}
          </button>
        </div>

      </form>
    </div>
  )
}
