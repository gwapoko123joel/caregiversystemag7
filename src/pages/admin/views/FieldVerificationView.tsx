import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { 
  ShieldCheck, User, MapPin, 
  CheckCircle2, Loader2,
  ClipboardList, Info
} from 'lucide-react'

export default function FieldVerificationView() {
  const [pendingPatients, setPendingPatients] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => { fetchQueue(); }, [])

  async function fetchQueue() {
    setLoading(true)
    const { data } = await supabase
      .from('patients')
      .select('*')
      .eq('registration_status', 'pending_verification')
      .order('created_at', { ascending: false })
    
    setPendingPatients(data || [])
    if (data && data.length > 0 && !selectedPatient) setSelectedPatient(data[0])
    setLoading(false)
  }

  async function handleAction(action: 'active' | 'rejected') {
    if (!selectedPatient) return;
    setProcessing(true);
    
    try {
      if (action === 'active') {
        const { error } = await supabase
          .from('patients')
          .update({ 
            registration_status: 'active',
            status: 'active' 
          })
          .eq('patient_id', selectedPatient.patient_id)
        if (error) throw error;
      } else {
        // As per request: Delete the access slot (rejected)
        const { error } = await supabase
          .from('patients')
          .delete()
          .eq('patient_id', selectedPatient.patient_id)
        if (error) throw error;
      }

      await supabase.from('activity_logs').insert({
        action: action === 'active' ? 'PATIENT_APPROVED' : 'PATIENT_REJECTED',
        details: { patient_name: `${selectedPatient.first_name} ${selectedPatient.last_name}`, id: selectedPatient.patient_id }
      });

      setSelectedPatient(null);
      await fetchQueue();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 h-[calc(100vh-140px)] flex flex-col">
      
      {/* ── HEADER ── */}
      <div className="px-2">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
          Field <span className="text-sky-500">Verification</span>
        </h2>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-2">
          Clinical Onboarding Registry • Validation Queue
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* LEFT: THE QUEUE (4 Spans) */}
        <div className="lg:col-span-4 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[32px] overflow-hidden flex flex-col shadow-2xl">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pending Requests ({pendingPatients.length})</h3>
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {loading ? (
              <div className="flex justify-center p-10"><Loader2 className="animate-spin text-sky-500" /></div>
            ) : pendingPatients.length === 0 ? (
              <div className="text-center py-20 opacity-30">
                <ShieldCheck size={40} className="mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase">Queue Clear</p>
              </div>
            ) : (
              pendingPatients.map(p => (
                <button 
                  key={p.patient_id}
                  onClick={() => setSelectedPatient(p)}
                  className={`w-full p-5 rounded-2xl border transition-all text-left group ${
                    selectedPatient?.patient_id === p.patient_id 
                      ? 'bg-sky-500/10 border-sky-500/50 shadow-lg shadow-sky-500/5' 
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                  }`}
                >
                  <p className="text-sm font-black text-white uppercase tracking-tight">{p.first_name} {p.last_name}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-tighter">Registered in {p.address || 'Bantayan'}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: SUBJECT INTEL (8 Spans) */}
        <div className="lg:col-span-8 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[40px] p-10 shadow-2xl flex flex-col relative overflow-hidden">
          {selectedPatient ? (
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500 flex-1 flex flex-col">
              
              {/* Profile Header */}
              <div className="flex items-center gap-8">
                <div className="w-24 h-24 bg-sky-500/10 rounded-[2.5rem] flex items-center justify-center text-sky-500 border border-sky-500/20 shadow-2xl">
                  <User size={48} />
                </div>
                <div>
                   <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em]">Awaiting Authorization</span>
                   <h3 className="text-4xl font-black text-white uppercase tracking-tighter mt-3">{selectedPatient.first_name} {selectedPatient.last_name}</h3>
                   <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">PT-ID: {selectedPatient.patient_id?.toString().padStart(4, '0')}</p>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-6 bg-slate-950/50 rounded-3xl border border-white/5">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">Residence Catchment</p>
                    <div className="flex items-center gap-3">
                       <MapPin size={16} className="text-sky-500" />
                       <p className="text-sm font-bold text-white uppercase">{selectedPatient.address || 'Not Provided'}</p>
                    </div>
                 </div>
                 <div className="p-6 bg-slate-950/50 rounded-3xl border border-white/5">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">Clinical Context</p>
                    <div className="flex items-center gap-3">
                       <ClipboardList size={16} className="text-rose-500" />
                       <p className="text-sm font-bold text-white uppercase">{selectedPatient.medical_history || 'No Prior Conditions'}</p>
                    </div>
                 </div>
              </div>

              {/* Action Handshake */}
              <div className="mt-auto pt-10 border-t border-white/5 flex gap-4">
                 <button 
                   disabled={processing}
                   onClick={() => handleAction('active')}
                   className="flex-[2] py-5 bg-sky-500 hover:bg-sky-400 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-sky-500/20 active:scale-95 flex items-center justify-center gap-3"
                 >
                    {processing ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={18} /> Approve Subject Entry</>}
                 </button>
                 <button 
                   disabled={processing}
                   onClick={() => handleAction('rejected')}
                   className="flex-1 py-5 bg-white/5 hover:bg-rose-600 border border-white/10 text-slate-500 hover:text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] transition-all"
                 >
                    Reject Node
                 </button>
              </div>

              {/* Security Backdrop */}
              <ShieldCheck size={300} className="absolute -right-20 -bottom-20 opacity-[0.02] text-sky-500 pointer-events-none" />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20 space-y-6">
               <Info size={80} strokeWidth={1} />
               <p className="text-xs font-black uppercase tracking-[0.4em]">Select an entry for clinical verification</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
