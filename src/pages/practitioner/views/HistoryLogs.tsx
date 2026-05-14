import { useState, useEffect } from 'react'
import { 
  Activity, 
  Clock, 
  User, 
  Search, 
  Zap,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  Heart,
  Minus,
  Bell,
  RefreshCw
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from '../../../hooks/useAuth'
import type { PatientMonitoringLog } from '../../../types/database'

export default function HistoryLogs() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch Practitioner Profile for Signing
  useEffect(() => {
    if (user) {
      supabase
        .from('caregivers')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setUserProfile(data));
    }
  }, [user]);

  const fetchHistoryLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('patient_monitoring_logs')
        .select(`
          *,
          patient:patients!patient_id (
            first_name,
            last_name
          ),
          caregiver:caregivers!caregiver_id (
            full_name
          ),
          verifier:caregivers!verified_by (
            last_name
          )
        `)
        .order('recorded_at', { ascending: false });

      if (!error) {
        setLogs(data || []);
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistoryLogs()
  }, [])

  async function handleSignOff(logId: number) {
    if (!user) return;
    
    try {
      const { error: updateError } = await supabase
        .from('patient_monitoring_logs')
        .update({ 
          verified_by: user.id,
          verified_at: new Date().toISOString()
        })
        .eq('log_id', logId);

      if (updateError) throw updateError;
      
      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        user_type: 'medical_practitioner',
        action: 'CLINICAL_SIGN_OFF',
        details: { 
          log_id: logId,
          verified_by: `Dr. ${userProfile?.last_name || 'Practitioner'}`
        }
      });

      alert("Clinical Sign-Off Recorded");
      fetchHistoryLogs(); 
    } catch (err) {
      console.error("Sign-off error:", err);
    }
  }

  const filteredLogs = logs.filter(log => {
    const fullName = `${log.patient?.first_name} ${log.patient?.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 px-4 md:px-0">
      
      {/* ── HEADER & SEARCH ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span className="text-[10px] font-black text-sky-500 uppercase tracking-[0.4em]">Archive: Telemetry Stream</span>
          </div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
            Historical <span className="text-sky-500">Audit Trail</span>
          </h2>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2">
            Full Clinical Telemetry History • Barangay Bantayan Node
          </p>
        </div>

        <div className="relative group w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-500 transition-colors" />
          <input 
            type="text"
            placeholder="Search clinical logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/60 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-700"
          />
        </div>
      </div>

      {/* ── LOGS TABLE ── */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
        
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-6 border-b border-white/5 bg-white/[0.02]">
          <div className="col-span-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Node Identity</div>
          <div className="col-span-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Telemetry Payload</div>
          <div className="col-span-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Verification Node</div>
          <div className="col-span-2 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Timestamp</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-white/5">
          {loading ? (
             <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                <RefreshCw size={24} className="animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest">Synchronizing Telemetry Archive...</p>
             </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-20 text-center opacity-30">
              <p className="text-xs font-black uppercase tracking-widest">No matching node telemetry found</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.log_id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-8 py-6 hover:bg-white/[0.02] transition-colors group">
                
                {/* 1. Identity */}
                <div className="col-span-3 flex items-center gap-4">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    log.physical_status === 'critical' ? 'bg-rose-500 animate-pulse shadow-[0_0_12px_#f43f5e]' : 
                    log.physical_status === 'warning' ? 'bg-amber-500' : 'bg-sky-500'
                  }`} />
                  <div>
                    <p className="text-sm font-black text-white uppercase truncate">{log.patient?.first_name} {log.patient?.last_name}</p>
                    <p className={`text-[8px] font-black uppercase tracking-tighter mt-0.5 ${
                      log.physical_status === 'critical' ? 'text-rose-400' : 'text-slate-500'
                    }`}>
                      {log.physical_status} Payload
                    </p>
                  </div>
                </div>

                {/* 2. Telemetry Payload (Vitals) */}
                <div className="col-span-4 flex flex-wrap items-center gap-2">
                  <VitalsPill icon={<Activity size={12}/>} label="BP" value={log.vital_signs?.blood_pressure || '--'} />
                  <VitalsPill icon={<Heart size={12}/>} label="HR" value={log.vital_signs?.heart_rate || '--'} />
                  <VitalsPill icon={<Zap size={12}/>} label="O2" value={`${log.vital_signs?.oxygen_saturation || '--'}%`} color="text-sky-400" />
                </div>

                {/* 3. Caregiver / Verification */}
                <div className="col-span-3 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 border border-white/5 shadow-inner">
                    <User size={14} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-300 uppercase truncate">
                       {log.caregiver?.full_name || 'System Auto'}
                     </p>
                     {log.verified_by ? (
                       <div className="flex items-center gap-1.5 mt-0.5">
                          <ShieldCheck size={10} className="text-emerald-500" />
                          <p className="text-[7px] font-bold text-emerald-500 uppercase tracking-widest">Signed: Dr. {log.verifier?.last_name}</p>
                       </div>
                     ) : (
                       <button 
                         onClick={() => handleSignOff(log.log_id)}
                         className="flex items-center gap-1.5 mt-1 opacity-40 group-hover:opacity-100 transition-opacity"
                       >
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                          <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest group-hover:text-sky-500 transition-colors">Pending Sign-off</p>
                       </button>
                     )}
                  </div>
                </div>

                {/* 4. Timestamp */}
                <div className="col-span-2 text-right self-center">
                  <p className="text-sm font-black text-white font-mono tracking-tighter">
                    {new Date(log.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-[9px] font-bold text-slate-600 uppercase mt-0.5 tracking-widest">
                    {new Date(log.recorded_at).toLocaleDateString()}
                  </p>
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── HELPER COMPONENTS ──

function VitalsPill({ icon, label, value, color = "text-white" }: any) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/50 border border-white/5 rounded-xl transition-all hover:border-white/10 group/pill">
      <div className="text-slate-600 group-hover/pill:text-sky-500 transition-colors">{icon}</div>
      <span className="text-[8px] font-black text-slate-500 uppercase">{label}</span>
      <span className={`text-[10px] font-mono font-bold ${color}`}>{value}</span>
    </div>
  );
}
