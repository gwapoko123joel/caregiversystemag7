import { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowRightLeft, 
  ChevronDown,
  ClipboardList
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import type { Patient, Profile } from '../../../types/database';
import PatientCard from '../../../components/patients/PatientCard';
import { motion, AnimatePresence } from 'framer-motion';

export default function PatientManagementView() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [caregivers, setCaregivers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
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
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-light tracking-[0.2em] uppercase text-white">Patient Roster</h1>
          <p className="text-[10px] text-sky-500 uppercase tracking-widest mt-1">Global Health Network Registry</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-white/5 rounded-xl pl-12 pr-6 py-3 text-[10px] uppercase tracking-widest text-white placeholder:text-slate-700 focus:border-sky-500/50 outline-none w-64 transition-all"
            />
          </div>
          <div className="relative">
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-white/5 rounded-xl px-6 py-3 text-[10px] uppercase tracking-widest text-white outline-none appearance-none cursor-pointer pr-12"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending_verification">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="archived">Archived</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 bg-slate-900/50 border border-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 border border-white/5 rounded-3xl text-center">
          <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-slate-700 mb-6 border border-white/5 shadow-inner">
            <ClipboardList size={32} />
          </div>
          <h3 className="text-lg font-light text-white uppercase tracking-widest mb-2">No Patients Found</h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest max-w-xs">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map(patient => (
            <PatientCard 
              key={patient.patient_id} 
              patient={patient}
              onReassign={() => {
                setSelectedPatient(patient);
                setShowReassignModal(true);
              }}
            />
          ))}
        </div>
      )}

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
