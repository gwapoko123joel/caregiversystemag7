import { useRef, type ChangeEvent } from 'react'
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  Heart, 
  Thermometer, 
  Zap, 
  Camera, 
  X, 
  Send, 
  Plus,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react'
import type { Patient } from '../../../types/database'

interface ReportForm {
  blood_pressure: string
  heart_rate: string
  temperature: string
  oxygen_saturation: string
  physical_status: 'stable' | 'warning' | 'critical'
  notes: string
}

interface ReportViewProps {
  patient: Patient | null
  form: ReportForm
  setField: <K extends keyof ReportForm>(key: K, val: ReportForm[K]) => void
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  submitting: boolean
  submitSuccess: boolean
  error: string | null
  imagePreview: string | null
  handleImageChange: (e: ChangeEvent<HTMLInputElement>) => void
  removeImage: () => void
  handleNoteChange: (text: string) => void
}

// Validation Helpers
const getBpStatus = (bp: string) => {
  const match = bp.match(/^(\d{2,3})\/(\d{2,3})$/);
  if (!match) return { valid: false, message: 'Format: 120/80' };
  const sys = parseInt(match[1]);
  const dia = parseInt(match[2]);
  if (sys < 90 || sys > 140 || dia < 60 || dia > 90) return { valid: false, message: 'Out of normal range' };
  return { valid: true, message: 'Normal range ✓' };
};

const getHrStatus = (hr: string) => {
  const val = parseInt(hr);
  if (isNaN(val)) return { valid: false, message: 'Enter BPM' };
  if (val < 60 || val > 100) return { valid: false, message: 'Out of normal range' };
  return { valid: true, message: 'Normal range ✓' };
};

const getTempStatus = (temp: string) => {
  const val = parseFloat(temp);
  if (isNaN(val)) return { valid: false, message: 'Enter °C' };
  if (val < 36.1 || val > 37.2) return { valid: false, message: 'Out of normal range' };
  return { valid: true, message: 'Normal range ✓' };
};

const getO2Status = (o2: string) => {
  const val = parseInt(o2);
  if (isNaN(val)) return { valid: false, message: 'Enter %' };
  if (val < 95 || val > 100) return { valid: false, message: 'Critical: Below 95%' };
  return { valid: true, message: 'Normal range ✓' };
};

export default function ReportView({
  patient,
  form,
  setField,
  handleSubmit,
  submitting,
  submitSuccess,
  error,
  imagePreview,
  handleImageChange,
  removeImage,
  handleNoteChange
}: ReportViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const bpStatus = getBpStatus(form.blood_pressure);
  const hrStatus = getHrStatus(form.heart_rate);
  const tempStatus = getTempStatus(form.temperature);
  const o2Status = getO2Status(form.oxygen_saturation);

  const isFormValid = form.blood_pressure && form.heart_rate && form.temperature && form.oxygen_saturation;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-700 slide-in-from-bottom-4">
      
      {/* Header Section */}
      <div className="flex items-center gap-4 px-2">
        <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20">
           <FileText size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-light text-text-main uppercase tracking-tight  leading-tight">Submit Report</h1>
          <p className="text-[10px] font-bold text-sidebar-text-muted uppercase tracking-[0.2em] mt-0.5 opacity-70">Record patient vitals and observations</p>
        </div>
      </div>

      {/* Success/Error Alerts */}
      {(submitSuccess || error) && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 transition-all ${
          submitSuccess ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'
        }`}>
          {submitSuccess ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-[11px] font-light uppercase tracking-widest">{submitSuccess ? 'Update sent successfully' : error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Patient Condition Selector */}
        <div className="bg-card border border-card-border rounded-[32px] p-6 md:p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 px-1">
             <Activity size={16} className="text-sky-500" />
             <label className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest">Patient Condition</label>
          </div>
          
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {[
              { id: 'stable', label: 'Stable', icon: CheckCircle2, color: 'emerald', sub: 'Good' },
              { id: 'warning', label: 'Needs Attention', icon: AlertTriangle, color: 'amber', sub: 'Warning' },
              { id: 'critical', label: 'Critical', icon: AlertCircle, color: 'red', sub: 'Emergency' },
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setField('physical_status', opt.id as any)}
                className={`flex flex-col items-center justify-center gap-2 p-4 md:p-6 rounded-3xl border-2 transition-all group ${
                  form.physical_status === opt.id 
                    ? `border-${opt.color}-500 bg-${opt.color}-500/10 text-${opt.color}-500 scale-[1.02] shadow-lg`
                    : 'border-card-border text-sidebar-text-muted hover:border-sidebar-text-muted/30'
                }`}
              >
                <opt.icon size={28} className={`transition-transform duration-300 ${form.physical_status === opt.id ? 'scale-110' : 'group-hover:scale-110 opacity-50'}`} />
                <div className="text-center">
                  <div className="text-[11px] md:text-[13px] font-light uppercase tracking-tight leading-tight">{opt.label}</div>
                  <div className="text-[8px] md:text-[9px] font-bold opacity-60 uppercase tracking-widest mt-0.5">{opt.sub}</div>
                </div>
                {form.physical_status === opt.id && (
                  <div className={`w-1.5 h-1.5 rounded-full bg-${opt.color}-500 mt-1 animate-pulse`} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Vital Signs Grid */}
        <div className="bg-card border border-card-border rounded-[32px] p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-2 px-1">
             <Heart size={16} className="text-red-500" />
             <label className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest">Vital Signs</label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: 'Blood Pressure', val: form.blood_pressure, key: 'blood_pressure', icon: Activity, placeholder: '120/80', unit: 'mmHg', status: bpStatus },
              { label: 'Heart Rate', val: form.heart_rate, key: 'heart_rate', icon: Heart, placeholder: '72', unit: 'BPM', status: hrStatus },
              { label: 'Temperature', val: form.temperature, key: 'temperature', icon: Thermometer, placeholder: '36.5', unit: '°C', status: tempStatus },
              { label: 'O₂ Saturation', val: form.oxygen_saturation, key: 'oxygen_saturation', icon: Zap, placeholder: '98', unit: '%', status: o2Status },
            ].map(v => (
              <div key={v.key} className="space-y-2 group">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest">{v.label}</label>
                  <span className="text-[9px] font-bold text-sidebar-text-muted opacity-50 uppercase">{v.unit}</span>
                </div>
                <div className="relative">
                  <v.icon size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${v.val ? 'text-sky-500' : 'text-sidebar-text-muted'}`} />
                  <input 
                    placeholder={v.placeholder}
                    value={v.val}
                    onChange={e => setField(v.key as keyof ReportForm, e.target.value)}
                    className="w-full bg-card border border-card-border rounded-2xl py-4 pl-12 pr-4 text-sm font-light text-text-main focus:outline-none focus:border-sky-500/50 transition-all font-mono"
                  />
                </div>
                {v.val && (
                  <div className={`flex items-center gap-1.5 px-2 text-[9px] font-light uppercase tracking-wider ${v.status.valid ? 'text-emerald-500' : 'text-red-500'}`}>
                    {v.status.valid ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                    {v.status.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-card border border-card-border rounded-[32px] p-6 md:p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 px-1">
             <FileText size={16} className="text-sky-500" />
             <label className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest">Notes & Observations</label>
          </div>
          <textarea 
            placeholder="Enter notes about patient's condition..."
            value={form.notes}
            onChange={e => handleNoteChange(e.target.value)}
            className="w-full bg-card border border-card-border rounded-2xl p-5 text-sm font-medium text-text-main focus:outline-none focus:border-sky-500/50 min-h-[120px] transition-all"
          />
        </div>

        {/* Photo Upload Section (Compact) */}
        <div className="bg-card border border-card-border rounded-[32px] p-6 md:p-8 space-y-4 shadow-sm">
          <div className="flex items-center justify-between px-1">
             <div className="flex items-center gap-2">
                <Camera size={16} className="text-sky-500" />
                <label className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest">Patient Photo</label>
             </div>
             <span className="text-[9px] font-bold text-sidebar-text-muted/50 uppercase tracking-[0.15em] ">[Optional]</span>
          </div>
          
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
          
          {imagePreview ? (
            <div className="relative h-40 rounded-2xl overflow-hidden border border-card-border group shadow-lg">
               <img src={imagePreview} alt="Patient Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
               <button 
                 type="button"
                 onClick={removeImage}
                 className="absolute top-3 right-3 w-8 h-8 bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:text-red-500 transition-all border border-white/10"
               >
                  <X size={16} />
               </button>
               <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                  <span className="text-[9px] font-light text-white uppercase tracking-widest">PHOTO_ATTACHED</span>
               </div>
            </div>
          ) : (
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-6 rounded-2xl border-2 border-dashed border-card-border hover:border-sky-500/30 hover:bg-sky-500/5 flex items-center justify-center gap-4 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-card border border-card-border flex items-center justify-center text-sidebar-text-muted group-hover:text-sky-500 group-hover:scale-110 transition-all">
                <Plus size={20} />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-light text-sidebar-text-muted uppercase tracking-widest group-hover:text-text-main transition-colors">Click to upload or take photo</div>
                <div className="text-[9px] font-bold text-sidebar-text-muted/40 uppercase tracking-tighter mt-0.5">JPEG, PNG up to 5MB</div>
              </div>
            </button>
          )}
        </div>

        {/* Submit Button */}
        <button 
          type="submit"
          disabled={submitting || !patient}
          className={`w-full py-6 rounded-[32px] font-light uppercase text-lg tracking-widest flex items-center justify-center gap-3 transition-all relative overflow-hidden group shadow-2xl ${
            form.physical_status === 'critical' 
              ? 'bg-red-600 text-white shadow-red-500/30' 
              : isFormValid 
                ? 'bg-sky-500 text-white shadow-sky-500/30 active:scale-[0.98]'
                : 'bg-sidebar-text-muted/20 text-sidebar-text-muted cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send size={20} className={`transition-transform duration-300 ${isFormValid ? 'group-hover:translate-x-1 group-hover:-translate-y-1' : ''}`} />
              Submit Report
              {isFormValid && (
                <div className="flex items-center gap-1.5 ml-4 px-3 py-1 bg-white/20 rounded-full text-[10px] font-light">
                   <CheckCircle2 size={12} />
                   READY
                </div>
              )}
            </>
          )}
          {isFormValid && (
            <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:-translate-x-full transition-transform duration-1000" />
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-[9px] font-light text-sidebar-text-muted uppercase tracking-widest opacity-40">
           <ShieldCheck size={10} />
           Secured End-to-End Encryption
        </div>

      </form>
    </div>
  )
}
