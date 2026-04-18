import { useRef, type ChangeEvent } from 'react'
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  Heart, 
  TrendingUp, 
  Zap, 
  Camera, 
  X, 
  Send, 
  Plus 
} from 'lucide-react'
import type { Patient } from '../../../lib/supabaseClient'

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

interface ReportViewProps {
  patient: Patient | null
  form: ReportForm
  setField: <K extends keyof ReportForm>(key: K, val: ReportForm[K]) => void
  handleSubmit: () => Promise<void>
  submitting: boolean
  submitSuccess: boolean
  error: string | null
  imagePreview: string | null
  handleImageChange: (e: ChangeEvent<HTMLInputElement>) => void
  removeImage: () => void
}

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
  removeImage
}: ReportViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-700 slide-in-from-bottom-4">
      <div className="bg-card border border-card-border rounded-[32px] md:rounded-[40px] p-6 lg:p-12 relative overflow-hidden shadow-sm dark:shadow-none transition-colors">
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 md:mb-10 transition-colors">
          <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
             <FileText size={20} className="text-sky-500" />
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-lg md:text-xl font-black text-text-main uppercase tracking-tight leading-none transition-colors">Clinical Status Report</h3>
            <p className="text-[10px] font-bold text-sidebar-text-muted uppercase tracking-widest mt-1 transition-colors">Submit patient telemetry</p>
          </div>
        </div>

        {submitSuccess && (
          <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-500 animate-in zoom-in-95">
            <CheckCircle2 size={18} />
            <span className="text-xs font-black uppercase tracking-widest leading-none">Protocol transmission successful</span>
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 node-urgent border-none shadow-[var(--shadow-harmonized)] rounded-2xl flex items-center gap-3">
            <AlertCircle size={18} className="text-current" />
            <span className="text-xs font-black uppercase tracking-widest leading-none text-current">{error}</span>
          </div>
        )}

        <div className="space-y-8 mt-4">
          {/* Status Dropdown */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest ml-1 italic transition-colors">Current Condition State</label>
            <div className="relative group">
               <div className={`absolute inset-0 rounded-2xl blur-xl opacity-20 transition-all ${form.physical_status === 'stable' ? 'bg-emerald-500' : form.physical_status === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`} />
               <select 
                value={form.physical_status} 
                onChange={e => setField('physical_status', e.target.value as ReportForm['physical_status'])}
                className={`w-full relative z-10 bg-card border rounded-2xl py-4 md:py-5 px-5 md:px-6 text-[11px] md:text-sm font-black uppercase tracking-[0.1em] md:tracking-[0.15em] focus:outline-none transition-all appearance-none cursor-pointer ${
                  form.physical_status === 'stable' ? 'border-emerald-500/50 text-emerald-500' : 
                  form.physical_status === 'warning' ? 'border-amber-500/50 text-amber-500' : 'border-red-500 text-red-500 animate-pulse'
                }`}
              >
                <option value="stable" className="bg-card text-text-main">Stable Monitoring</option>
                <option value="warning" className="bg-card text-text-main">Warning State</option>
                <option value="critical" className="bg-card text-red-500">CLINICAL EMERGENCY</option>
              </select>
            </div>
          </div>

          {/* Vitals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {[
              { label: 'Blood Pressure', val: form.blood_pressure, key: 'blood_pressure', icon: Activity, placeholder: '120/80', color: 'text-sky-400' },
              { label: 'Heart Rate (BPM)', val: form.heart_rate, key: 'heart_rate', icon: Heart, placeholder: '72', color: 'text-sky-500' },
              { label: 'Temp (°C)', val: form.temperature, key: 'temperature', icon: TrendingUp, placeholder: '36.5', color: 'text-amber-400' },
              { label: 'O2 Saturation (%)', val: form.oxygen_saturation, key: 'oxygen_saturation', icon: Zap, placeholder: '98', color: 'text-sky-300' },
            ].map(v => (
              <div key={v.label} className="space-y-2 group">
                <label className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest ml-1 transition-colors">{v.label}</label>
                <div className="relative">
                  <v.icon size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:${v.color} transition-colors`} />
                  <input 
                    placeholder={v.placeholder}
                    value={v.val}
                    onChange={e => setField(v.key as keyof ReportForm, e.target.value)}
                    className="w-full bg-card border border-card-border rounded-xl md:rounded-2xl py-4 pl-12 pr-4 text-[13px] md:text-xs font-bold text-text-main focus:outline-none focus:border-sky-500/50 transition-all font-mono shadow-sm dark:shadow-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="space-y-2">
             <label className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest ml-1 transition-colors">Observation Metadata</label>
             <textarea 
              placeholder="Add clinical context or reported symptoms..."
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              className="w-full bg-card border border-card-border rounded-3xl p-6 text-xs font-medium text-text-main focus:outline-none focus:border-sky-500/50 min-h-[120px] transition-all shadow-sm dark:shadow-none"
            />
          </div>

          {/* Capture Section */}
          <div className="space-y-4">
             <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest italic transition-colors">Node Visual Feed</label>
                {!imagePreview && (
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="flex items-center gap-2 text-[10px] font-black text-sky-500 uppercase tracking-widest hover:underline transition-colors"
                   >
                      <Plus size={12} /> Sync Footage
                   </button>
                )}
             </div>
             
             <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
             
             {imagePreview ? (
                <div className="relative rounded-[32px] overflow-hidden border border-card-border aspect-video group shadow-2xl transition-colors">
                   <img src={imagePreview} alt="Node Footage" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                   <button 
                     onClick={removeImage}
                     className="absolute top-4 right-4 w-10 h-10 bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:text-red-500 hover:scale-110 transition-all border border-white/10 shadow-lg"
                   >
                      <X size={20} />
                   </button>
                   <div className="absolute bottom-6 left-8 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">LIVE_FEED_SYNCED</span>
                   </div>
                </div>
             ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-video rounded-[32px] border-2 border-dashed border-card-border hover:border-sky-500/20 bg-card flex flex-col items-center justify-center gap-4 cursor-pointer group transition-all duration-300 shadow-sm dark:shadow-none"
                >
                   <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center text-sidebar-text-muted group-hover:text-sky-500 group-hover:scale-110 group-hover:bg-sky-500/10 transition-all shadow-sm dark:shadow-none">
                      <Camera size={28} />
                   </div>
                   <div className="text-center">
                      <div className="text-xs font-black text-sidebar-text-muted uppercase tracking-widest group-hover:text-text-main transition-colors">Capture Patient Telemetry</div>
                      <div className="text-[10px] font-bold text-sidebar-text-muted/50 uppercase mt-1 tracking-tighter italic transition-colors">Tap to initialize node camera</div>
                   </div>
                </div>
             )}
          </div>

          <button 
            onClick={handleSubmit}
            disabled={submitting || !patient}
            className={`w-full py-5 rounded-[24px] font-black uppercase text-lg tracking-tight flex items-center justify-center gap-3 transition-all relative overflow-hidden group shadow-2xl ${
              form.physical_status === 'critical' 
                ? 'bg-red-600 text-white shadow-red-500/20 animate-pulse' 
                : 'bg-sky-500 text-white shadow-sky-500/20 active:scale-[0.98]'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            {submitting ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                Transmit Observation Packet
              </>
            )}
            <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:-translate-x-full transition-transform duration-700" />
          </button>
        </div>
      </div>
    </div>
  )
}
