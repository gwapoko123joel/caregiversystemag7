import { useState } from 'react';
import { 
  User, Calendar, Phone, MapPin, 
  Activity, ArrowLeft, HeartPulse, 
  ShieldCheck, Loader2, Baby, Info,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../hooks/useAuth';

export default function PatientOnboardingForm({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: 'prefer_not_to_say',
    contact: '',
    address: '',
    medicalHistory: ''
  });

  const setField = (key: string, val: string) => setFormData(prev => ({ ...prev, [key]: val }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    try {
      // 1. Insert the new patient into the database
      const { data: newPatient, error: pError } = await supabase.from('patients').insert({
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        date_of_birth: formData.dob || null,
        gender: formData.gender,
        contact_number: formData.contact.trim(),
        address: formData.address.trim(),
        medical_history: formData.medicalHistory.trim(),
        status: 'active',
        registration_status: 'active',
        registered_by: user.id
      }).select().single();

      if (pError) throw pError;

      // 2. Immediately create the assignment
      if (newPatient) {
        await supabase.from('caregiver_patient_assignments').insert({
          caregiver_id: user.id,
          patient_id: newPatient.patient_id
        });

        // 3. Log the activity for the audit trail
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          user_type: 'caregiver',
          action: 'REGISTER_PATIENT',
          details: { 
            patient_id: newPatient.patient_id, 
            patient_name: `${formData.firstName} ${formData.lastName}` 
          }
        });
      }

      alert("Patient Synced to Network.");
      onBack();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4 md:px-0">
      
      {/* ── HEADER ── */}
      <div className="flex items-center gap-6 px-2">
        <button 
          onClick={onBack}
          className="p-4 bg-slate-900/40 border border-white/10 rounded-2xl text-slate-400 hover:text-sky-500 hover:border-sky-500/50 transition-all active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
            Patient <span className="text-sky-500">Onboarding</span>
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-2">
            Field Registration & Personnel Profiling Protocol
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ── SECTION: PERSONAL IDENTITY ── */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-1.5 h-6 bg-sky-500 rounded-full" />
             <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Personal Identity</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField 
              label="First Name" 
              placeholder="e.g. Juan" 
              icon={<User size={16}/>} 
              value={formData.firstName}
              onChange={(val) => setField('firstName', val)}
              required
            />
            <InputField 
              label="Last Name" 
              placeholder="e.g. Dela Cruz" 
              icon={<User size={16}/>} 
              value={formData.lastName}
              onChange={(val) => setField('lastName', val)}
              required
            />
            <InputField 
              label="Date of Birth" 
              type="date"
              icon={<Calendar size={16}/>} 
              value={formData.dob}
              onChange={(val) => setField('dob', val)}
            />
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Biological Sex</label>
              <div className="relative">
                <select 
                  value={formData.gender}
                  onChange={(e) => setField('gender', e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-5 text-sm text-white focus:border-sky-500/50 transition-all outline-none appearance-none font-medium [color-scheme:dark]"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <ChevronRight size={16} className="rotate-90" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION: CONTACT & LOCATION ── */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
             <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Contact & Location</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <InputField 
                label="Contact Number" 
                placeholder="+63 9XX" 
                icon={<Phone size={16}/>} 
                value={formData.contact}
                onChange={(val) => setField('contact', val)}
              />
            </div>
            <div className="md:col-span-2">
              <InputField 
                label="Barangay Address (Purok/Sitio)" 
                placeholder="Enter complete location..." 
                icon={<MapPin size={16}/>} 
                value={formData.address}
                onChange={(val) => setField('address', val)}
              />
            </div>
          </div>
        </div>

        {/* ── SECTION: CLINICAL CONTEXT ── */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-1.5 h-6 bg-rose-500 rounded-full" />
             <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Clinical Context</h3>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Known Medical History / Conditions</label>
            <div className="relative group">
              <textarea 
                placeholder="e.g. Hypertension, Diabetes Type 2, Asthma..."
                value={formData.medicalHistory}
                onChange={(e) => setField('medicalHistory', e.target.value)}
                rows={4}
                className="w-full bg-slate-950/50 border border-white/10 rounded-[32px] p-6 text-sm text-white focus:border-sky-500/50 transition-all outline-none resize-none placeholder:text-slate-700 font-medium"
              />
            </div>
          </div>
        </div>

        {/* ── SUBMIT ACTIONS ── */}
        <div className="flex flex-col md:flex-row items-center gap-4 pt-4">
           <button 
             type="button" 
             onClick={onBack}
             className="w-full md:w-1/3 py-5 bg-white/5 border border-white/10 text-slate-400 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:text-white transition-all"
           >
             Cancel Entry
           </button>
           <button 
             type="submit"
             disabled={submitting}
             className="w-full md:w-2/3 py-5 bg-sky-500 hover:bg-sky-400 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-sky-500/20 active:scale-[0.98] flex items-center justify-center gap-3"
           >
             {submitting ? <Loader2 className="animate-spin" /> : <><HeartPulse size={18} /> Synchronize Patient to Network</>}
           </button>
        </div>

      </form>
    </div>
  );
}

// --- REUSABLE INPUT COMPONENT ---
function InputField({ label, placeholder, icon, type = "text", value, onChange, required }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative group">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-500 transition-colors">
          {icon}
        </div>
        <input 
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 pl-14 pr-5 text-sm text-white focus:border-sky-500/50 transition-all outline-none placeholder:text-slate-700 font-medium [color-scheme:dark]"
        />
      </div>
    </div>
  );
}
