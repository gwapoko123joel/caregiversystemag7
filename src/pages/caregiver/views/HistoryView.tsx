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
      <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden">
        <div className="p-8 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-neon-green/10 rounded-xl flex items-center justify-center">
                 <ClipboardList size={20} className="text-brand-neon-green" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none">Telemetry Archive</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Review historical clinical telemetry packets</p>
              </div>
           </div>

           <div className="relative group max-w-xs w-full">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-brand-neon-green transition-colors" />
              <input 
                placeholder="Search archive..."
                className="w-full bg-brand-dark/50 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-[10px] font-bold text-white uppercase tracking-widest focus:outline-none focus:border-white/20 transition-all"
              />
           </div>
        </div>

        {logs.length === 0 ? (
           <div className="p-24 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-gray-700 mb-6 italic text-3xl">!</div>
              <div className="text-sm font-black text-gray-600 uppercase tracking-[0.2em]">Archive is currently empty</div>
              <p className="text-[10px] font-bold text-gray-700 uppercase mt-2 tracking-widest italic">Transmitted telemetry will appear here in real-time</p>
           </div>
        ) : (
          <div className="divide-y divide-white/5">
            {logs.map((log) => (
               <div key={log.log_id} className="p-8 hover:bg-white/[0.02] transition-all group">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                     <div className="flex items-start gap-6">
                        <div className="pt-1">
                           <div className={`w-3 h-3 rounded-full shadow-[0_0_15px] ${
                              log.physical_status === 'stable' ? 'bg-brand-neon-green shadow-brand-neon-green/40' : 
                              log.physical_status === 'warning' ? 'bg-amber-500 shadow-amber-500/40' : 
                              'bg-red-500 shadow-red-500/40 animate-pulse'
                           }`} />
                        </div>
                        <div className="space-y-1">
                           <div className="flex items-center gap-3">
                              <span className="text-2xl font-black text-white tracking-widest font-mono">
                                 {new Date(log.recorded_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${
                                 log.physical_status === 'stable' ? 'bg-brand-neon-green/5 text-brand-neon-green border-brand-neon-green/20' : 
                                 log.physical_status === 'warning' ? 'bg-amber-500/5 text-amber-500 border-amber-500/20' : 
                                 'bg-red-500/5 text-red-500 border-red-500/20'
                              }`}>
                                 {log.physical_status}
                              </span>
                           </div>
                           <div className="flex items-center gap-2 text-gray-600">
                              <Calendar size={12} />
                              <span className="text-[10px] font-black uppercase tracking-widest">{new Date(log.recorded_at!).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                           </div>
                        </div>
                     </div>

                     <div className="flex flex-wrap gap-4 overflow-hidden">
                        {[
                           { label: 'BP', val: log.vital_signs?.blood_pressure, icon: Activity, color: 'text-brand-accent-green' },
                           { label: 'BPM', val: log.vital_signs?.heart_rate, icon: Heart, color: 'text-brand-neon-green' },
                           { label: 'TEMP', val: log.vital_signs?.temperature ? `${log.vital_signs.temperature}°C` : null, icon: TrendingUp, color: 'text-amber-400' },
                           { label: 'O2', val: log.vital_signs?.oxygen_saturation ? `${log.vital_signs.oxygen_saturation}%` : null, icon: Zap, color: 'text-brand-accent-green' },
                        ].filter(v => v.val).map(v => (
                           <div key={v.label} className="bg-white/5 border border-white/5 rounded-2xl px-5 py-3 flex items-center gap-3">
                              <v.icon size={14} className={v.color} />
                              <div className="flex flex-col">
                                 <span className="text-[8px] font-black text-gray-700 uppercase leading-none mb-1">{v.label}</span>
                                 <span className="text-xs font-black text-white font-mono leading-none tracking-tight">{v.val}</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {log.notes && (
                     <div className="mt-6 flex gap-4">
                        <div className="w-[1px] bg-white/10 ml-1.5" />
                        <p className="text-[11px] font-medium text-gray-500 italic leading-relaxed max-w-2xl">
                           "{log.notes}"
                        </p>
                     </div>
                  )}
                  
                  {log.image_url && (
                     <div className="mt-8 rounded-3xl overflow-hidden border border-white/5 max-w-sm group">
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
