import { useRef } from 'react'
import { 
  FileText, CheckCircle2, AlertCircle, Activity, 
  Heart, Thermometer, Zap, X, Send, 
  Plus, AlertTriangle, UserSearch, ArrowLeft,
  Loader2, ShieldAlert
} from 'lucide-react'

interface ReportViewProps {
  patient: any;
  form: any;
  setField: (key: string, val: any) => void;
  handleSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  imagePreview: string | null;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: () => void;
  onBack: () => void;
}

export default function ReportView({
  patient, form, setField, handleSubmit, submitting, 
  imagePreview, handleImageChange, removeImage, onBack 
}: ReportViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── No Patient State (Safety Protocol) ──
  if (!patient) {
    return (
      <div className="max-w-2xl mx-auto py-20 animate-in fade-in zoom-in duration-500 px-4 md:px-0">
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[40px] p-12 text-center shadow-2xl">
          <div className="w-20 h-20 bg-sky-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-sky-500/20">
            <UserSearch size={40} className="text-sky-500" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-50 uppercase mb-2 tracking-tighter leading-tight">No Patient Selected</h2>
          <p className="text-sm text-slate-500 mb-10 max-w-xs mx-auto font-medium leading-relaxed">To ensure medical accuracy, you must select a subject from your roster before transmitting telemetry.</p>
          <button
            onClick={onBack}
            className="px-10 py-5 bg-sky-500 hover:bg-sky-400 text-slate-50 rounded-2xl text-[10px] font-semibold uppercase tracking-widest transition-all shadow-xl shadow-sky-500/20 active:scale-95 flex items-center justify-center gap-3 mx-auto"
          >
            <ArrowLeft size={16} /> Return to Patient Roster
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4 md:px-0">
      
      {/* ── CLINICAL HEADER ── */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-8 rounded-[40px] flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-sky-500 rounded-3xl flex items-center justify-center text-slate-50 shadow-lg shadow-sky-500/20">
             <FileText size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-50 uppercase tracking-tighter leading-tight">Submit Telemetry</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-2 leading-relaxed">
              Field Reporter: {patient.first_name} {patient.last_name} • PT-ID: {patient.patient_id}
            </p>
          </div>
        </div>
        <div className="hidden md:block text-right">
           <div className="flex items-center gap-2 text-emerald-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-semibold uppercase">Secure Node Link</span>
           </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ── SECTION 1: TRIAGE / CONDITION ── */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
             <Activity size={18} className="text-sky-500" />
             <h3 className="text-xs font-semibold text-slate-50 uppercase tracking-[0.2em] tracking-tighter leading-tight">Subject Status Triage</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TriageButton 
              active={form.physical_status === 'stable'} 
              onClick={() => setField('physical_status', 'stable')}
              label="Stable" sub="Routine" color="emerald" icon={<CheckCircle2 size={24}/>} 
            />
            <TriageButton 
              active={form.physical_status === 'warning'} 
              onClick={() => setField('physical_status', 'warning')}
              label="Warning" sub="Observation" color="amber" icon={<AlertTriangle size={24}/>} 
            />
            <TriageButton 
              active={form.physical_status === 'critical'} 
              onClick={() => setField('physical_status', 'critical')}
              label="Critical" sub="Emergency" color="rose" icon={<AlertCircle size={24}/>} 
            />
          </div>
        </div>

        {/* ── SECTION 2: VITAL SIGNS (Bento Grid) ── */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
             <Heart size={18} className="text-rose-500" />
             <h3 className="text-xs font-semibold text-slate-50 uppercase tracking-[0.2em] tracking-tighter leading-tight">Clinical Telemetry</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <VitalInput label="Blood Pressure" unit="mmHg" icon={<Activity size={18}/>} placeholder="120/80" value={form.blood_pressure} onChange={(v: string) => setField('blood_pressure', v)} />
            <VitalInput label="Heart Rate" unit="BPM" icon={<Heart size={18}/>} placeholder="72" value={form.heart_rate} onChange={(v: string) => setField('heart_rate', v)} />
            <VitalInput label="Temperature" unit="°C" icon={<Thermometer size={18}/>} placeholder="36.5" value={form.temperature} onChange={(v: string) => setField('temperature', v)} />
            <VitalInput label="O₂ Saturation" unit="%" icon={<Zap size={18}/>} placeholder="98" value={form.oxygen_saturation} onChange={(v: string) => setField('oxygen_saturation', v)} />
            
            {/* ── NEW: ALLERGIC REACTION CHECK ── */}
            <div className="md:col-span-2 mt-4">
              <div className={`p-6 rounded-[28px] border-2 transition-all flex items-center justify-between ${
                form.allergic_reaction_detected 
                  ? 'bg-rose-500/10 border-rose-500/30' 
                  : 'bg-slate-950/50 border-white/5'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    form.allergic_reaction_detected ? 'bg-rose-500 text-slate-50 animate-pulse' : 'bg-white/5 text-slate-500'
                  }`}>
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-50 uppercase tracking-tight leading-relaxed">Acute Allergic Reaction?</p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Check for rashes, swelling, or itching</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setField('allergic_reaction_detected', !form.allergic_reaction_detected)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.allergic_reaction_detected ? 'bg-rose-500' : 'bg-slate-700'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    form.allergic_reaction_detected ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: NOTES & VISUALS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Notes */}
           <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8">
              <h3 className="text-[10px] font-semibold text-slate-500 uppercase mb-6 tracking-tighter leading-tight">Clinical Observations</h3>
              <textarea 
                value={form.notes}
                onChange={e => setField('notes', e.target.value)}
                placeholder="Describe current patient condition..."
                className="w-full bg-slate-950/50 border border-white/10 rounded-[28px] p-6 text-sm text-slate-50 focus:border-sky-500/50 transition-all outline-none min-h-[160px] resize-none font-medium placeholder:text-slate-700"
              />
           </div>

           {/* Photo Upload */}
           <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8 flex flex-col justify-between">
              <h3 className="text-[10px] font-semibold text-slate-500 uppercase mb-6 tracking-tighter leading-tight">Visual Telemetry (Optional)</h3>
              
              {imagePreview ? (
                <div className="relative aspect-video rounded-[28px] overflow-hidden border border-white/10 group">
                  <img src={imagePreview} className="w-full h-full object-cover" />
                  <button onClick={removeImage} className="absolute top-4 right-4 p-2 bg-black/60 text-slate-50 rounded-full hover:bg-rose-500 transition-all">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 border-2 border-dashed border-white/5 rounded-[28px] flex flex-col items-center justify-center gap-4 hover:border-sky-500/30 hover:bg-sky-500/5 transition-all group min-h-[160px]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-600 group-hover:text-sky-500 transition-all">
                    <Plus size={24} />
                  </div>
                  <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest leading-relaxed">Add Clinical Photo</p>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                </button>
              )}
           </div>
        </div>

        {/* ── FINAL TRANSMISSION ── */}
        <button 
          type="submit"
          disabled={submitting}
          className={`w-full py-6 rounded-[2rem] font-bold uppercase text-sm tracking-[0.3em] flex items-center justify-center gap-3 transition-all shadow-2xl ${
            form.physical_status === 'critical' 
              ? 'bg-rose-600 text-slate-50 shadow-rose-500/20' 
              : 'bg-sky-500 text-slate-50 shadow-sky-500/20'
          } hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50`}
        >
          {submitting ? <Loader2 className="animate-spin" /> : <><Send size={20} /> Transmit Field Report</>}
        </button>

      </form>
    </div>
  )
}

// ── HELPER: TRIAGE BUTTON ──
interface TriageButtonProps {
  active: boolean;
  label: string;
  sub: string;
  color: 'emerald' | 'amber' | 'rose';
  icon: React.ReactNode;
  onClick: () => void;
}

function TriageButton({ active, label, sub, color, icon, onClick }: TriageButtonProps) {
  const activeThemes = {
    emerald: 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]',
    amber: 'border-amber-500 bg-amber-500/20 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]',
    rose: 'border-rose-500 bg-rose-500/20 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-6 rounded-[28px] border-2 transition-all flex flex-col items-center gap-3 ${active ? activeThemes[color] : 'border-white/5 bg-white/[0.02] text-slate-500 hover:border-white/10'}`}
    >
      <div className={active ? 'scale-110 transition-transform' : 'opacity-40'}>{icon}</div>
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-tight leading-relaxed">{label}</p>
        <p className="text-[8px] font-bold uppercase tracking-widest opacity-60 leading-relaxed">{sub}</p>
      </div>
    </button>
  );
}

// ── HELPER: VITAL INPUT ──
interface VitalInputProps {
  label: string;
  unit: string;
  icon: React.ReactNode;
  placeholder: string;
  value: any;
  onChange: (val: any) => void;
}

function VitalInput({ label, unit, icon, placeholder, value, onChange }: VitalInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between px-2">
        <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">{label}</label>
        <span className="text-[9px] font-semibold text-sky-500/40 uppercase tracking-widest">{unit}</span>
      </div>
      <div className="relative group">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-500 transition-colors">
          {icon}
        </div>
        <input 
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-slate-50 font-mono text-lg outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-700"
        />
      </div>
    </div>
  );
}
