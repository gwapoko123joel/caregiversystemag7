import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  ArrowRightLeft, 
  ChevronDown,
  Filter,
  MoreVertical,
  ChevronRight,
  MapPin,
  Activity,
  User,
  Loader2
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import type { Patient, Profile } from '../../../types/database';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateAge } from '../../../utils/medical';

export default function PatientManagementView() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [caregivers, setCaregivers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter] = useState<string>('all');
  
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [newCaregiverId, setNewCaregiverId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const { data: patientData } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });
    
    const { data: caregiverData } = await supabase
      .from('caregivers')
      .select('*')
      .eq('role', 'caregiver')
      .eq('status', 'authorized');

    if (patientData) setPatients(patientData);
    if (caregiverData) setCaregivers(caregiverData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);



  const handleReassign = async () => {
    if (!selectedPatient || !newCaregiverId) return;

    try {
      const { error } = await supabase
        .from('patients')
        .update({ 
          assigned_caregiver_id: newCaregiverId,
          reassignment_history: [
            ...(selectedPatient.reassignment_history || []),
            { 
              previous_caregiver: selectedPatient.assigned_caregiver_id,
              new_caregiver: newCaregiverId,
              date: new Date().toISOString()
            }
          ]
        })
        .eq('patient_id', selectedPatient.patient_id);

      if (error) throw error;

      setShowReassignModal(false);
      setSelectedPatient(null);
      setNewCaregiverId('');
      fetchData();
    } catch (err) {
      console.error('[PatientManagementView] Error reassigning patient:', err);
    }
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.registration_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* ── HEADER & SEARCH BAR ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shadow-[0_0_10px_#0ea5e9]" />
            <span className="text-[10px] font-black text-sky-500 uppercase tracking-[0.4em]">Registry: Global Population</span>
          </div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
            Patient <span className="text-sky-500">Roster</span>
          </h2>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-2">
            Global Health Network Registry • Management & Oversight
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search global records..."
              className="w-full sm:w-80 bg-slate-900/60 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-sky-500/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="p-4 bg-slate-900/40 border border-white/10 rounded-2xl text-slate-500 cursor-pointer hover:text-sky-500 transition-all">
             <Filter size={18} />
          </div>
        </div>
      </div>

      {/* ── GLOBAL PATIENT GRID (3-Column Layout) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center opacity-40">
             <Loader2 className="animate-spin text-sky-500 mx-auto" size={32} />
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[40px] opacity-30">
            <p className="text-xs font-black uppercase tracking-widest">No matching population nodes found</p>
          </div>
        ) : (
          filteredPatients.map((p) => (
            <div 
              key={p.patient_id}
              className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[32px] p-6 hover:bg-slate-900/60 hover:border-sky-500/30 transition-all group shadow-xl relative overflow-hidden"
            >
              {/* Top Row: Identity & Status */}
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-500 border border-sky-500/20 group-hover:scale-110 transition-transform duration-500">
                  <User size={24} />
                </div>
                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                  (p.status as string) === 'critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 animate-pulse' :
                  (p.status as string) === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                  'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                }`}>
                  {p.status}
                </div>
              </div>

              {/* Middle Row: Patient Name & ID */}
              <div className="space-y-1 mb-6">
                <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-sky-400 transition-colors">
                  {p.first_name} {p.last_name}
                </h3>
                <div className="flex items-center gap-2">
                   <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">PT-ID: {p.patient_id.toString().padStart(4, '0')}</span>
                   <span className="w-1 h-1 rounded-full bg-slate-800" />
                   <span className="text-[9px] font-black text-sky-500/70 uppercase">{calculateAge(p.date_of_birth)}</span>
                </div>
              </div>

              {/* Bottom Section: Location & Condition */}
              <div className="space-y-3 pt-6 border-t border-white/5 mb-8">
                <div className="flex items-center gap-3 text-slate-400">
                  <MapPin size={14} className="text-slate-600" />
                  <span className="text-[10px] font-bold uppercase truncate">{p.address || 'General Bantayan'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <Activity size={14} className="text-slate-600" />
                  <span className="text-[10px] font-bold uppercase truncate">{p.medical_conditions || 'No History Recorded'}</span>
                </div>
              </div>

              {/* Action Group */}
              <div className="flex items-center gap-2">
                 <button 
                  onClick={() => navigate(`/dashboard/admin/patient/${p.patient_id}`)}
                  className="flex-1 py-3 bg-white/5 hover:bg-sky-500 border border-white/10 hover:border-sky-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                 >
                   Clinical Dossier <ChevronRight size={14} />
                 </button>
                 <button 
                   onClick={() => {
                     setSelectedPatient(p);
                     setShowReassignModal(true);
                   }}
                   className="p-3 bg-white/5 hover:bg-white/10 text-slate-500 rounded-xl transition-all"
                 >
                    <MoreVertical size={16} />
                 </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reassign Modal */}
      <AnimatePresence>
        {showReassignModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full bg-[#020617] border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-500 border border-sky-500/20">
                  <ArrowRightLeft size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-light tracking-widest uppercase text-white">Reassign Caregiver</h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Network Realignment</p>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                  Transfer <span className="text-white">{selectedPatient?.first_name} {selectedPatient?.last_name}</span> to:
                </p>
                <div className="relative">
                  <select 
                    value={newCaregiverId}
                    onChange={e => setNewCaregiverId(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white outline-none appearance-none cursor-pointer pr-12"
                  >
                    <option value="">Select Caregiver</option>
                    {caregivers.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => setShowReassignModal(false)}
                  className="flex-1 px-6 py-4 rounded-xl border border-white/5 text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
                >
                  Abort
                </button>
                <button 
                  disabled={!newCaregiverId}
                  onClick={handleReassign}
                  className="flex-1 px-6 py-4 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 text-[10px] font-bold uppercase tracking-widest hover:bg-sky-500/30 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(0,186,255,0.1)]"
                >
                  Update Node
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
