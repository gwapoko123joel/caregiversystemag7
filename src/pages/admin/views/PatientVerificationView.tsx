import { useState, useEffect } from 'react';
import { XCircle, Search, ClipboardList } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import type { Patient } from '../../../types/database';
import PatientCard from '../../../components/patients/PatientCard';
import { useAuth } from '../../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

export default function PatientVerificationView() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const { user } = useAuth();

  const fetchPendingPatients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('registration_status', 'pending_verification')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[PatientVerificationView] Error fetching patients:', error);
    }
    
    if (data) setPatients(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingPatients();
  }, []);

  const handleApprove = async (patient: Patient) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('patients')
        .update({
          registration_status: 'active',
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          status: 'active'
        })
        .eq('patient_id', patient.patient_id);

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        user_id: user.id,
        user_type: 'admin',
        action: 'patient_approved',
        details: { patient_id: patient.patient_id, name: `${patient.first_name} ${patient.last_name}` }
      });

      fetchPendingPatients();
    } catch (err) {
      console.error('[PatientVerificationView] Error approving patient:', err);
    }
  };

  const handleReject = async () => {
    if (!user || !selectedPatient) return;
    try {
      const { error } = await supabase
        .from('patients')
        .update({
          registration_status: 'rejected',
          rejection_reason: rejectionReason,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          status: 'inactive'
        })
        .eq('patient_id', selectedPatient.patient_id);

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        user_id: user.id,
        user_type: 'admin',
        action: 'patient_rejected',
        details: { 
          patient_id: selectedPatient.patient_id, 
          name: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
          reason: rejectionReason
        }
      });

      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedPatient(null);
      fetchPendingPatients();
    } catch (err) {
      console.error('[PatientVerificationView] Error rejecting patient:', err);
    }
  };

  const filteredPatients = patients.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-light tracking-[0.2em] uppercase text-slate-50 tracking-tighter leading-tight">Verification Queue</h1>
          <p className="text-[10px] text-sky-500 uppercase tracking-widest mt-1 leading-relaxed">Pending Field Registrations</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-white/5 rounded-xl pl-12 pr-6 py-3 text-[10px] uppercase tracking-widest text-slate-50 placeholder:text-slate-700 focus:border-sky-500/50 outline-none w-64 transition-all"
            />
          </div>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-64 bg-slate-900/50 border border-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 border border-white/5 rounded-3xl text-center">
          <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-slate-700 mb-6 border border-white/5 shadow-inner">
            <ClipboardList size={32} />
          </div>
          <h3 className="text-lg font-light text-slate-50 uppercase mb-2 tracking-tighter leading-tight">Queue Clear</h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest max-w-xs leading-relaxed">No pending patient registrations found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map(patient => (
            <PatientCard 
              key={patient.patient_id} 
              patient={patient} 
              onVerify={() => handleApprove(patient)}
              onReject={() => {
                setSelectedPatient(patient);
                setShowRejectModal(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full bg-[#020617] border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/20">
                  <XCircle size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-light uppercase text-slate-50 tracking-tighter leading-tight">Reject Entry</h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 leading-relaxed">Verification Denial</p>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                  Reason for rejecting <span className="text-slate-50">{selectedPatient?.first_name} {selectedPatient?.last_name}</span>:
                </p>
                <textarea 
                  autoFocus
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="e.g. Incomplete address, Duplicate record..."
                  rows={4}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-50 placeholder:text-slate-700 focus:border-red-500/50 outline-none transition-all resize-none font-light"
                />
              </div>

              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-6 py-4 rounded-xl border border-white/5 text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
                >
                  Abort
                </button>
                <button 
                  disabled={!rejectionReason.trim()}
                  onClick={handleReject}
                  className="flex-1 px-6 py-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/30 transition-all disabled:opacity-50"
                >
                  Deny Registration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
