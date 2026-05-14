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
  Minus
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from '../../../hooks/useAuth'
import type { PatientMonitoringLog } from '../../../types/database'

export default function HistoryLogs() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)

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
      // 1. Mark the log as verified in the database
      const { error: updateError } = await supabase
        .from('patient_monitoring_logs')
        .update({ 
          verified_by: user.id,
          verified_at: new Date().toISOString()
        })
        .eq('log_id', logId);

      if (updateError) throw updateError;
      
      // 2. LOG ACTIVITY: CLINICAL SIGN-OFF
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
      fetchHistoryLogs(); // Refresh list
    } catch (err) {
      console.error("Sign-off error:", err);
    }
  }

  // --- TREND CALCULATION LOGIC ---
  const getTrend = (key: string) => {
    if (logs.length < 2) return null;
    if (!logs[0].vital_signs || !logs[1].vital_signs) return null;
    
    const current = logs[0].vital_signs[key];
    const previous = logs[1].vital_signs[key];

    if (key === 'blood_pressure') {
      const currSys = parseInt(current?.split('/')[0] || '0');
      const prevSys = parseInt(previous?.split('/')[0] || '0');
      if (currSys > prevSys + 5) return { type: 'up', color: 'text-rose-500', label: 'Rising', icon: <TrendingUp size={14} /> };
      if (currSys < prevSys - 5) return { type: 'down', color: 'text-emerald-500', label: 'Improving', icon: <TrendingDown size={14} /> };
      return { type: 'stable', color: 'text-sky-500', label: 'Stable', icon: <Minus size={14} /> };
    }

    const currVal = parseFloat(current || '0');
    const prevVal = parseFloat(previous || '0');

    if (key === 'oxygen_saturation') {
      if (currVal > prevVal) return { type: 'up', color: 'text-emerald-500', label: 'Improving', icon: <TrendingUp size={14} /> };
      if (currVal < prevVal) return { type: 'down', color: 'text-rose-500', label: 'Declining', icon: <TrendingDown size={14} /> };
    } else { // Heart Rate, Temp
      if (currVal > prevVal + 3) return { type: 'up', color: 'text-rose-500', label: 'Rising', icon: <TrendingUp size={14} /> };
      if (currVal < prevVal - 3) return { type: 'down', color: 'text-emerald-500', label: 'Lowering', icon: <TrendingDown size={14} /> };
    }
    return { type: 'stable', color: 'text-sky-500', label: 'Stable', icon: <Minus size={14} /> };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-right-4">
      <div className="bg-card border border-card-border rounded-[32px] md:rounded-[40px] p-6 lg:p-12 shadow-sm dark:shadow-none transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8 mb-8 md:mb-12 transition-colors">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center">
                 <ClipboardList size={20} className="text-sky-500" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-light text-text-main uppercase tracking-[0.1em] leading-none transition-colors">Historical Audit Trail</h3>
                <p className="text-[10px] font-bold text-sidebar-text-muted uppercase tracking-widest mt-1 transition-colors">Full clinical telemetry history</p>
              </div>
           </div>

           <div className="relative group w-full md:max-w-sm">
               <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:text-sky-500 transition-colors" />
               <input placeholder="SEARCH CLINICAL LOGS..." className="w-full bg-card border border-card-border rounded-2xl py-4 pl-12 pr-4 text-xs font-light text-text-main focus:outline-none focus:border-sky-500/40 placeholder:text-sidebar-text-muted/50 tracking-[0.1em] transition-colors shadow-sm dark:shadow-none" />
           </div>
        </div>

        {/* --- VITAL SIGNS TREND HUD --- */}
        {logs.length >= 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 animate-in slide-in-from-top-4 duration-700">
            <div className="bg-sky-500/5 border border-sky-500/10 rounded-[28px] p-6 flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-sidebar-text-muted uppercase tracking-[0.2em] mb-1">Latest Network BP Trend</p>
                <h4 className={`text-sm font-black uppercase flex items-center gap-2 ${getTrend('blood_pressure')?.color}`}>
                  {getTrend('blood_pressure')?.icon} {getTrend('blood_pressure')?.label}
                </h4>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-mono text-text-main font-bold">
                  {logs[1].vital_signs.blood_pressure} → {logs[0].vital_signs.blood_pressure}
                </p>
                <p className="text-[8px] text-sidebar-text-muted uppercase font-bold">Latest Sequential Readings</p>
              </div>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[28px] p-6 flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-sidebar-text-muted uppercase tracking-[0.2em] mb-1">Network Oxygen Stability</p>
                <h4 className={`text-sm font-black uppercase flex items-center gap-2 ${getTrend('oxygen_saturation')?.color}`}>
                  {getTrend('oxygen_saturation')?.icon} {getTrend('oxygen_saturation')?.label}
                </h4>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-mono text-text-main font-bold">
                  {logs[1].vital_signs.oxygen_saturation}% → {logs[0].vital_signs.oxygen_saturation}%
                </p>
                <p className="text-[8px] text-sidebar-text-muted uppercase font-bold">Network Wide O2</p>
              </div>
            </div>
          </div>
        )}

        <div className="hidden md:block bg-card border border-card-border rounded-[32px] overflow-hidden shadow-sm dark:shadow-none transition-colors">
           <table className="w-full">
              <thead>
                 <tr className="text-left text-[10px] font-light text-sidebar-text-muted uppercase tracking-[0.2em] bg-card transition-colors">
                    <th className="px-8 py-5">Node Identity</th>
                    <th className="px-8 py-5">Vitals Metadata</th>
                    <th className="px-8 py-5">Assigned Caregiver</th>
                    <th className="px-8 py-5">Clinical Status</th>
                    <th className="px-8 py-5 text-right">Timestamp</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-card-border transition-colors">
                 {loading ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest transition-colors animate-pulse">Synchronizing clinical history...</div>
                      </td>
                    </tr>
                 ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest transition-colors">Node telemetry archive is currently empty.</div>
                      </td>
                    </tr>
                 ) : (
                    logs.map(log => (
                       <tr key={log.log_id} className="group hover:bg-card/50 transition-all">
                          <td className="px-8 py-8">
                             <div className="flex items-center gap-4">
                                <div className={`w-2.5 h-2.5 rounded-full ${log.physical_status === 'critical' ? 'bg-alert-text shadow-[0_0_10px_var(--color-alert-text)]' : 'bg-sky-500 shadow-[0_0_10px_rgba(0,229,255,0.5)]'}`} />
                                <div>
                                   <div className="text-sm font-light text-text-main tracking-tight transition-colors">
                                     {log.patient?.first_name} {log.patient?.last_name}
                                   </div>
                                   <div className="text-[9px] font-bold text-sidebar-text-muted uppercase tracking-widest mt-1 transition-colors">{log.physical_status} MONITORING</div>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-8">
                             <div className="flex flex-wrap gap-4">
                                {[
                                   { label: 'BP', val: log.vital_signs?.blood_pressure, icon: Activity, color: 'text-sky-400' },
                                   { label: 'BPM', val: log.vital_signs?.heart_rate, icon: Heart, color: 'text-sky-500' },
                                   { label: 'SpO2', val: log.vital_signs?.oxygen_saturation ? `${log.vital_signs.oxygen_saturation}%` : null, icon: Zap, color: 'text-sky-300' },
                                ].filter(v => v.val).map(v => (
                                   <div key={v.label} className="bg-card border border-card-border px-3 py-1.5 rounded-xl flex items-center gap-2 transition-colors">
                                      <v.icon size={12} className={v.color} />
                                      <span className="text-[10px] font-light text-text-main font-mono leading-none tracking-tighter transition-colors">{v.val}</span>
                                   </div>
                                ))}
                             </div>
                          </td>
                          <td className="px-8 py-8">
                             <div className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest transition-colors">
                               {log.caregiver?.full_name || 'System Auto'}
                             </div>
                          </td>
                          <td className="px-8 py-8">
                             {log.verified_by ? (
                               <div className="flex flex-col items-start gap-1">
                                 <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 transition-colors">
                                   <ShieldCheck size={10} />
                                   <span className="text-[8px] font-black uppercase">Verified</span>
                                 </div>
                                 <span className="text-[7px] text-sidebar-text-muted font-bold uppercase ml-1 transition-colors">
                                   By Dr. {log.verifier?.last_name}
                                 </span>
                               </div>
                             ) : (
                               <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-500/5 border border-white/5 rounded-lg text-slate-500/50 transition-colors">
                                 <Clock size={10} />
                                 <span className="text-[8px] font-black uppercase">Pending Review</span>
                                </div>
                             )}
                          </td>
                          <td className="px-8 py-8 text-right">
                             <div className="text-sm font-light text-text-main font-mono tracking-widest leading-none transition-colors">
                                {new Date(log.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </div>
                             <div className="text-[9px] font-bold text-sidebar-text-muted uppercase tracking-tighter mt-1 transition-colors">{new Date(log.recorded_at).toLocaleDateString()}</div>
                          </td>
                          <td className="px-8 py-8 text-right">
                             {!log.verified_by ? (
                               <button 
                                 onClick={() => handleSignOff(log.log_id)}
                                 className="p-2 bg-sky-500/10 hover:bg-sky-500 text-sky-500 hover:text-white rounded-lg transition-all group active:scale-95 shadow-sm"
                                 title="Quick Verify"
                               >
                                 <CheckCircle2 size={16} />
                               </button>
                             ) : (
                               <div className="p-2 text-emerald-500/50 flex justify-end">
                                 <ShieldCheck size={16} />
                               </div>
                             )}
                          </td>
                       </tr>
                    ))
                 )}
              </tbody>
           </table>
        </div>

        {/* Mobile View (Cards) */}
        <div className="md:hidden space-y-4">
           {loading ? (
              <div className="p-12 text-center bg-card border border-card-border rounded-3xl">
                 <div className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest animate-pulse">Syncing...</div>
              </div>
           ) : logs.length === 0 ? (
              <div className="p-12 text-center bg-card border border-card-border rounded-3xl">
                 <div className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest">Node telemetry archive empty.</div>
              </div>
           ) : (
              logs.map(log => (
                 <div key={log.log_id} className="bg-card border border-card-border rounded-[32px] p-6 shadow-sm active:scale-[0.98] transition-all">
                    <div className="flex items-start justify-between mb-6">
                       <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${log.physical_status === 'critical' ? 'bg-alert-text' : 'bg-sky-500'}`} />
                          <div>
                             <div className="text-base font-light text-text-main tracking-tight">
                               {log.patient?.first_name} {log.patient?.last_name}
                             </div>
                             <div className="text-[9px] font-bold text-sidebar-text-muted uppercase tracking-widest">{new Date(log.recorded_at).toLocaleDateString()} · {new Date(log.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                       </div>
                       <span className={`px-2 py-0.5 rounded text-[9px] font-light uppercase tracking-tight ${log.physical_status === 'critical' ? 'bg-alert-text/10 text-alert-text' : 'bg-sky-500/10 text-sky-500'}`}>
                          {log.physical_status}
                       </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-6">
                       {[
                          { label: 'BP', val: log.vital_signs?.blood_pressure, icon: Activity, color: 'text-sky-400' },
                          { label: 'BPM', val: log.vital_signs?.heart_rate, icon: Heart, color: 'text-sky-500' },
                          { label: 'SpO2', val: log.vital_signs?.oxygen_saturation ? `${log.vital_signs.oxygen_saturation}%` : null, icon: Zap, color: 'text-sky-300' },
                       ].map(v => (
                          <div key={v.label} className="bg-primary/30 border border-card-border p-2 rounded-2xl flex flex-col items-center justify-center gap-1">
                             <v.icon size={14} className={v.color} />
                             <span className="text-[10px] font-light text-text-main font-mono">{v.val || '—'}</span>
                          </div>
                       ))}
                    </div>

                    <div className="flex flex-col gap-4 pt-4 border-t border-card-border">
                       <div className="flex items-center justify-between">
                          <div className="text-[9px] font-light text-sidebar-text-muted uppercase tracking-widest">Caregiver</div>
                          <div className="text-[10px] font-light text-text-main uppercase">{log.caregiver?.full_name || 'System Auto'}</div>
                       </div>
                       <div className="flex items-center justify-between">
                          <div className="text-[9px] font-light text-sidebar-text-muted uppercase tracking-widest">Status</div>
                          {log.verified_by ? (
                             <div className="flex items-center gap-1.5 text-emerald-500">
                                <ShieldCheck size={10} />
                                <span className="text-[8px] font-black uppercase">Verified By Dr. {log.verifier?.last_name}</span>
                             </div>
                          ) : (
                             <button 
                               onClick={() => handleSignOff(log.log_id)}
                               className="flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 text-sky-500 rounded-lg border border-sky-500/20 text-[8px] font-black uppercase tracking-widest"
                             >
                                <CheckCircle2 size={10} /> Verify Now
                             </button>
                          )}
                       </div>
                    </div>
                 </div>
              ))
           )}
        </div>
      </div>
    </div>
  )
}

