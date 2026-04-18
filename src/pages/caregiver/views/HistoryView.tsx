import { 
  ClipboardList, 
  Search, 
  Activity, 
  Heart, 
  TrendingUp, 
  Zap, 
  Calendar 
} from 'lucide-react'
import type { PatientMonitoringLog } from '../../../lib/supabaseClient'

interface HistoryViewProps {
  logs: PatientMonitoringLog[]
}

export default function HistoryView({ logs }: HistoryViewProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
      <div className="bg-card border border-card-border rounded-[40px] overflow-hidden shadow-sm dark:shadow-none transition-colors">
        <div className="p-8 border-b border-card-border bg-card flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center">
                 <ClipboardList size={20} className="text-sky-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-text-main uppercase tracking-tight leading-none italic transition-colors">Telemetry Archive</h3>
                <p className="text-[10px] font-bold text-sidebar-text-muted uppercase tracking-widest mt-1 transition-colors">Review historical clinical telemetry packets</p>
              </div>
           </div>

           <div className="relative group max-w-xs w-full">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:text-sky-500 transition-colors" />
              <input 
                placeholder="Search archive..."
                className="w-full bg-card border border-card-border rounded-2xl py-3 pl-10 pr-4 text-[10px] font-bold text-text-main uppercase tracking-widest focus:outline-none focus:border-sky-500/50 transition-all placeholder:text-sidebar-text-muted/50 shadow-sm dark:shadow-none"
              />
           </div>
        </div>

        {logs.length === 0 ? (
           <div className="p-24 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-card border border-card-border rounded-full flex items-center justify-center text-sidebar-text-muted mb-6 italic text-3xl shadow-sm dark:shadow-none transition-colors">!</div>
              <div className="text-sm font-black text-sidebar-text-muted uppercase tracking-[0.2em] transition-colors">Archive is currently empty</div>
              <p className="text-[10px] font-bold text-sidebar-text-muted/50 uppercase mt-2 tracking-widest italic transition-colors">Transmitted telemetry will appear here in real-time</p>
           </div>
        ) : (
          <div className="divide-y divide-card-border transition-colors">
            {logs.map((log) => (
               <div key={log.log_id} className="p-8 hover:bg-card/80 transition-all group">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                     <div className="flex items-start gap-6">
                        <div className="pt-1">
                           <div className={`w-3 h-3 rounded-full shadow-[0_0_15px] ${
                              log.physical_status === 'stable' ? 'bg-emerald-500 shadow-emerald-500/40' : 
                              log.physical_status === 'warning' ? 'bg-amber-500 shadow-amber-500/40' : 
                              'bg-red-500 shadow-red-500/40 animate-pulse'
                           }`} />
                        </div>
                        <div className="space-y-1">
                           <div className="flex items-center gap-3">
                              <span className="text-2xl font-black text-text-main tracking-widest font-mono transition-colors">
                                 {new Date(log.recorded_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${
                                 log.physical_status === 'stable' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' : 
                                 log.physical_status === 'warning' ? 'bg-amber-500/5 text-amber-500 border-amber-500/20' : 
                                 'bg-red-500/5 text-red-500 border-red-500/20 animate-pulse'
                              }`}>
                                 {log.physical_status}
                              </span>
                           </div>
                           <div className="flex items-center gap-2 text-sidebar-text-muted transition-colors">
                              <Calendar size={12} />
                              <span className="text-[10px] font-black uppercase tracking-widest">{new Date(log.recorded_at!).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                           </div>
                        </div>
                     </div>

                     <div className="flex flex-wrap gap-4 overflow-hidden">
                        {[
                           { label: 'BP', val: log.vital_signs?.blood_pressure, icon: Activity, color: 'text-sky-400' },
                           { label: 'BPM', val: log.vital_signs?.heart_rate, icon: Heart, color: 'text-sky-500' },
                           { label: 'TEMP', val: log.vital_signs?.temperature ? `${log.vital_signs.temperature}°C` : null, icon: TrendingUp, color: 'text-amber-400' },
                           { label: 'O2', val: log.vital_signs?.oxygen_saturation ? `${log.vital_signs.oxygen_saturation}%` : null, icon: Zap, color: 'text-sky-300' },
                        ].filter(v => v.val).map(v => (
                           <div key={v.label} className="bg-card border border-card-border rounded-2xl px-5 py-3 flex items-center gap-3 transition-colors">
                              <v.icon size={14} className={v.color} />
                              <div className="flex flex-col">
                                 <span className="text-[8px] font-black text-sidebar-text-muted uppercase leading-none mb-1 transition-colors">{v.label}</span>
                                 <span className="text-xs font-black text-text-main font-mono leading-none tracking-tight transition-colors">{v.val}</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {log.notes && (
                     <div className="mt-6 flex gap-4">
                        <div className="w-[1px] bg-card-border ml-1.5 transition-colors" />
                        <p className="text-[11px] font-medium text-sidebar-text-muted italic leading-relaxed max-w-2xl transition-colors">
                           "{log.notes}"
                        </p>
                     </div>
                  )}
                  
                  {log.image_url && (
                     <div className="mt-8 rounded-3xl overflow-hidden border border-card-border max-w-sm group shadow-md dark:shadow-none transition-colors">
                        <img 
                          src={log.image_url} 
                          alt="Patient Visual Feed" 
                          className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                     </div>
                  )}
               </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
