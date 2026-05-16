import { useEffect, useState } from 'react'
import { ArrowLeft, ShieldCheck, Activity } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { calculateAge } from '../../../utils/medical'

export default function AdminPatientDossier({ patientId, onBack }: any) {
  const [patient, setPatient] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // 1. Fetch Patient
      const { data: p } = await supabase.from('patients').select('*').eq('patient_id', patientId).single();
      setPatient(p);
      
      // 2. Fetch Logs (Joined with names)
      const { data: l } = await supabase
        .from('patient_monitoring_logs')
        .select('*, caregiver:caregivers!caregiver_id(full_name)')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false });
      setLogs(l || []);
      setLoading(false);
    };
    loadData();
  }, [patientId]);

  if (loading) return (
    <div className="flex items-center justify-center py-20 opacity-30">
      <p className="text-xs font-black uppercase tracking-[0.4em] animate-pulse">Synchronizing Clinical Archive...</p>
    </div>
  );

  if (!patient) return (
    <div className="p-8 text-center bg-slate-900/40 rounded-[32px] border border-white/5">
      <p className="text-slate-500 font-bold uppercase text-[10px]">Patient Record Not Found</p>
      <button onClick={onBack} className="mt-4 text-sky-500 font-black text-[10px] uppercase tracking-widest">Return to Roster</button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* ── HEADER ── */}
      <div className="flex items-center gap-6 px-2">
        <button 
          onClick={onBack} 
          className="p-3 bg-slate-900/40 border border-white/10 rounded-2xl text-slate-400 hover:text-sky-500 transition-all active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-3">
             <h2 className="text-3xl font-black text-white uppercase tracking-tight">{patient.first_name} {patient.last_name}</h2>
             <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full text-[9px] font-black uppercase tracking-widest">
               Status: {patient.status}
             </span>
          </div>
          <p className="text-[10px] font-bold text-sky-500 uppercase tracking-[0.4em] mt-1">
            Administrative Clinical Audit • Registry Node: PT-{patient.patient_id.toString().padStart(4, '0')}
          </p>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        
        {/* LEFT: SUBJECT INTEL (3/10) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <ShieldCheck size={120} />
            </div>

            <div className="relative z-10 space-y-6">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                 <Activity size={14} className="text-sky-500" /> Subject Intel
              </h3>

              <div className="space-y-4">
                 <IntelItem label="Residence" value={patient.address} />
                 <IntelItem label="Age Profile" value={calculateAge(patient.date_of_birth)} />
                 <IntelItem label="Medical Context" value={patient.medical_conditions || patient.medical_history || 'No Conditions Declared'} />
              </div>

              <div className="pt-6 border-t border-white/5">
                 <p className="text-[8px] font-black text-slate-600 uppercase mb-2 tracking-widest">Node Synchronization</p>
                 <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    UP TO DATE
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: TELEMETRY STREAM (7/10) */}
        <div className="lg:col-span-7 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-sky-500 rounded-full" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Historical Telemetry Stream</h3>
             </div>
             <span className="text-[9px] font-black text-slate-600 uppercase">{logs.length} Total Snapshots</span>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[600px]">
            {logs.length === 0 ? (
               <div className="py-20 text-center opacity-20">
                 <p className="text-[10px] font-black uppercase tracking-widest">No telemetry records processed</p>
               </div>
            ) : (
              logs.map((log) => (
                <div key={log.log_id} className="p-6 bg-white/[0.02] border border-white/5 rounded-[32px] flex items-center justify-between group hover:border-sky-500/30 transition-all">
                  <div className="flex items-center gap-6">
                    <div className={`w-3 h-3 rounded-full ${
                      log.physical_status === 'critical' ? 'bg-rose-500 animate-pulse shadow-[0_0_10px_#f43f5e]' : 
                      log.physical_status === 'warning' ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'
                    }`} />
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-sky-400 transition-colors">{log.physical_status} Payload</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                        {new Date(log.recorded_at).toLocaleDateString()} • {new Date(log.recorded_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                     <VitalsBox label="BP" value={log.vital_signs?.blood_pressure || '0/0'} />
                     <VitalsBox label="O2" value={`${log.vital_signs?.oxygen_saturation || '0'}%`} />
                  </div>

                  <div className="text-right hidden md:block">
                     <p className="text-[8px] text-slate-600 uppercase font-black tracking-widest">Field Personnel</p>
                     <p className="text-[10px] text-sky-400 font-bold uppercase truncate max-w-[120px]">{log.caregiver?.full_name || 'System'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- HELPERS ---
function IntelItem({ label, value }: any) {
  return (
    <div>
      <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xs font-bold text-white uppercase tracking-tight">{value || 'N/A'}</p>
    </div>
  );
}

function VitalsBox({ label, value }: any) {
  return (
    <div className="bg-slate-950/50 px-4 py-2 rounded-xl border border-white/5 text-center min-w-[80px]">
       <p className="text-[7px] font-black text-slate-600 uppercase">{label}</p>
       <p className="text-xs font-mono font-bold text-white">{value}</p>
    </div>
  );
}
