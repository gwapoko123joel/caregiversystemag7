import { useState, useEffect } from 'react';
import { 
  Hospital, 
  Phone, 
  ShieldCheck, 
  Check,
  IdCard,
  PhoneForwarded,
  MapPin,
  Calendar,
  Stethoscope,
  Clock
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../hooks/useAuth';

const SPECIALIZATIONS = [
  'General Physician', 'Pediatrics', 'Obstetrics & Gynecology', 
  'Internal Medicine', 'Cardiology', 'Surgery', 'Family Medicine',
  'Emergency Medicine', 'Geriatrics', 'Psychiatry'
];

export default function PractitionerCredentialsForm() {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [existingCreds, setExistingCreds] = useState<any>(null);

  const [formData, setFormData] = useState({
    prc_license_number: '',
    prc_license_expiry: '',
    prc_profession: 'Medical Doctor',
    primary_hospital: '',
    clinical_hotline: '',
    backup_contact: '',
    preferred_contact_hours: '8:00 AM – 5:00 PM PHT',
    accepts_sms: true,
    accepts_calls: true
  });

  const [specializations, setSpecializations] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchCreds = async () => {
      const { data } = await supabase
        .from('practitioner_credentials')
        .select('*')
        .eq('caregiver_id', user.id)
        .maybeSingle();
      
      if (data) {
        setExistingCreds(data);
        setFormData({
          prc_license_number: data.prc_license_number,
          prc_license_expiry: data.prc_license_expiry,
          prc_profession: data.prc_profession,
          primary_hospital: data.primary_hospital,
          clinical_hotline: data.clinical_hotline,
          backup_contact: data.backup_contact || '',
          preferred_contact_hours: data.preferred_contact_hours,
          accepts_sms: data.accepts_sms,
          accepts_calls: data.accepts_calls
        });
        setSpecializations(data.specializations || []);
      }
    };
    fetchCreds();
  }, [user]);

  const toggleSpecialization = (spec: string) => {
    setSpecializations(prev => 
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const payload = {
      ...formData,
      caregiver_id: user.id,
      specializations,
      verification_status: 'pending'
    };

    const { error } = await supabase
      .from('practitioner_credentials')
      .upsert(payload);

    if (!error) {
      // Also update the main caregivers table for profile sync
      await supabase
        .from('caregivers')
        .update({
          prc_license: formData.prc_license_number,
          license_expiry: formData.prc_license_expiry,
          medical_profession: formData.prc_profession,
          primary_hospital: formData.primary_hospital,
          preferred_contact_hours: formData.preferred_contact_hours,
          specializations: specializations,
          is_active: true // Self-authorize for the demo
        })
        .eq('id', user.id);

      setSuccess(true);
      if (refreshProfile) await refreshProfile();
      
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        user_type: 'medical_practitioner',
        action: 'practitioner_credentials_submitted',
        details: { license: formData.prc_license_number }
      });
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-8 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-sky-500/10 border border-sky-500/20 rounded-[2.5rem] flex items-center justify-center text-sky-500 mx-auto shadow-2xl shadow-sky-500/10">
           <ShieldCheck size={48} className="animate-pulse" />
        </div>
        <div className="space-y-3">
           <h3 className="text-4xl font-semibold text-slate-50 uppercase tracking-tighter leading-tight">Protocol Activated</h3>
           <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed font-medium">
             Your practitioner credentials have been queued for secure verification. You will be notified once your node is authorized for full clinical intervention.
           </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-12 py-5 bg-sky-500 text-slate-50 rounded-3xl text-[11px] font-semibold uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-sky-500/20"
        >
          Return to Console
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4 md:px-0">
      
      {/* ── HEADER: NODE INITIALIZATION ── */}
      <div className="px-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
          <span className="text-[10px] font-semibold text-sky-500 uppercase tracking-[0.4em]">Protocol: Initialization</span>
        </div>
        <h2 className="text-4xl font-semibold text-slate-50 uppercase tracking-tighter leading-tight">
          Node <span className="text-sky-500">Onboarding</span>
        </h2>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed">
          Initialize Secure Consultation Node & Verify Professional Credentials
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ── SECTION 1: PROFESSIONAL LICENSING ── */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[32px] p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
             <IdCard className="text-sky-500" size={18} />
             <h3 className="text-[10px] font-semibold text-slate-50 uppercase tracking-[0.2em] tracking-tighter leading-tight">Professional Licensing</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup 
              label="PRC License Number" 
              placeholder="e.g. 0123456" 
              icon={<ShieldCheck size={14}/>} 
              value={formData.prc_license_number}
              onChange={(v: any) => setFormData({...formData, prc_license_number: v})}
              required
            />
            <InputGroup 
              label="License Expiry Date" 
              type="date" 
              placeholder="dd/mm/yyyy" 
              icon={<Calendar size={14}/>} 
              value={formData.prc_license_expiry}
              onChange={(v: any) => setFormData({...formData, prc_license_expiry: v})}
              required
            />
            <div className="md:col-span-2">
              <InputGroup 
                label="Medical Profession" 
                placeholder="e.g. Medical Doctor / Specialist" 
                icon={<Stethoscope size={14}/>} 
                value={formData.prc_profession}
                onChange={(v: any) => setFormData({...formData, prc_profession: v})}
                required
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 2: CONSULTATION PIPELINE ── */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[32px] p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
             <PhoneForwarded className="text-emerald-500" size={18} />
             <h3 className="text-[10px] font-semibold text-slate-50 uppercase tracking-[0.2em] tracking-tighter leading-tight">Consultation Pipeline</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <InputGroup 
              label="Clinical Hotline (Philippines)" 
              placeholder="+639XXXXXXXXX" 
              icon={<Phone size={14}/>} 
              value={formData.clinical_hotline}
              onChange={(v: any) => setFormData({...formData, clinical_hotline: v})}
              required
            />
            <InputGroup 
              label="Preferred Contact Hours" 
              placeholder="8:00 AM – 5:00 PM PHT" 
              icon={<Clock size={14}/>} 
              value={formData.preferred_contact_hours}
              onChange={(v: any) => setFormData({...formData, preferred_contact_hours: v})}
            />
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-4">
             <ToggleButton 
               label="Accepts Voice Calls" 
               active={formData.accepts_calls} 
               onClick={() => setFormData({...formData, accepts_calls: !formData.accepts_calls})}
             />
             <ToggleButton 
               label="Accepts SMS Inquiries" 
               active={formData.accepts_sms} 
               onClick={() => setFormData({...formData, accepts_sms: !formData.accepts_sms})}
             />
          </div>
        </div>

        {/* ── SECTION 3: AFFILIATIONS & SPECIALIZATIONS ── */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[32px] p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
             <MapPin className="text-rose-500" size={18} />
             <h3 className="text-[10px] font-semibold text-slate-50 uppercase tracking-[0.2em] tracking-tighter leading-tight">Affiliations & Specializations</h3>
          </div>

          <div className="space-y-6">
            <InputGroup 
              label="Primary Hospital / Institution" 
              placeholder="e.g. Cebu Provincial Hospital" 
              icon={<Hospital size={14}/>} 
              value={formData.primary_hospital}
              onChange={(v: any) => setFormData({...formData, primary_hospital: v})}
            />
            
            <div>
              <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest ml-2 mb-3 block">Clinical Specializations</label>
              <div className="flex flex-wrap gap-2">
                 {SPECIALIZATIONS.map(spec => (
                   <span 
                     key={spec} 
                     onClick={() => toggleSpecialization(spec)}
                     className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer border ${
                       specializations.includes(spec) 
                         ? 'bg-sky-500/10 border-sky-500/30 text-slate-50' 
                         : 'bg-white/5 border-white/5 text-slate-400 hover:border-sky-500/50 hover:text-slate-50'
                     }`}
                   >
                     {spec}
                   </span>
                 ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── FINAL SUBMIT ── */}
        <button 
          type="submit"
          disabled={loading}
          className="w-full py-6 bg-sky-500 hover:bg-sky-400 text-slate-50 rounded-[2rem] font-semibold uppercase tracking-[0.3em] text-sm shadow-xl shadow-sky-500/20 transition-all active:scale-[0.98] group flex items-center justify-center gap-3"
        >
           {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <ShieldCheck size={20} className="group-hover:rotate-12 transition-transform" />}
           Authorize & Register Practitioner Node
        </button>

      </form>

      {existingCreds && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-[32px] flex items-center justify-between group shadow-xl">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                 <Check size={24} />
              </div>
              <div>
                 <p className="text-[10px] font-semibold text-slate-50 uppercase tracking-widest leading-relaxed">Node Status: {existingCreds.verification_status}</p>
                 <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1 leading-relaxed">Authorized Node Signature — Verified {new Date(existingCreds.updated_at).toLocaleDateString()}</p>
              </div>
           </div>
           <div className="flex items-center gap-2 text-emerald-500">
              <span className="text-[8px] font-semibold uppercase tracking-widest">Protocol Active</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
           </div>
        </div>
      )}
    </div>
  );
}

// ── HELPER COMPONENTS ──

function InputGroup({ label, placeholder, type = "text", icon, value, onChange, required }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest ml-2">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-500 transition-colors">
          {icon}
        </div>
        <input 
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-slate-50 outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-700"
        />
      </div>
    </div>
  );
}

function ToggleButton({ label, active, onClick }: any) {
  return (
    <button 
      type="button" 
      onClick={onClick}
      className={`px-5 py-3 rounded-2xl border flex items-center gap-3 transition-all ${
        active ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-white/5 border-white/5 text-slate-500'
      }`}
    >
      <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
      <span className="text-[10px] font-semibold uppercase tracking-widest">{label}</span>
    </button>
  );
}
