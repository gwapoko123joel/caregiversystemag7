import { useState, useEffect } from 'react';
import { 
  FileText, 
  Hospital, 
  Phone, 
  ShieldCheck, 
  Check
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../hooks/useAuth';

const SPECIALIZATIONS = [
  'General Physician', 'Pediatrics', 'Obstetrics & Gynecology', 
  'Internal Medicine', 'Cardiology', 'Surgery', 'Family Medicine',
  'Emergency Medicine', 'Geriatrics', 'Psychiatry'
];

export default function PractitionerCredentialsForm() {
  const { user } = useAuth();
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
      setSuccess(true);
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
        <div className="w-20 h-20 bg-brand-cyan/10 border border-brand-cyan/20 rounded-[2.5rem] flex items-center justify-center text-brand-cyan mx-auto">
           <ShieldCheck size={40} />
        </div>
        <div className="space-y-2">
           <h3 className="text-3xl font-light text-white uppercase tracking-widest">Credentials Submitted</h3>
           <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
             Your practitioner credentials have been queued for administrative verification. You will be notified once your consultation node is activated.
           </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-10 py-4 bg-brand-cyan text-slate-950 rounded-2xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10 page-enter pb-20">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-brand-cyan rounded-full" />
          <h2 className="text-2xl font-light text-white uppercase tracking-widest">Practitioner Onboarding</h2>
        </div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Initialize secure consultation node and verify credentials</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Section: Licensing */}
        <div className="md:col-span-2 space-y-6">
           <div className="flex items-center gap-3 text-slate-500">
              <FileText size={18} />
              <h4 className="text-[10px] font-bold uppercase tracking-widest">Professional Licensing</h4>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField 
                label="PRC License Number" 
                value={formData.prc_license_number}
                onChange={v => setFormData({...formData, prc_license_number: v})}
                placeholder="e.g. 0123456"
                required
              />
              <InputField 
                label="License Expiry Date" 
                type="date"
                value={formData.prc_license_expiry}
                onChange={v => setFormData({...formData, prc_license_expiry: v})}
                required
              />
              <InputField 
                label="Medical Profession" 
                value={formData.prc_profession}
                onChange={v => setFormData({...formData, prc_profession: v})}
                placeholder="e.g. Physician, Nurse Practitioner"
                required
              />
           </div>
        </div>

        {/* Section: Contact */}
        <div className="md:col-span-2 space-y-6 pt-4">
           <div className="flex items-center gap-3 text-slate-500">
              <Phone size={18} />
              <h4 className="text-[10px] font-bold uppercase tracking-widest">Consultation Pipeline</h4>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField 
                label="Clinical Hotline (Philippines)" 
                value={formData.clinical_hotline}
                onChange={v => setFormData({...formData, clinical_hotline: v})}
                placeholder="+639XXXXXXXXX"
                required
              />
              <InputField 
                label="Preferred Contact Hours" 
                value={formData.preferred_contact_hours}
                onChange={v => setFormData({...formData, preferred_contact_hours: v})}
                placeholder="e.g. 8:00 AM – 5:00 PM PHT"
              />
           </div>
           
           <div className="flex gap-8 pt-2">
              <ToggleField 
                label="Accepts Voice Calls" 
                checked={formData.accepts_calls}
                onChange={v => setFormData({...formData, accepts_calls: v})}
              />
              <ToggleField 
                label="Accepts SMS Inquiries" 
                checked={formData.accepts_sms}
                onChange={v => setFormData({...formData, accepts_sms: v})}
              />
           </div>
        </div>

        {/* Section: Specialties */}
        <div className="md:col-span-2 space-y-6 pt-4">
           <div className="flex items-center gap-3 text-slate-500">
              <Hospital size={18} />
              <h4 className="text-[10px] font-bold uppercase tracking-widest">Affiliations & Specializations</h4>
           </div>
           
           <InputField 
              label="Primary Hospital / Institution" 
              value={formData.primary_hospital}
              onChange={v => setFormData({...formData, primary_hospital: v})}
              placeholder="Cebu Provincial Hospital"
            />

           <div className="space-y-3">
              <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Medical Specializations</label>
              <div className="flex flex-wrap gap-2">
                 {SPECIALIZATIONS.map(spec => (
                   <button
                     key={spec}
                     type="button"
                     onClick={() => toggleSpecialization(spec)}
                     className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${specializations.includes(spec) ? 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan' : 'bg-slate-900 border-white/5 text-slate-500'}`}
                   >
                     {spec}
                   </button>
                 ))}
              </div>
           </div>
        </div>

        <div className="md:col-span-2 pt-10">
           <button
             type="submit"
             disabled={loading}
             className="w-full py-5 bg-brand-cyan text-slate-950 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-brand-cyan/10 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3"
           >
             {loading ? <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent animate-spin rounded-full" /> : <ShieldCheck size={18} />}
             Authorize & Register Practitioner Node
           </button>
        </div>
      </form>

      {existingCreds && (
        <div className="soft-card bg-emerald-500/5 border border-emerald-500/20 p-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                 <Check size={20} />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-white uppercase tracking-widest">Verification Status: {existingCreds.verification_status}</p>
                 <p className="text-[8px] text-slate-500 uppercase tracking-widest">Last updated: {new Date(existingCreds.updated_at).toLocaleDateString()}</p>
              </div>
           </div>
           <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Node Online</p>
        </div>
      )}
    </div>
  );
}

interface InputFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}

function InputField({ label, type = 'text', value, onChange, placeholder, required }: InputFieldProps) {
  return (
    <div className="space-y-2">
       <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest px-1">{label}</label>
       <input 
         type={type}
         value={value}
         onChange={(e) => onChange(e.target.value)}
         placeholder={placeholder}
         required={required}
         className="w-full bg-slate-900 border border-white/10 rounded-xl py-4 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all shadow-sm"
       />
    </div>
  );
}

interface ToggleFieldProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function ToggleField({ label, checked, onChange }: ToggleFieldProps) {
  return (
    <button 
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 group"
    >
       <div className={`w-10 h-6 rounded-full transition-all relative ${checked ? 'bg-brand-cyan' : 'bg-slate-800'}`}>
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-5 shadow-lg' : 'left-1'}`} />
       </div>
       <span className="text-[10px] font-bold text-slate-500 group-hover:text-white uppercase tracking-widest transition-colors">{label}</span>
    </button>
  );
}
