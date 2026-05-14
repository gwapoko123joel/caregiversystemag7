import { useState, useEffect } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Search, 
  ChevronRight, 
  Filter, 
  Stethoscope, 
  AlertCircle,
  Clock,
  ArrowLeft,
  PhoneForwarded,
  Info
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_FILTERS = [
  { id: 'all', label: 'All', color: 'slate' },
  { id: 'available', label: 'Available', color: 'emerald' },
  { id: 'on_break', label: 'On Break', color: 'amber' },
  { id: 'busy', label: 'Busy', color: 'red' },
  { id: 'off_duty', label: 'Off Duty', color: 'slate' },
];

export default function AvailableDoctorsView() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('available');
  const [showWarningModal, setShowWarningModal] = useState<{ isOpen: boolean; doctor: any | null }>({ isOpen: false, doctor: null });

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      // 1. Fetch only Authorized Medical Practitioners
      const { data, error } = await supabase
        .from('caregivers')
        .select('*') 
        .eq('role', 'medical_practitioner')
        .eq('status', 'authorized');

      if (error) throw error;

      // 2. Map the results so the UI components can read them easily
      const flattened = (data || []).map(doc => ({
        ...doc,
        // Map id to caregiver_id for existing UI components
        caregiver_id: doc.id,
        // Use duty_status as the source of truth for the filter
        availability_status: (doc.duty_status || 'off_duty').toLowerCase(), 
        prc_profession: 'Medical Practitioner',
        prc_license_number: doc.prc_license || 'VERIFIED',
        clinical_hotline: doc.phone_number || doc.phone,
        // Ensure buttons are active for the demo
        accepts_calls: true, 
        accepts_sms: true 
      }));

      setDoctors(flattened);
    } catch (err) {
      console.error("Directory Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();

    // REAL-TIME: Listen to status changes on the caregivers table
    const channel = supabase
      .channel('doctor-directory-sync')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'caregivers' }, 
        () => fetchDoctors() // Refresh the list automatically when a doctor toggles status
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         doc.specializations?.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         doc.prc_profession.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'available') return matchesSearch && (doc.availability_status === 'available' || doc.availability_status === 'emergency_only');
    return matchesSearch && doc.availability_status === activeFilter;
  });

  const handleCall = async (doctor: any) => {
    if (doctor.availability_status === 'busy' || doctor.availability_status === 'on_break') {
      setShowWarningModal({ isOpen: true, doctor });
      return;
    }
    
    initiatePhoneCall(doctor);
  };

  const initiatePhoneCall = async (doctor: any) => {
    // 1. Log to consultation_sessions
    await supabase.from('consultation_sessions').insert({
      practitioner_id: doctor.caregiver_id,
      consultation_type: 'phone_call',
      phone_number_dialed: doctor.clinical_hotline,
      practitioner_status_at_call: doctor.availability_status,
      urgency_level: doctor.availability_status === 'emergency_only' ? 'critical' : 'routine'
    });

    // 2. Native dialer
    window.location.href = `tel:${doctor.clinical_hotline}`;
    setShowWarningModal({ isOpen: false, doctor: null });
  };

  const initiateSMS = async (doctor: any) => {
     // 1. Log to consultation_sessions
     await supabase.from('consultation_sessions').insert({
      practitioner_id: doctor.caregiver_id,
      consultation_type: 'sms',
      phone_number_dialed: doctor.clinical_hotline,
      practitioner_status_at_call: doctor.availability_status,
      call_status: 'completed'
    });

    // 2. Native SMS
    window.location.href = `sms:${doctor.clinical_hotline}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 page-enter pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/5"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-2xl font-light text-white uppercase tracking-widest leading-none">Find Available Doctor</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Bantayan Monitoring Network — Direct Consultation</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4 sticky top-4 z-40">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text"
            placeholder="Search by name, specialization, or hospital..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 transition-all shadow-lg"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <div className="p-2 bg-slate-900 rounded-xl border border-white/5 text-slate-500">
             <Filter size={16} />
          </div>
          {STATUS_FILTERS.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${activeFilter === filter.id ? `bg-${filter.color}-500/10 border-${filter.color}-500/30 text-${filter.color}-500 shadow-lg shadow-${filter.color}-500/5` : 'bg-slate-900 border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300'}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <div className="w-12 h-12 border-2 border-brand-cyan/20 border-t-brand-cyan rounded-full animate-spin" />
             <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Scanning network nodes...</p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="soft-card bg-slate-900/50 border-white/5 flex flex-col items-center justify-center py-20 text-center space-y-6">
             <div className="w-20 h-20 bg-slate-950 rounded-[2.5rem] flex items-center justify-center text-slate-700">
                <AlertCircle size={40} />
             </div>
             <div className="space-y-2">
                <p className="text-lg font-light text-white uppercase ">No doctors found</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-[280px]">Try adjusting your filters or search terms. If this is an emergency, contact the nearest health center.</p>
             </div>
             <button className="px-6 py-3 bg-brand-cyan text-slate-950 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                Send Urgent SMS Broadcast
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredDoctors.map(doctor => (
              <DoctorCard 
                key={doctor.caregiver_id} 
                doctor={doctor} 
                onCall={handleCall}
                onSMS={initiateSMS}
              />
            ))}
          </div>
        )}
      </div>

      {/* Warning Modal */}
      <AnimatePresence>
        {showWarningModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowWarningModal({ isOpen: false, doctor: null })}
               className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
             />
             <motion.div
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="relative w-full max-w-md soft-card bg-slate-900 border border-red-500/20 p-8 space-y-6"
             >
                <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mx-auto">
                   <PhoneForwarded size={32} />
                </div>
                <div className="text-center space-y-2">
                   <h3 className="text-xl font-light text-white uppercase tracking-widest">Practitioner Busy</h3>
                   <p className="text-xs text-slate-400">
                     Dr. {showWarningModal.doctor?.full_name} is currently <span className="text-red-500 font-bold uppercase">{showWarningModal.doctor?.availability_status.replace('_', ' ')}</span>.
                     {showWarningModal.doctor?.status_message && ` (${showWarningModal.doctor.status_message})`}
                   </p>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pt-2">Only proceed if this is an urgent clinical concern.</p>
                </div>
                <div className="flex gap-3">
                   <button 
                     onClick={() => setShowWarningModal({ isOpen: false, doctor: null })}
                     className="flex-1 py-4 bg-slate-950 border border-white/5 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest"
                   >
                      Cancel
                   </button>
                   <button 
                     onClick={() => initiatePhoneCall(showWarningModal.doctor)}
                     className="flex-1 py-4 bg-red-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-red-500/20"
                   >
                      Call Anyway
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DoctorCard({ doctor, onCall, onSMS }: { doctor: any, onCall: (d: any) => void, onSMS: (d: any) => void }) {
  const statusColors: any = {
    available: 'emerald',
    emergency_only: 'orange',
    on_break: 'amber',
    busy: 'red',
    in_consultation: 'red',
    off_duty: 'slate'
  };
  
  const color = statusColors[doctor.availability_status] || 'slate';
  const isOffDuty = doctor.availability_status === 'off_duty';
  const canCall = doctor.accepts_calls && !isOffDuty;

  return (
    <motion.div 
      layout
      className="soft-card bg-slate-900 border-white/5 hover:border-brand-cyan/20 transition-all group overflow-hidden"
    >
      <div className={`h-1.5 w-full bg-${color}-500/30 mb-6 -mx-8 -mt-8 relative overflow-hidden`}>
         <div className={`absolute inset-0 bg-${color}-500/50 animate-pulse`} />
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-3">
             <div className={`px-3 py-1 rounded-full bg-${color}-500/10 border border-${color}-500/20 flex items-center gap-2`}>
                <div className={`w-1.5 h-1.5 rounded-full bg-${color}-500 ${doctor.availability_status === 'available' ? 'animate-pulse' : ''}`} />
                <span className={`text-[8px] font-bold uppercase tracking-widest text-${color}-500`}>
                  {doctor.availability_status.replace('_', ' ')}
                </span>
             </div>
             {doctor.status_message && (
               <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                  <Info size={10} />
                  {doctor.status_message}
               </div>
             )}
          </div>

          <div>
            <h3 className="text-xl font-light text-white uppercase tracking-widest leading-none">{doctor.full_name}</h3>
            <p className="text-[9px] font-bold text-brand-cyan uppercase tracking-widest mt-2">
              {doctor.prc_profession} · PRC #{doctor.prc_license_number}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 pt-2">
             <div className="flex items-start gap-2">
                <Stethoscope size={14} className="text-slate-500 shrink-0" />
                <div className="space-y-1">
                   <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Hospital & Specialties</p>
                   <p className="text-[10px] text-slate-300">{doctor.primary_hospital || 'Private Practice'}</p>
                   <div className="flex flex-wrap gap-1 mt-1">
                      {doctor.specializations?.map((s: string, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 rounded-md bg-slate-950 border border-white/5 text-[7px] font-bold text-slate-500 uppercase tracking-tighter">
                          {s}
                        </span>
                      ))}
                   </div>
                </div>
             </div>
             <div className="flex items-start gap-2">
                <Clock size={14} className="text-slate-500 shrink-0" />
                <div className="space-y-1">
                   <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Preferred Contact</p>
                   <p className="text-[10px] text-slate-300">{doctor.preferred_contact_hours || '8:00 AM – 5:00 PM PHT'}</p>
                </div>
             </div>
          </div>
        </div>

        <div className="flex md:flex-col gap-2 min-w-[140px]">
           <button 
             onClick={() => onCall(doctor)}
             disabled={!canCall}
             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${canCall ? 'bg-brand-cyan text-slate-950 hover:scale-105 active:scale-95 shadow-lg shadow-brand-cyan/10' : 'bg-slate-950 text-slate-700 cursor-not-allowed'}`}
           >
              <Phone size={14} /> Call Now
           </button>
           <button 
             onClick={() => onSMS(doctor)}
             disabled={!doctor.accepts_sms}
             className={`flex-1 flex items-center justify-center gap-2 py-3 bg-slate-950 border border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:border-brand-cyan/30 transition-all ${doctor.accepts_sms ? 'text-white' : 'text-slate-700 cursor-not-allowed'}`}
           >
              <MessageSquare size={14} /> Send SMS
           </button>
           <button className="flex items-center justify-center gap-2 py-2 text-[8px] font-bold text-slate-600 uppercase tracking-widest hover:text-slate-400 transition-all">
              Clinical Profile <ChevronRight size={10} />
           </button>
        </div>
      </div>
    </motion.div>
  );
}
