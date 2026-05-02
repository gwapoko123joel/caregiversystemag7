import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  ArrowLeft, 
  ChevronRight, 
  Phone, 
  MapPin, 
  Activity,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../hooks/useAuth';
import { motion } from 'framer-motion';

interface PatientReferralFormProps {
  onBack: () => void;
}

export default function PatientReferralForm({ onBack }: PatientReferralFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: 'Barangay Bantayan',
    clinicalNotes: '',
    urgency: 'routine'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Create patient record with referral status
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formData.phone,
          address: formData.address,
          registration_status: 'pending_verification',
          registered_by: user.id, // Registered by practitioner
          rejection_reason: `REFERRAL [${formData.urgency.toUpperCase()}]: ${formData.clinicalNotes}`
        })
        .select()
        .single();

      if (patientError) throw patientError;

      // 2. Log Activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        user_type: 'practitioner',
        action: 'patient_referral_submitted',
        details: { 
          patient_id: patient.patient_id, 
          name: `${formData.firstName} ${formData.lastName}`, 
          urgency: formData.urgency 
        }
      });

      setSuccess(true);
      setTimeout(() => onBack(), 3000);
    } catch (err: any) {
      console.error('[PatientReferralForm] Error:', err);
      setError(err.message || 'Failed to submit referral');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-sky-500/20 rounded-full flex items-center justify-center mb-6 border border-sky-500/30 shadow-[0_0_30px_rgba(0,186,255,0.2)]"
        >
          <CheckCircle2 size={40} className="text-sky-500" />
        </motion.div>
        <h2 className="text-2xl font-light tracking-[0.2em] uppercase text-white mb-2">Referral Registered</h2>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest max-w-md">
          Transmission successful. The patient entry has been queued for verification.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-center justify-between mb-12">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Return</span>
        </button>
        <div className="text-right">
          <h1 className="text-2xl font-light tracking-[0.2em] uppercase text-white">Clinical Referral</h1>
          <p className="text-[10px] text-sky-500 uppercase tracking-widest mt-1">Practitioner Submission Portal</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 space-y-8 shadow-2xl">
          <div className="flex items-center gap-3">
            <ClipboardCheck size={20} className="text-sky-500" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Patient Intake Data</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">First Name</label>
              <input 
                required
                value={formData.firstName}
                onChange={e => setFormData({...formData, firstName: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-800 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 outline-none transition-all font-light"
                placeholder="Given Name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Last Name</label>
              <input 
                required
                value={formData.lastName}
                onChange={e => setFormData({...formData, lastName: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-800 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 outline-none transition-all font-light"
                placeholder="Family Name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Primary Contact</label>
              <div className="relative">
                <Phone size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" />
                <input 
                  required
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white placeholder:text-slate-800 focus:border-sky-500/50 outline-none transition-all font-light"
                  placeholder="+63 9XX XXX XXXX"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Residence Catchment</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" />
                <input 
                  required
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white placeholder:text-slate-800 focus:border-sky-500/50 outline-none transition-all font-light"
                  placeholder="Barangay Bantayan, Dumaguete"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Clinical Urgency</label>
            <div className="flex gap-4">
              {['routine', 'urgent', 'emergency'].map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({...formData, urgency: level})}
                  className={`flex-1 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                    formData.urgency === level
                      ? level === 'routine' ? 'bg-sky-500/20 border-sky-500/50 text-sky-400 shadow-[0_0_15px_rgba(0,186,255,0.1)]' :
                        level === 'urgent' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]' :
                        'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                      : 'bg-white/5 border-white/10 text-slate-600 hover:border-white/20'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Clinical Notes & Justification</label>
            <div className="relative">
              <Activity size={14} className="absolute left-6 top-6 text-slate-600" />
              <textarea 
                required
                value={formData.clinicalNotes}
                onChange={e => setFormData({...formData, clinicalNotes: e.target.value})}
                rows={6}
                className="w-full bg-black/40 border border-white/10 rounded-3xl pl-14 pr-6 py-6 text-white placeholder:text-slate-800 focus:border-sky-500/50 outline-none transition-all font-light resize-none"
                placeholder="Document clinical justification, existing diagnoses, or critical health context..."
              />
            </div>
          </div>
        </section>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-bold uppercase tracking-widest">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-end gap-6">
          <button 
            type="button"
            onClick={onBack}
            className="px-10 py-5 rounded-2xl border border-white/5 text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all order-2 md:order-1"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="px-12 py-5 rounded-2xl bg-sky-500 border border-sky-500 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-sky-400 transition-all flex items-center justify-center gap-4 disabled:opacity-50 shadow-[0_0_30px_rgba(0,186,255,0.2)] active:scale-95 order-1 md:order-2"
          >
            {loading ? 'Transmitting...' : 'Register Referral'}
            <ChevronRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
