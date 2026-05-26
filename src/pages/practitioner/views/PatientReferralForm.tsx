import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ChevronRight, 
  Activity,
  Hospital,
  Loader2
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../hooks/useAuth';
import ReferralSlip from './ReferralSlip';

interface PatientReferralFormProps {
  onBack: () => void;
  patient?: any; // Optional: If referring an existing patient
}

export default function PatientReferralForm({ onBack, patient: initialPatient }: PatientReferralFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [urgency, setUrgency] = useState('routine');
  const [formData, setFormData] = useState({
    firstName: initialPatient?.first_name || '',
    lastName: initialPatient?.last_name || '',
    phone: initialPatient?.phone_number || '',
    address: initialPatient?.address || 'Barangay Bantayan',
    clinicalNotes: '',
    targetFacility: '',
    vitals: {
      blood_pressure: initialPatient?.patient_monitoring_logs?.[0]?.vital_signs?.blood_pressure || '120/80',
      heart_rate: initialPatient?.patient_monitoring_logs?.[0]?.vital_signs?.heart_rate || '72',
      oxygen_saturation: initialPatient?.patient_monitoring_logs?.[0]?.vital_signs?.oxygen_saturation || '98',
      temperature: initialPatient?.patient_monitoring_logs?.[0]?.vital_signs?.temperature || '36.5'
    }
  });

  const [generatedReferral, setGeneratedReferral] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from('caregivers')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setUserProfile(data));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      let patientId = initialPatient?.patient_id;

      // 1. If it's a new patient, create the record
      if (!patientId) {
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone_number: formData.phone,
            address: formData.address,
            registration_status: 'pending_verification',
            registered_by: user.id
          })
          .select()
          .single();

        if (patientError) throw patientError;
        patientId = newPatient.patient_id;
      }

      // 2. Create formal referral record
      const { data: referral, error: referralError } = await supabase
        .from('patient_referrals')
        .insert({
          patient_id: patientId,
          doctor_id: user.id,
          target_facility: formData.targetFacility,
          reason_for_referral: formData.clinicalNotes,
          urgency_level: urgency,
          vitals_at_referral: formData.vitals
        })
        .select()
        .single();

      if (referralError) throw referralError;

      // 3. Log Activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        user_type: 'practitioner',
        action: 'patient_referral_submitted',
        details: { 
          patient_id: patientId, 
          referral_id: referral.referral_id,
          name: `${formData.firstName} ${formData.lastName}`
        }
      });

      setGeneratedReferral(referral);
    } catch (err: any) {
      console.error('[PatientReferralForm] Error:', err);
      setError(err.message || 'Failed to submit referral');
    } finally {
      setLoading(false);
    }
  };

  if (generatedReferral) {
    return (
      <ReferralSlip 
        data={generatedReferral} 
        patient={{ first_name: formData.firstName, last_name: formData.lastName }} 
        doctor={userProfile || { last_name: 'Practitioner', prc_license: 'PENDING' }} 
        onBack={() => {
          setGeneratedReferral(null);
          onBack();
        }} 
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4 md:px-0">
      
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span className="text-[10px] font-semibold text-sky-500 uppercase tracking-[0.4em]">Protocol: Clinical Transfer</span>
          </div>
          <h2 className="text-4xl font-semibold text-slate-50 uppercase tracking-tighter leading-tight">
            Referral <span className="text-sky-500">Node</span>
          </h2>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-2 leading-relaxed">
            Initialize Official Patient Transfer to Secondary/Tertiary Facility
          </p>
        </div>
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-50 transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Return</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ── SECTION 1: SUBJECT IDENTIFICATION ── */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-1.5 h-6 bg-sky-500 rounded-full" />
             <h3 className="text-xs font-semibold text-slate-50 uppercase tracking-[0.2em] tracking-tighter leading-tight">Subject Identification</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup 
              label="First Name" 
              placeholder="Given Name" 
              value={formData.firstName} 
              onChange={(val: string) => setFormData({...formData, firstName: val})}
              disabled={!!initialPatient} 
            />
            <InputGroup 
              label="Last Name" 
              placeholder="Family Name" 
              value={formData.lastName} 
              onChange={(val: string) => setFormData({...formData, lastName: val})}
              disabled={!!initialPatient} 
            />
            <InputGroup 
              label="Primary Contact" 
              placeholder="+63 9XX XXX XXXX" 
              value={formData.phone} 
              onChange={(val: string) => setFormData({...formData, phone: val})}
            />
            <InputGroup 
              label="Target Facility" 
              placeholder="e.g. Cebu Provincial Hospital" 
              icon={<Hospital size={16}/>} 
              value={formData.targetFacility}
              onChange={(val: string) => setFormData({...formData, targetFacility: val})}
            />
          </div>
        </div>

        {/* ── SECTION 2: TELEMETRY SNAPSHOT (The Vitals) ── */}
        <div className="bg-slate-900/40 border border-white/5 rounded-[40px] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
             <Activity size={18} className="text-emerald-500" />
             <h3 className="text-xs font-semibold text-slate-50 uppercase tracking-[0.2em] tracking-tighter leading-tight">Clinical Snapshot</h3>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <VitalsInput 
              label="BP" 
              unit="sys/dia" 
              value={formData.vitals.blood_pressure} 
              onChange={(val: string) => setFormData({...formData, vitals: {...formData.vitals, blood_pressure: val}})}
            />
            <VitalsInput 
              label="HR" 
              unit="bpm" 
              value={formData.vitals.heart_rate} 
              onChange={(val: string) => setFormData({...formData, vitals: {...formData.vitals, heart_rate: val}})}
            />
            <VitalsInput 
              label="SpO2" 
              unit="%" 
              value={formData.vitals.oxygen_saturation} 
              color="text-sky-400" 
              onChange={(val: string) => setFormData({...formData, vitals: {...formData.vitals, oxygen_saturation: val}})}
            />
            <VitalsInput 
              label="TEMP" 
              unit="°C" 
              value={formData.vitals.temperature} 
              onChange={(val: string) => setFormData({...formData, vitals: {...formData.vitals, temperature: val}})}
            />
          </div>
        </div>

        {/* ── SECTION 3: URGENCY CALIBRATION ── */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8">
          <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em] mb-6 tracking-tighter leading-tight">Urgency Threshold</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UrgencyBtn label="Routine" active={urgency === 'routine'} onClick={() => setUrgency('routine')} color="emerald" />
            <UrgencyBtn label="Urgent" active={urgency === 'urgent'} onClick={() => setUrgency('urgent')} color="amber" />
            <UrgencyBtn label="Emergency" active={urgency === 'emergency'} onClick={() => setUrgency('emergency')} color="rose" />
          </div>
        </div>

        {/* ── SECTION 4: JUSTIFICATION ── */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-[40px] p-8">
          <h3 className="text-[10px] font-semibold text-slate-500 uppercase mb-6 tracking-tighter leading-tight">Clinical Justification</h3>
          <textarea 
            required
            placeholder="Document reason for transfer, initial diagnosis, or critical context..."
            value={formData.clinicalNotes}
            onChange={(e) => setFormData({...formData, clinicalNotes: e.target.value})}
            className="w-full bg-slate-950/50 border border-white/10 rounded-[32px] p-6 text-sm text-slate-50 focus:border-sky-500/50 transition-all outline-none min-h-[160px] resize-none placeholder:text-slate-700"
          />
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-[10px] font-semibold uppercase tracking-widest">
            {error}
          </div>
        )}

        {/* ── SUBMIT ACTIONS ── */}
        <div className="flex flex-col md:flex-row items-center gap-4 pt-4">
           <button 
             type="button" 
             onClick={onBack}
             className="w-full md:w-1/4 py-5 bg-white/5 border border-white/10 text-slate-400 rounded-3xl text-[10px] font-semibold uppercase tracking-widest hover:text-slate-50 transition-all"
           >
             Cancel
           </button>
           <button 
             type="submit"
             disabled={loading}
             className="w-full md:w-3/4 py-5 bg-sky-500 hover:bg-sky-400 text-slate-50 rounded-3xl text-[10px] font-semibold uppercase tracking-[0.3em] transition-all shadow-xl shadow-sky-500/30 active:scale-[0.98] flex items-center justify-center gap-3"
           >
             {loading ? <Loader2 className="animate-spin" size={18} /> : <>Generate Official Referral Slip <ChevronRight size={18} /></>}
           </button>
        </div>

      </form>
    </div>
  );
}

// ── HELPER COMPONENTS ──

function InputGroup({ label, placeholder, value, icon, onChange, disabled = false }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] font-semibold text-slate-600 uppercase tracking-widest ml-2">{label}</label>
      <div className="relative group">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-500 transition-colors">{icon}</div>}
        <input 
          disabled={disabled}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 ${icon ? 'pl-12' : 'px-5'} pr-5 text-sm text-slate-50 outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-800 font-medium ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>
    </div>
  );
}

function VitalsInput({ label, unit, value, onChange, color = "text-slate-50" }: any) {
  return (
    <div className="bg-slate-950/50 border border-white/5 p-4 rounded-3xl text-center flex flex-col items-center justify-center group hover:border-sky-500/30 transition-all">
       <p className="text-[8px] font-semibold text-slate-600 uppercase mb-1 leading-relaxed">{label} ({unit})</p>
       <input 
         value={value}
         onChange={(e) => onChange?.(e.target.value)}
         className={`bg-transparent text-center text-lg font-mono font-bold outline-none w-full ${color}`}
       />
    </div>
  );
}

function UrgencyBtn({ label, active, onClick, color }: any) {
  const themes: any = {
    emerald: 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5',
    amber: 'border-amber-500/20 text-amber-500 bg-amber-500/5',
    rose: 'border-rose-500/20 text-rose-500 bg-rose-500/5',
  };
  const activeThemes: any = {
    emerald: 'border-emerald-500 bg-emerald-500 text-slate-50 shadow-lg shadow-emerald-500/20',
    amber: 'border-amber-500 bg-amber-500 text-slate-50 shadow-lg shadow-amber-500/20',
    rose: 'border-rose-500 bg-rose-500 text-slate-50 shadow-lg shadow-rose-500/20',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-4 rounded-2xl border-2 font-bold uppercase text-[10px] tracking-widest transition-all ${active ? activeThemes[color] : themes[color] + ' opacity-40 hover:opacity-100'}`}
    >
      {label}
    </button>
  );
}
