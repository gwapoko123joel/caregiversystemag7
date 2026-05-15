import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from '../../../hooks/useAuth'
import ReportView from './ReportView' 
import { UserSearch, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react'

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
  
  // --- LOCAL STORAGE DRAFT SAFETY ---
  useEffect(() => {
    if (!patient) return;
    const draft = localStorage.getItem(`draft_notes_${patient.patient_id}`);
    if (draft) setField('notes', draft);
  }, [patient?.patient_id]);

  const handleNoteChange = (text: string) => {
    setField('notes', text);
    if (patient) {
      localStorage.setItem(`draft_notes_${patient.patient_id}`, text);
    }
  };

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

      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        user_type: 'caregiver',
        action: 'VITALS_SUBMITTED',
        details: { 
          patient_name: `${patient.first_name} ${patient.last_name}`,
          status: form.physical_status 
        }
      });

      // 3. BROADCAST ALERT LOGIC
      const sys = parseInt(form.blood_pressure.split('/')[0])
      const o2 = parseInt(form.oxygen_saturation)

      const isCritical = sys > 160 || o2 < 90 || form.physical_status === 'critical'
      const isWarning = sys > 140 || o2 < 95 || form.physical_status === 'warning'

      if (isCritical || isWarning) {
        const { error: alertError } = await supabase
          .from('alerts')
          .insert({
            patient_id: Number(patient.patient_id), 
            log_id: Number(logData.log_id),
            severity: isCritical ? 'critical' : 'warning',
            description: `Emergency: BP ${form.blood_pressure} | O2 ${form.oxygen_saturation}%`,
            is_resolved: false
          })

        if (alertError) {
          alert("DATABASE REJECTED ALERT: " + alertError.message);
        }

        await supabase
          .from('patients')
          .update({ status: isCritical ? 'critical' : 'warning' })
          .eq('patient_id', patient.patient_id);
      } else {
        await supabase
          .from('patients')
          .update({ status: 'active' })
          .eq('patient_id', patient.patient_id);
      }

      setSubmitSuccess(true)
      if (patient) localStorage.removeItem(`draft_notes_${patient.patient_id}`);

    } catch (err: any) {
      console.error("Critical System Error:", err)
      setError(err.message || "Connection failed. Please check network.")
    } finally {
      setSubmitting(false)
    }
  }

  // Success Overlay logic
  if (submitSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-20 animate-in fade-in zoom-in duration-500">
        <div className="bg-slate-900/40 backdrop-blur-xl border border-emerald-500/30 rounded-[40px] p-12 text-center shadow-2xl relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute -top-10 -right-10 opacity-5 text-emerald-500">
             <ShieldCheck size={200} />
          </div>

          <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <CheckCircle2 size={48} className="text-emerald-500" />
          </div>

          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Telemetry Synchronized</h2>
          
          <div className="space-y-2 mb-10">
            <p className="text-emerald-400 font-bold uppercase text-[10px] tracking-[0.3em]">Status: Transmission Successful</p>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">
              Clinical data for <span className="text-white font-bold">{patient.first_name} {patient.last_name}</span> has been securely broadcasted to the practitioner network.
            </p>
          </div>

          <div className="bg-slate-950/50 rounded-3xl p-6 border border-white/5 mb-10 flex items-center justify-between">
             <div className="text-left">
                <p className="text-[8px] font-black text-slate-600 uppercase">Node Identifier</p>
                <p className="text-[10px] font-mono text-slate-400">BANTAYAN-NODE-SYNC-OK</p>
             </div>
             <div className="text-right">
                <p className="text-[8px] font-black text-slate-600 uppercase">Timestamp</p>
                <p className="text-[10px] font-mono text-slate-400">{new Date().toLocaleTimeString()}</p>
             </div>
          </div>

          <button
            onClick={() => navigate('/dashboard/caregiver/history')}
            className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-3 mx-auto"
          >
            Return to Registry <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
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
      handleNoteChange={handleNoteChange}
    />
  )
}
