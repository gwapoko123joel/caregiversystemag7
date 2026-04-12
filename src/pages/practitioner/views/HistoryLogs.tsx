import { 
  ClipboardList, 
  Search, 
  Activity, 
  Heart, 
  Zap 
} from 'lucide-react'
import type { MonitoringLog } from '../PractitionerDashboard'

interface HistoryLogsProps {
  logs: (MonitoringLog & { patient_name?: string, caregiver_name?: string })[]
}

export default function HistoryLogs({ logs }: HistoryLogsProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-right-4">
      <div className="bg-white/5 border border-white/5 rounded-[40px] p-8 lg:p-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-neon-green/10 rounded-xl flex items-center justify-center">
                 <ClipboardList size={20} className="text-brand-neon-green" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none italic">Historical Audit Trail</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Full clinical telemetry history across all nodes</p>
              </div>
           </div>

           <div className="relative group max-w-sm flex-1">
               <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-brand-neon-green transition-colors" />
               <input placeholder="SEARCH CLINICAL LOGS..." className="w-full bg-brand-dark border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-semibold text-white focus:outline-none focus:border-brand-neon-green/40 placeholder:text-gray-700 tracking-wider" />
           </div>
        </div>

        <div className="bg-brand-dark/30 border border-white/5 rounded-[32px] overflow-hidden">
           <table className="w-full">
              <thead>
                 <tr className="text-left text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] bg-white/[0.01]">
                    <th className="px-8 py-5">Node Identity</th>
                    <th className="px-8 py-5">Vitals Metadata</th>
                    <th className="px-8 py-5">Assigned Caregiver</th>
                    <th className="px-8 py-5 text-right">Timestamp</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                 {logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="text-[10px] font-black text-gray-700 uppercase tracking-widest italic">Node telemetry archive is currently empty.</div>
                      </td>
                    </tr>
                 ) : (
                    logs.map(log => (
                       <tr key={log.log_id} className="group hover:bg-white/[0.02] transition-all">
                          <td className="px-8 py-8">
                             <div className="flex items-center gap-4">
                                <div className={`w-2.5 h-2.5 rounded-full ${log.physical_status === 'critical' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-brand-neon-green shadow-[0_0_10px_rgba(57,255,20,0.5)]'}`} />
                                <div>
                                   <div className="text-sm font-black text-white italic tracking-tight">{log.patient_name || '—'}</div>
                                   <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mt-1">{log.physical_status} MONITORING</div>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-8">
                             <div className="flex flex-wrap gap-4">
                                {[
                                   { label: 'BP', val: log.vital_signs?.blood_pressure, icon: Activity, color: 'text-brand-accent-green' },
                                   { label: 'BPM', val: log.vital_signs?.heart_rate, icon: Heart, color: 'text-brand-neon-green' },
                                   { label: 'SpO2', val: log.vital_signs?.oxygen_saturation ? `${log.vital_signs.oxygen_saturation}%` : null, icon: Zap, color: 'text-brand-accent-green' },
                                ].filter(v => v.val).map(v => (
                                   <div key={v.label} className="bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl flex items-center gap-2">
                                      <v.icon size={12} className={v.color} />
                                      <span className="text-[10px] font-black text-white font-mono leading-none tracking-tighter">{v.val}</span>
                                   </div>
                                ))}
                             </div>
                          </td>
                          <td className="px-8 py-8">
                             <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{log.caregiver_name || 'System Admin'}</div>
                          </td>
                          <td className="px-8 py-8 text-right">
                             <div className="text-sm font-black text-white font-mono tracking-widest leading-none">
                                {new Date(log.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </div>
                             <div className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter mt-1">{new Date(log.recorded_at).toLocaleDateString()}</div>
                          </td>
                       </tr>
                    ))
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  )
}
