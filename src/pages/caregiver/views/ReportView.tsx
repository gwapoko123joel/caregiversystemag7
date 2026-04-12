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
      <div className="bg-white/5 border border-white/5 rounded-[40px] p-8 lg:p-12 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-brand-neon-green/10 rounded-xl flex items-center justify-center">
             <FileText size={20} className="text-brand-neon-green" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none">Clinical Status Report</h3>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Submit high-fidelity patient telemetry</p>
          </div>
        </div>

        {submitSuccess && (
          <div className="mb-8 p-4 bg-brand-neon-green/10 border border-brand-neon-green/20 rounded-2xl flex items-center gap-3 text-brand-neon-green animate-in zoom-in-95">
            <CheckCircle2 size={18} />
            <span className="text-xs font-black uppercase tracking-widest leading-none">Protocol transmission successful</span>
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500">
            <AlertCircle size={18} />
            <span className="text-xs font-black uppercase tracking-widest leading-none">{error}</span>
          </div>
        )}

        <div className="space-y-8 mt-4">
          {/* Status Dropdown */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 italic">Current Condition State</label>
            <div className="relative group">
               <div className={`absolute inset-0 rounded-2xl blur-xl opacity-20 transition-all ${form.physical_status === 'stable' ? 'bg-brand-neon-green' : form.physical_status === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`} />
               <select 
                value={form.physical_status} 
                onChange={e => setField('physical_status', e.target.value as ReportForm['physical_status'])}
                className={`w-full relative z-10 bg-brand-dark/50 border rounded-2xl py-5 px-6 text-sm font-black uppercase tracking-[0.15em] focus:outline-none transition-all appearance-none cursor-pointer ${
                  form.physical_status === 'stable' ? 'border-brand-neon-green/50 text-brand-neon-green' : 
                  form.physical_status === 'warning' ? 'border-amber-500/50 text-amber-500' : 'border-red-500/50 text-red-500 animate-pulse'
                }`}
              >
                <option value="stable" className="bg-brand-dark text-white">Phase: Stable Monitoring</option>
                <option value="warning" className="bg-brand-dark text-white">Phase: Warning / Pre-Clinical</option>
                <option value="critical" className="bg-brand-dark text-white">Phase: CLINICAL EMERGENCY</option>
              </select>
            </div>
          </div>

          {/* Vitals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: 'Blood Pressure', val: form.blood_pressure, key: 'blood_pressure', icon: Activity, placeholder: '120/80', color: 'text-brand-accent-green' },
              { label: 'Heart Rate (BPM)', val: form.heart_rate, key: 'heart_rate', icon: Heart, placeholder: '72', color: 'text-brand-neon-green' },
              { label: 'Temp (°C)', val: form.temperature, key: 'temperature', icon: TrendingUp, placeholder: '36.5', color: 'text-amber-400' },
              { label: 'O2 Saturation (%)', val: form.oxygen_saturation, key: 'oxygen_saturation', icon: Zap, placeholder: '98', color: 'text-brand-accent-green' },
            ].map(v => (
              <div key={v.label} className="space-y-2 group">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">{v.label}</label>
                <div className="relative">
                  <v.icon size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:${v.color} transition-colors`} />
                  <input 
                    placeholder={v.placeholder}
                    value={v.val}
                    onChange={e => setField(v.key as keyof ReportForm, e.target.value)}
                    className="w-full bg-brand-dark/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white focus:outline-none focus:border-white/20 transition-all font-mono"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="space-y-2">
             <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Observation Metadata</label>
             <textarea 
              placeholder="Add clinical context or reported symptoms..."
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              className="w-full bg-brand-dark/50 border border-white/10 rounded-3xl p-6 text-xs font-medium text-white focus:outline-none focus:border-white/20 min-h-[120px] transition-all"
            />
          </div>

          {/* Capture Section */}
          <div className="space-y-4">
             <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Node Visual Feed</label>
                {!imagePreview && (
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="flex items-center gap-2 text-[10px] font-black text-brand-neon-green uppercase tracking-widest hover:underline"
                   >
                      <Plus size={12} /> Sync Footage
                   </button>
                )}
             </div>
             
             <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
             
             {imagePreview ? (
               <div className="relative rounded-[32px] overflow-hidden border border-white/10 aspect-video group shadow-2xl">
                  <img src={imagePreview} alt="Node Footage" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 to-transparent pointer-events-none" />
                  <button 
                    onClick={removeImage}
                    className="absolute top-4 right-4 w-10 h-10 bg-brand-dark/80 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:text-red-500 hover:scale-110 transition-all border border-white/10"
                  >
                     <X size={20} />
                  </button>
                  <div className="absolute bottom-6 left-8 flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-brand-neon-green animate-pulse" />
                     <span className="text-[10px] font-black text-white uppercase tracking-widest">LIVE_FEED_SYNCED</span>
                  </div>
               </div>
             ) : (
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className="w-full aspect-video rounded-[32px] border-2 border-dashed border-white/5 hover:border-brand-neon-green/20 bg-white/[0.02] flex flex-col items-center justify-center gap-4 cursor-pointer group transition-all"
               >
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-600 group-hover:text-brand-neon-green group-hover:scale-110 group-hover:bg-brand-neon-green/10 transition-all">
                     <Camera size={28} />
                  </div>
                  <div className="text-center">
                     <div className="text-xs font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-300 transition-colors">Capture Patient Telemetry</div>
                     <div className="text-[10px] font-bold text-gray-700 uppercase mt-1 tracking-tighter italic">Tap to initialize node camera</div>
                  </div>
               </div>
             )}
          </div>

          <button 
            onClick={handleSubmit}
            disabled={submitting || !patient}
            className={`w-full py-5 rounded-[24px] font-black uppercase text-lg tracking-tight flex items-center justify-center gap-3 transition-all relative overflow-hidden group shadow-2xl ${
              form.physical_status === 'critical' 
                ? 'bg-red-600 text-white shadow-red-900/20 active:bg-red-700' 
                : 'bg-brand-neon-green text-brand-dark shadow-brand-neon-green/20 active:scale-[0.98]'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            {submitting ? (
              <div className="w-6 h-6 border-4 border-brand-dark/30 border-t-brand-dark rounded-full animate-spin" />
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
