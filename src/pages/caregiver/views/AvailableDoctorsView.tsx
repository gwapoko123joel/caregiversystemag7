import { useState, useEffect } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Search, 
  Stethoscope, 
  AlertCircle,
  Clock,
  Loader2,
  User,
  MapPin,
  Info
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

const STATUS_FILTERS = [
  { id: 'all', label: 'All Personnel', color: 'slate' },
  { id: 'available', label: 'Online & Ready', color: 'emerald' },
  { id: 'on_break', label: 'On System Break', color: 'amber' },
  { id: 'in_consultation', label: 'In Consultation', color: 'blue' },
  { id: 'busy', label: 'Busy', color: 'rose' },
  { id: 'off_duty', label: 'Node Offline', color: 'slate' },
];

export default function AvailableDoctorsView() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('available');

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('caregivers')
        .select('*, status_message') 
        .eq('role', 'medical_practitioner')
        .eq('status', 'authorized');

      if (error) throw error;

      const flattened = (data || []).map(doc => ({
        ...doc,
        caregiver_id: doc.id,
        // Use the database status directly, fallback to off_duty
        availability_status: doc.duty_status || 'off_duty', 
        prc_profession: 'Medical Practitioner',
        prc_license_number: doc.prc_license || 'VERIFIED',
        clinical_hotline: doc.phone_number || doc.phone,
        // Allow calling for these specific active states
        accepts_calls: ['available', 'in_consultation', 'busy', 'emergency_only'].includes(doc.duty_status),
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

    const channel = supabase
      .channel('doctor-directory-sync')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'caregivers' }, 
        () => fetchDoctors()
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

  const handleCall = (doctor: any) => {
    window.location.href = `tel:${doctor.clinical_hotline}`;
  };

  const initiateSMS = (doctor: any) => {
    window.location.href = `sms:${doctor.clinical_hotline}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 px-4 md:px-0">
      
      {/* ── HEADER SECTION ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shadow-[0_0_10px_#0ea5e9]" />
            <span className="text-[10px] font-black text-sky-500 uppercase tracking-[0.4em]">Directory: Clinical Personnel</span>
          </div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
            Find <span className="text-sky-500">Available Doctor</span>
          </h2>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-2">
            Direct Consultation Pipeline • Barangay Bantayan Network
          </p>
        </div>

        <div className="relative group w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-500 transition-colors" />
          <input 
            type="text"
            placeholder="Search name or specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/60 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-700 font-medium"
          />
        </div>
      </div>

      {/* ── FILTER CHIPS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide px-2">
        {STATUS_FILTERS.map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              activeFilter === filter.id 
                ? 'bg-sky-500/10 border-sky-500/50 text-sky-400 shadow-lg shadow-sky-500/5' 
                : 'bg-slate-900/40 border-white/5 text-slate-500 hover:text-slate-300'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* ── RESULTS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4 opacity-40">
             <Loader2 className="animate-spin text-sky-500" size={32} />
             <p className="text-[10px] font-black uppercase tracking-widest">Scanning network nodes...</p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="col-span-full bg-slate-900/20 border-2 border-dashed border-white/5 rounded-[40px] py-20 text-center">
             <AlertCircle size={48} className="mx-auto text-slate-700 mb-4" />
             <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No active practitioners found</p>
          </div>
        ) : (
          filteredDoctors.map(doctor => (
            <DoctorCard 
              key={doctor.id} 
              doctor={doctor} 
              onCall={handleCall}
              onSMS={initiateSMS}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── REFINED DOCTOR CARD COMPONENT ──
function DoctorCard({ doctor, onCall, onSMS }: any) {
  const statusConfig: any = {
    available: { color: 'emerald', label: 'Ready for Consult' },
    in_consultation: { color: 'sky', label: 'In Consultation' },
    busy: { color: 'rose', label: 'Busy / Urgent Only' },
    emergency_only: { color: 'orange', label: 'CRITICAL SOS ONLY' },
    on_break: { color: 'amber', label: 'On System Break' },
    off_duty: { color: 'slate', label: 'Node Offline' }
  };

  const status = statusConfig[doctor.availability_status] || statusConfig.off_duty;

  return (
    <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[32px] p-8 flex flex-col justify-between hover:border-sky-500/30 transition-all group shadow-2xl relative overflow-hidden h-full">
      
      {/* Background ID Decoration */}
      <div className="absolute -right-4 -top-4 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform">
         <Stethoscope size={140} />
      </div>

      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="w-16 h-16 bg-sky-500/10 rounded-[2rem] flex items-center justify-center text-sky-500 border border-sky-500/20 group-hover:scale-110 transition-transform duration-500">
             <User size={32} />
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-${status.color}-500/10 border border-${status.color}-500/20`}>
             <div className={`w-1.5 h-1.5 rounded-full bg-${status.color}-500 ${doctor.availability_status === 'available' ? 'animate-pulse' : ''}`} />
             <span className={`text-[8px] font-black uppercase text-${status.color}-500 tracking-widest`}>{status.label}</span>
          </div>
        </div>

        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">{doctor.full_name}</h3>
        <p className={`text-[10px] font-bold text-sky-500 uppercase tracking-widest ${doctor.status_message ? 'mb-2' : 'mb-6'}`}>PRC License: {doctor.prc_license_number}</p>
        
        {doctor.status_message && (
          <p className="text-[10px] text-slate-400 italic mb-6 flex items-center gap-1">
            <Info size={10} className="text-sky-500" />
            "{doctor.status_message}"
          </p>
        )}
        
        <div className="space-y-3 mb-8">
           <div className="flex items-center gap-3 text-slate-400">
              <MapPin size={14} className="text-slate-600" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{doctor.primary_hospital || 'Public Health Center'}</span>
           </div>
           <div className="flex items-center gap-3 text-slate-400">
              <Clock size={14} className="text-slate-600" />
              <span className="text-[10px] font-bold uppercase tracking-widest">8:00 AM – 5:00 PM</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-6 border-t border-white/5">
        <button 
          onClick={() => onCall(doctor)}
          disabled={!doctor.accepts_calls}
          className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
            doctor.accepts_calls 
              ? 'bg-sky-500 text-slate-950 hover:scale-105 active:scale-95 shadow-sky-500/20' 
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
          }`}
        >
          <Phone size={14} /> {doctor.accepts_calls ? 'Call Now' : 'Not Available'}
        </button>
        <button 
          onClick={() => onSMS(doctor)}
          className="flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          <MessageSquare size={14} /> Message
        </button>
      </div>
    </div>
  );
}
