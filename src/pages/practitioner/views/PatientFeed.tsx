import { useState, useEffect } from 'react'
import { 
  Users, 
  Search, 
  MapPin,
  ChevronRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import type { PatientWithLogs } from '../types'
import { SkeletonCard, EmptyState } from '../../../components/ClinicalPolish'

export interface PatientFeedProps {
  patients?: PatientWithLogs[] 
  loading?: boolean
}

export default function PatientFeed({ patients: propPatients, loading: propLoading }: PatientFeedProps) {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<any[]>(propPatients || [])
  const [loading, setLoading] = useState(propLoading ?? true)

  const fetchPatients = async () => {
    setLoading(true);
    try {
      // 1. Fetch ALL patients in the Barangay (Inclusive view)
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          logs:patient_monitoring_logs (
            vital_signs,
            physical_status,
            recorded_at
          )
        `);

      if (error) throw error;

      // 2. Process: Extract latest log per patient and apply triage priority
      const processedData = (data || []).map(p => ({
        ...p,
        latest_log: p.logs?.sort((a: any, b: any) => 
          new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
        )[0] || null
      })).sort((a, b) => {
        // Triage Priority: Critical (0) > Warning (1) > Stable (2) > Active (3)
        const priority: any = { critical: 0, warning: 1, stable: 2, active: 3 };
        const aStatus = a.latest_log?.physical_status || 'active';
        const bStatus = b.latest_log?.physical_status || 'active';
        return (priority[aStatus] ?? 3) - (priority[bStatus] ?? 3);
      });

      setPatients(processedData);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!propPatients) {
      fetchPatients();
    } else {
      setPatients(propPatients);
      setLoading(propLoading ?? false);
    }
    
    // Real-time listener for telemetry updates to maintain live triage
    const channel = supabase.channel('telemetry-feed-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patient_monitoring_logs' }, fetchPatients)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [propPatients, propLoading]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-8 shadow-2xl transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8 mb-8 md:mb-12 transition-colors">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center">
                 <Users size={20} className="text-sky-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Telemetry Feed</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Global Barangay Node Network</p>
              </div>
           </div>

           <div className="relative group w-full md:max-w-sm">
               <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-500 transition-colors" />
               <input 
                 placeholder="SCAN PATIENT ROSTER..." 
                 className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-medium text-slate-200 focus:outline-none focus:border-sky-500/40 placeholder:text-slate-500 tracking-widest transition-colors shadow-xl" 
               />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
           {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
           ) : patients.length === 0 ? (
              <div className="col-span-full">
                <EmptyState 
                  title="No Patients Synchronized"
                  message="The clinical node has not detected any active patient records in the monitoring fleet."
                  icon={Users}
                  onRetry={fetchPatients}
                />
              </div>
           ) : (
              patients.map(p => {
                 const status = p.latest_log?.physical_status || 'stable'
                 
                 return (
                    <div 
                      key={p.patient_id}
                      onClick={() => navigate(`/dashboard/practitioner/patient/${p.patient_id}`)}
                      className={`relative bg-slate-900/40 backdrop-blur-md border rounded-[32px] p-6 transition-all cursor-pointer group shadow-2xl overflow-hidden ${
                        status === 'critical' ? 'border-rose-500/30 ring-1 ring-rose-500/20' : 'border-white/5 hover:border-sky-500/50'
                      }`}
                    >
                      {/* Emergency Radar Pulse (Only for Critical) */}
                      {status === 'critical' && (
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-500/10 rounded-full animate-pulse blur-3xl" />
                      )}

                      <div className="flex justify-between items-start mb-6">
                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                          status === 'critical' ? 'bg-rose-500 text-white border-rose-400/50 animate-pulse' :
                          status === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                          'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                        }`}>
                          {status}
                        </div>
                        <span className="text-[9px] font-mono text-slate-500">Node: PT-{p.patient_id.toString().padStart(4, '0')}</span>
                      </div>

                      <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4">{p.first_name} {p.last_name}</h3>

                      {/* ── LIVE TELEMETRY SNAPSHOT ── */}
                      <div className="grid grid-cols-2 gap-2 mb-6">
                        <div className="bg-slate-950/50 p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                           <p className="text-[7px] font-black text-slate-500 uppercase mb-1">Last BP</p>
                           <p className={`text-xs font-mono font-bold ${status === 'critical' ? 'text-rose-400' : 'text-white'}`}>
                             {p.latest_log?.vital_signs?.blood_pressure || '--/--'}
                           </p>
                        </div>
                        <div className="bg-slate-950/50 p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                           <p className="text-[7px] font-black text-slate-500 uppercase mb-1">Last O2</p>
                           <p className="text-xs font-mono font-bold text-sky-400">
                             {p.latest_log?.vital_signs?.oxygen_saturation || '--'}%
                           </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <MapPin size={12} className="text-slate-500" />
                           <span className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[100px]">{p.address}</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-700 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                 )
              })
           )}
        </div>
      </div>
    </div>
  )
}
