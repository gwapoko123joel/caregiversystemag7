import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  ClipboardList, 
  Phone, 
  ShieldAlert, 
  Upload, 
  CheckCircle2, 
  ChevronRight,
  ArrowLeft,
  X
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../hooks/useAuth';
import { motion } from 'framer-motion';

const MEDICAL_CONDITIONS = [
  'Hypertension', 'Diabetes', 'Arthritis', 'Asthma', 
  'COPD', 'Heart Disease', 'Post-Stroke', 'Dementia',
  'Kidney Disease', 'Tuberculosis', 'Cancer'
];

interface PatientOnboardingFormProps {
  onBack: () => void;
}

export default function PatientOnboardingForm({ onBack }: PatientOnboardingFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: 'Male',
    phone: '',
    address: 'Barangay Bantayan',
    emergencyContact: '',
    emergencyPhone: '',
    notes: ''
  });

  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const toggleCondition = (condition: string) => {
    setSelectedConditions(prev => 
      prev.includes(condition) 
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Upload Photo if exists
      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('patient-photos')
          .upload(fileName, photo);

        if (uploadError) throw uploadError;
      }

      // 2. Approximate DOB from age
      const birthYear = new Date().getFullYear() - parseInt(formData.age);
      const dob = `${birthYear}-01-01`;

      // 3. Insert Patient
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          date_of_birth: dob,
          address: formData.address,
          phone_number: formData.phone,
          gender: formData.gender,
          emergency_contact: `${formData.emergencyContact} (${formData.emergencyPhone})`,
          medical_conditions: selectedConditions.join(', '),
          registration_status: 'pending_verification',
          registered_by: user.id,
          assigned_caregiver_id: user.id,
          rejection_reason: formData.notes // Using this temporarily for submission notes
        })
        .select()
        .single();

      if (patientError) throw patientError;

      // 4. Log Activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        user_type: 'caregiver',
        action: 'patient_registration_submitted',
        details: { patient_id: patient.patient_id, name: `${formData.firstName} ${formData.lastName}` }
      });

      setSuccess(true);
      setTimeout(() => onBack(), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to submit registration');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30"
        >
          <CheckCircle2 size={40} className="text-emerald-500" />
        </motion.div>
        <h2 className="text-2xl font-light tracking-[0.2em] uppercase text-white mb-2">Registration Submitted</h2>
        <p className="text-slate-400 font-light tracking-wide max-w-md">
          Patient details have been sent to the Barangay Admin for verification. 
          The patient will appear in your "Pending" list until approved.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <header className="flex items-center justify-between mb-8 px-4 md:px-0">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Return</span>
        </button>
        <div className="text-right">
          <h1 className="text-xl font-light tracking-[0.2em] uppercase text-white">Patient Onboarding</h1>
          <p className="text-[10px] text-sky-500 uppercase tracking-widest mt-1">Field Registration Entry</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8 px-4 md:px-0">
        {/* Step 1: Basic Info */}
        <section className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <User size={18} className="text-sky-500" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Identification</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">First Name</label>
              <input 
                required
                value={formData.firstName}
                onChange={e => setFormData({...formData, firstName: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-700 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 outline-none transition-all font-light"
                placeholder="Juan"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Last Name</label>
              <input 
                required
                value={formData.lastName}
                onChange={e => setFormData({...formData, lastName: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-700 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 outline-none transition-all font-light"
                placeholder="Dela Cruz"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Age</label>
              <input 
                required
                type="number"
                min="0"
                max="120"
                value={formData.age}
                onChange={e => setFormData({...formData, age: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-700 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 outline-none transition-all font-light"
                placeholder="45"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Gender</label>
              <select 
                value={formData.gender}
                onChange={e => setFormData({...formData, gender: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 outline-none transition-all font-light appearance-none cursor-pointer"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Contact Number</label>
              <input 
                required
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-700 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 outline-none transition-all font-light"
                placeholder="+639XXXXXXXXX"
              />
            </div>
          </div>
        </section>

        {/* Step 2: Location & Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <MapPin size={18} className="text-sky-500" />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Residence</h2>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Home Address</label>
              <textarea 
                required
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-700 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 outline-none transition-all font-light resize-none"
                placeholder="Sitio, Street, Barangay Bantayan"
              />
            </div>
          </section>

          <section className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert size={18} className="text-sky-500" />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Medical Profile</h2>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Pre-existing Conditions</label>
              <div className="flex flex-wrap gap-2">
                {MEDICAL_CONDITIONS.map(condition => (
                  <button
                    key={condition}
                    type="button"
                    onClick={() => toggleCondition(condition)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                      selectedConditions.includes(condition)
                        ? 'bg-sky-500/20 border-sky-500/50 text-sky-400 shadow-[0_0_15px_rgba(0,186,255,0.1)]'
                        : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'
                    } border`}
                  >
                    {condition}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Step 3: Emergency & Photo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <section className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Phone size={18} className="text-sky-500" />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Emergency Proxy</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                <input 
                  required
                  value={formData.emergencyContact}
                  onChange={e => setFormData({...formData, emergencyContact: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-700 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 outline-none transition-all font-light"
                  placeholder="Relative or Guardian"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Contact Number</label>
                <input 
                  required
                  value={formData.emergencyPhone}
                  onChange={e => setFormData({...formData, emergencyPhone: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-700 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 outline-none transition-all font-light"
                  placeholder="+639XXXXXXXXX"
                />
              </div>
            </div>
          </section>

          <section className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Upload size={18} className="text-sky-500" />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Patient Telemetry</h2>
            </div>
            <div className="relative group cursor-pointer">
              <input 
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                photoPreview 
                  ? 'border-sky-500/50 bg-sky-500/5' 
                  : 'border-white/10 bg-white/5 group-hover:border-white/20'
              }`}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <>
                    <Upload size={32} className="text-slate-600 mb-2 group-hover:text-sky-500 transition-colors" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Attach Identification Photo</span>
                  </>
                )}
              </div>
              {photoPreview && (
                <button 
                  type="button"
                  onClick={() => {setPhoto(null); setPhotoPreview(null);}}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-white hover:bg-red-500 transition-colors z-20"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </section>
        </div>

        <section className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardList size={18} className="text-sky-500" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Administrative Notes</h2>
          </div>
          <textarea 
            value={formData.notes}
            onChange={e => setFormData({...formData, notes: e.target.value})}
            rows={3}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-700 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 outline-none transition-all font-light resize-none"
            placeholder="Provide context for verification (e.g. relationship, urgency)..."
          />
        </section>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-light tracking-wide">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-end gap-4">
          <button 
            type="button"
            onClick={onBack}
            className="px-8 py-4 rounded-xl border border-white/10 text-slate-400 font-bold uppercase tracking-widest hover:bg-white/5 transition-all order-2 md:order-1"
          >
            Abort
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="px-12 py-4 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 font-bold uppercase tracking-[0.2em] hover:bg-sky-500/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 order-1 md:order-2 shadow-[0_0_20px_rgba(0,186,255,0.1)] hover:shadow-[0_0_30px_rgba(0,186,255,0.2)]"
          >
            {loading ? 'Transmitting...' : 'Register Patient'}
            <ChevronRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
