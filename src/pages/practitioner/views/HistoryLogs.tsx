import { 
  ClipboardList, 
  Search, 
  Activity, 
  Heart, 
  Zap 
} from 'lucide-react'
import type { PatientMonitoringLog } from '../../../types/database'

interface HistoryLogsProps {
  logs: (PatientMonitoringLog & { patient_name?: string, caregiver_name?: string })[]
}

export default function HistoryLogs({ logs }: HistoryLogsProps) {
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

        <div className="hidden md:block bg-card border border-card-border rounded-[32px] overflow-hidden shadow-sm dark:shadow-none transition-colors">
           <table className="w-full">
              <thead>
                 <tr className="text-left text-[10px] font-light text-sidebar-text-muted uppercase tracking-[0.2em] bg-card transition-colors">
                    <th className="px-8 py-5">Node Identity</th>
                    <th className="px-8 py-5">Vitals Metadata</th>
                    <th className="px-8 py-5">Assigned Caregiver</th>
                    <th className="px-8 py-5 text-right">Timestamp</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-card-border transition-colors">
                 {logs.length === 0 ? (
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
                                   <div className="text-sm font-light text-text-main tracking-tight transition-colors">{log.patient_name || '—'}</div>
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
                             <div className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest transition-colors">{log.caregiver_name || 'System Admin'}</div>
                          </td>
                          <td className="px-8 py-8 text-right">
                             <div className="text-sm font-light text-text-main font-mono tracking-widest leading-none transition-colors">
                                {new Date(log.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </div>
                             <div className="text-[9px] font-bold text-sidebar-text-muted uppercase tracking-tighter mt-1 transition-colors">{new Date(log.recorded_at).toLocaleDateString()}</div>
                          </td>
                       </tr>
                    ))
                 )}
              </tbody>
           </table>
        </div>

        {/* Mobile View (Cards) */}
        <div className="md:hidden space-y-4">
           {logs.length === 0 ? (
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
                             <div className="text-base font-light text-text-main tracking-tight">{log.patient_name || '—'}</div>
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

                    <div className="flex items-center justify-between pt-4 border-t border-card-border">
                       <div className="text-[9px] font-light text-sidebar-text-muted uppercase tracking-widest">Caregiver</div>
                       <div className="text-[10px] font-light text-text-main uppercase">{log.caregiver_name || 'System Admin'}</div>
                    </div>
                 </div>
              ))
           )}
        </div>
      </div>
    </div>
  )
}
