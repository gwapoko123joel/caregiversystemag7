import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Clock,
  User,
  Activity
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

export default function PractitionerVerificationView() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('practitioner_credentials')
      .select(`
        *,
        caregivers ( first_name, last_name, email, unique_access_id )
      `)
      .eq('verification_status', 'pending');

    if (!error && data) {
      setPending(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleVerify = async (id: string, status: 'verified' | 'rejected') => {
    const { error } = await supabase
      .from('practitioner_credentials')
      .update({ 
        verification_status: status,
        verified_at: new Date().toISOString(),
        verified_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', id);

    if (!error) {
      // Log action
      await supabase.from('activity_logs').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        user_type: 'admin',
        action: status === 'verified' ? 'practitioner_verified' : 'practitioner_rejected',
        details: { credential_id: id }
      });
      
      setSelected(null);
      fetchPending();
    }
  };

  return (
    <div className="space-y-10 page-enter">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-brand-cyan rounded-full" />
          <h2 className="text-2xl font-light text-white uppercase tracking-widest">Practitioner Verification</h2>
        </div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Validate medical credentials and clinical consultation hotlines</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List */}
        <div className="lg:col-span-1 space-y-4">
           {loading ? (
             <div className="p-8 text-center space-y-4">
                <div className="w-8 h-8 border-2 border-brand-cyan border-t-transparent animate-spin rounded-full mx-auto" />
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Scanning credentials...</p>
             </div>
           ) : pending.length === 0 ? (
             <div className="soft-card bg-slate-900/50 border-white/5 p-12 text-center space-y-4">
                <ShieldCheck size={40} className="text-slate-800 mx-auto" />
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">No pending verifications</p>
             </div>
           ) : (
             pending.map(item => (
               <button
                 key={item.id}
                 onClick={() => setSelected(item)}
                 className={`w-full soft-card bg-slate-900 border-white/5 p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${selected?.id === item.id ? 'ring-1 ring-brand-cyan shadow-lg shadow-brand-cyan/5' : ''}`}
               >
                  <div className="flex items-start justify-between gap-4">
                     <div>
                        <p className="text-[10px] font-bold text-white uppercase tracking-widest leading-none">
                          {item.caregivers.first_name} {item.caregivers.last_name}
                        </p>
                        <p className="text-[8px] text-brand-cyan font-bold uppercase tracking-widest mt-1">
                          {item.prc_profession}
                        </p>
                     </div>
                     <div className="px-2 py-1 bg-slate-950 rounded-md border border-white/5">
                        <p className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter">PRC #{item.prc_license_number}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 text-[7px] font-bold text-slate-600 uppercase tracking-widest">
                     <Clock size={10} />
                     Submitted {new Date(item.created_at).toLocaleDateString()}
                  </div>
               </button>
             ))
           )}
        </div>

        {/* Detail View */}
        <div className="lg:col-span-2">
           <AnimatePresence mode="wait">
              {selected ? (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="soft-card bg-slate-900 border-white/5 p-8 space-y-10"
                >
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="w-16 h-16 bg-brand-cyan/10 rounded-[2rem] flex items-center justify-center text-brand-cyan">
                            <User size={32} />
                         </div>
                         <div>
                            <h3 className="text-2xl font-light text-white uppercase tracking-widest leading-none">
                               {selected.caregivers.first_name} {selected.caregivers.last_name}
                            </h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
                               Operator ID: {selected.caregivers.unique_access_id}
                            </p>
                         </div>
                      </div>
                      <div className="flex gap-3">
                         <button 
                           onClick={() => handleVerify(selected.id, 'rejected')}
                           className="px-6 py-3 bg-slate-950 border border-red-500/30 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                         >
                            Reject
                         </button>
                         <button 
                           onClick={() => handleVerify(selected.id, 'verified')}
                           className="px-8 py-3 bg-brand-cyan text-slate-950 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-brand-cyan/10 hover:scale-105 transition-all"
                         >
                            Approve Practitioner
                         </button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <DetailBlock 
                        icon={<FileText size={18} />} 
                        label="PRC License Details"
                        items={[
                          { label: 'License Number', val: selected.prc_license_number },
                          { label: 'Profession', val: selected.prc_profession },
                          { label: 'Expiry Date', val: selected.prc_license_expiry, color: new Date(selected.prc_license_expiry) < new Date() ? 'text-red-500' : 'text-emerald-500' },
                        ]}
                      />
                      <DetailBlock 
                        icon={<Clock size={18} />} 
                        label="Contact Handshake"
                        items={[
                          { label: 'Clinical Hotline', val: selected.clinical_hotline },
                          { label: 'Accepts SMS', val: selected.accepts_sms ? 'YES' : 'NO' },
                          { label: 'Preferred Hours', val: selected.preferred_contact_hours },
                        ]}
                      />
                      <DetailBlock 
                        icon={<Hospital size={18} />} 
                        label="Hospital & Specialty"
                        items={[
                          { label: 'Primary Hospital', val: selected.primary_hospital || 'Not Specified' },
                          { label: 'Specializations', val: selected.specializations?.join(', ') || 'General' },
                        ]}
                      />
                      <div className="soft-card bg-slate-950 border-white/5 p-6 flex flex-col items-center justify-center text-center space-y-4">
                         <Activity size={24} className="text-brand-cyan opacity-20" />
                         <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest max-w-[160px]">
                           Approving this practitioner will automatically initialize their availability node.
                         </p>
                      </div>
                   </div>
                </motion.div>
              ) : (
                <div className="h-[400px] soft-card bg-slate-900/30 border-white/5 border-dashed flex flex-col items-center justify-center text-center space-y-4">
                   <div className="w-16 h-16 bg-slate-950 rounded-[2rem] flex items-center justify-center text-slate-800">
                      <ShieldCheck size={32} />
                   </div>
                   <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest max-w-[200px]">
                      Select a pending credential from the directory to review and verify.
                   </p>
                </div>
              )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function DetailBlock({ icon, label, items }: any) {
  return (
    <div className="space-y-4">
       <div className="flex items-center gap-3 text-slate-500">
          {icon}
          <h4 className="text-[10px] font-bold uppercase tracking-widest">{label}</h4>
       </div>
       <div className="space-y-3 p-5 bg-slate-950 rounded-2xl border border-white/5">
          {items.map((item: any, i: number) => (
            <div key={i} className="flex justify-between items-center gap-4">
               <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{item.label}</span>
               <span className={`text-[10px] font-bold uppercase tracking-widest text-right ${item.color || 'text-white'}`}>{item.val}</span>
            </div>
          ))}
       </div>
    </div>
  );
}

function Hospital({ size, className }: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 6v4" />
      <path d="M14 14h-4" />
      <path d="M14 18h-4" />
      <path d="M14 8h-4" />
      <path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2" />
      <path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18" />
    </svg>
  );
}
