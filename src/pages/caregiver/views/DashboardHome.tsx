import { 
  User, 
  Calendar, 
  MapPin, 
  TrendingUp, 
  ChevronRight, 
  AlertTriangle,
  RefreshCw,
  Search
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Patient, PatientMonitoringLog } from '../../../lib/supabaseClient'
import { SkeletonCard, EmptyState } from '../../../components/ClinicalPolish'

interface DashboardHomeProps {
  patient: Patient | null
  loadingPatient: boolean
  recentLogs: PatientMonitoringLog[]
}

export default function DashboardHome({ patient, loadingPatient, recentLogs }: DashboardHomeProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
      {/* ── Patient Identity Card ── */}
      {loadingPatient ? (
        <SkeletonCard />
      ) : patient ? (
         <div className="group relative bg-card border border-card-border rounded-[32px] md:rounded-[40px] p-6 md:p-8 lg:p-12 overflow-hidden hover:border-sky-500/30 transition-all duration-500 shadow-sm dark:shadow-none">
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-sky-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-sky-500/20 transition-all" />
            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 md:gap-12">
              <div className="flex flex-col sm:flex-row items-start gap-6 md:gap-8">
                 <div className="relative">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-sky-500/20 to-slate-500/10 rounded-[28px] md:rounded-[32px] border border-card-border flex items-center justify-center shadow-2xl relative z-10 overflow-hidden transition-colors">
                       <User size={32} className="text-sky-500" />
                    </div>
                    <div className="absolute -inset-2 bg-sky-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full font-sans" />
                 </div>
                 
                 <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                       <h2 className="text-2xl md:text-4xl font-black text-text-main tracking-tight leading-none transition-colors">{patient.first_name} {patient.last_name}</h2>
                       <span className="px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-sky-500/10 text-sky-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(0,229,255,0.3)]">{patient.status}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
                      <div className="flex items-center gap-2 text-sidebar-text-muted transition-colors">
                        <Calendar size={14} className="text-sidebar-text-muted/50" />
                        <span className="text-xs font-bold uppercase tracking-tight">{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sidebar-text-muted transition-colors">
                        <MapPin size={14} className="text-sidebar-text-muted/50" />
                        <span className="text-xs font-bold uppercase tracking-tight truncate max-w-[200px]">{patient.address}</span>
                      </div>
                    </div>
                 </div>
              </div>

              <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-end gap-2 text-right border-t lg:border-none pt-4 lg:pt-0 border-card-border/50">
                 <div className="text-[9px] md:text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest mb-1 leading-none transition-colors">Case ID</div>
                 <code className="text-xl md:text-2xl font-black text-sky-500 bg-sky-500/5 px-4 py-2 rounded-2xl border border-sky-500/10 italic tracking-tighter">PT-{patient.patient_id.toString().padStart(4, '0')}</code>
              </div>
            </div>
         </div>
      ) : (
        <EmptyState 
          title="No Clinical Assignment"
          message="Your caregiver node is not currently linked to an active patient record."
          icon={Search}
          onRetry={() => window.location.reload()}
        />
      )}

      {/* ── Status Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Telemetry Flow Summary */}
        <div className="bg-card border border-card-border rounded-[32px] md:rounded-[40px] overflow-hidden shadow-sm dark:shadow-none transition-colors">
          <div className="px-6 md:p-8 py-5 border-b border-card-border bg-card flex items-center justify-between transition-colors">
             <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-sky-500" />
                <h3 className="text-[10px] md:text-xs font-black uppercase text-text-main tracking-[0.2em] leading-none transition-colors">Telemetry Flow</h3>
             </div>
             {!loadingPatient && recentLogs.length > 0 && <Link to="/dashboard/caregiver/history" className="text-[9px] font-black text-sidebar-text-muted uppercase hover:text-text-main transition-colors">Full History</Link>}
          </div>

          {loadingPatient ? (
            <div className="p-12 space-y-6">
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            </div>
          ) : recentLogs.length === 0 ? (
             <div className="p-12 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center text-sidebar-text-muted mb-4 italic transition-colors">!</div>
                <div className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest transition-colors tracking-[0.2em]">No Recent Telemetry Data</div>
             </div>
          ) : (
            <div className="divide-y divide-card-border transition-colors">
              {recentLogs.map((log) => (
                 <div key={log.log_id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group flex items-center gap-4 text-text-main">
                    <div className="flex-1 space-y-2">
                       <div className="flex items-center justify-between">
                          <div className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest font-mono transition-colors">
                             IDX_{new Date(log.recorded_at!).getTime().toString().slice(-6)}
                          </div>
                          <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                             log.physical_status === 'stable' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                             log.physical_status === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'node-urgent border-none py-1'
                          }`}>
                             {log.physical_status}
                          </div>
                       </div>
                       <div className="flex items-end justify-between">
                          <div>
                             <div className="text-xl font-black text-text-main tracking-widest leading-none font-mono transition-colors">
                                {new Date(log.recorded_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </div>
                             <div className="text-[9px] font-bold text-sidebar-text-muted uppercase mt-1 tracking-tighter transition-colors">TIMESTAMP: {new Date(log.recorded_at!).toLocaleDateString()}</div>
                          </div>
                          <div className="text-right">
                             {log.vital_signs?.blood_pressure && (
                                <div className="text-xs font-black text-sky-500 leading-none">{log.vital_signs.blood_pressure} <span className="text-[8px] font-bold text-sidebar-text-muted ml-0.5 uppercase tracking-tighter">BP</span></div>
                             )}
                             {log.vital_signs?.heart_rate && (
                                <div className="text-xs font-black text-sky-500 mt-1 leading-none">{log.vital_signs.heart_rate} <span className="text-[8px] font-bold text-sidebar-text-muted ml-0.5 uppercase tracking-tighter">BPM</span></div>
                             )}
                          </div>
                       </div>
                    </div>
                    <ChevronRight size={16} className="text-sidebar-text-muted group-hover:text-text-main group-hover:translate-x-1 transition-all" />
                 </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions / Summary */}
        <div className="p-8 md:p-12 bg-card rounded-[32px] md:rounded-[40px] border border-card-border flex flex-col justify-center shadow-sm dark:shadow-none transition-all duration-300">
           <h3 className="text-xl md:text-2xl font-black text-text-main uppercase tracking-tight mb-4 leading-none italic transition-colors">Welcome Back</h3>
           <p className="text-[10px] md:text-xs font-bold text-sidebar-text-muted uppercase tracking-widest leading-relaxed mb-8 max-w-[280px] transition-colors">
             Ensure clinical telemetry is synced before the next round.
           </p>
           <div className="space-y-4">
              <Link to="/dashboard/caregiver/report" className="flex items-center justify-between p-5 md:p-6 bg-sky-500 text-white rounded-2xl md:rounded-3xl font-black uppercase text-[10px] md:text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)]">
                 Submit New Report <ChevronRight size={16} />
              </Link>
           </div>
        </div>
      </div>
    </div>
  )
}
