import { Cpu, Zap, Server } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import type { AdminDashboardContextType } from '../AdminDashboard'

export default function SystemHealth() {
  const { health } = useOutletContext<AdminDashboardContextType>()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500 slide-in-from-bottom-4">
      {/* Pipeline Status */}
      <div className="lg:col-span-2 space-y-8">
         <div className="bg-card border border-card-border rounded-[40px] p-8 lg:p-12 shadow-sm dark:shadow-none transition-colors">
           <h3 className="text-2xl font-black text-text-main mb-8 tracking-tight uppercase flex items-center gap-3 transition-colors">
              <Cpu size={24} className="text-sky-500" /> Core Delivery Pipeline
           </h3>
           <div className="space-y-4">
              {[
                { l: 'Database Cluster (Production-X)', v: 'ONLINE', sub: '92ms Global Latency' },
                { l: 'Real-time WebSocket Pub/Sub', v: 'ACTIVE', sub: '12 active channels' },
                { l: 'Media Streaming Node', v: 'READY', sub: 'WebRTC Peer Gateway v2.4' },
                { l: 'Auth Policy Enforcement', v: 'STRICT', sub: 'RLS Filter: ACTIVE' },
              ].map(item => (
                <div key={item.l} className="p-6 bg-card border border-card-border rounded-2xl flex items-center justify-between group hover:border-sky-500/30 transition-all shadow-sm dark:shadow-none">
                   <div>
                      <div className="text-xs font-black text-sidebar-text-muted uppercase tracking-widest transition-colors">{item.l}</div>
                      <div className="text-[10px] font-bold text-sidebar-text-muted/60 uppercase mt-1 italic tracking-tight transition-colors">{item.sub}</div>
                   </div>
                   <div className="px-4 py-1.5 bg-sky-500/10 text-sky-500 border border-sky-500/30 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(0,229,255,0.1)] group-hover:shadow-sky-500/30 transition-all">
                      {item.v}
                   </div>
                </div>
              ))}
           </div>
         </div>
      </div>

      {/* Metrics Column */}
      <div className="space-y-8">
         <div className="bg-card border border-card-border rounded-[40px] p-10 flex flex-col h-full shadow-sm dark:shadow-none transition-colors">
            <h3 className="text-lg font-black text-text-main mb-8 tracking-tight uppercase flex items-center gap-2 transition-colors">
               <Zap size={20} className="text-sky-400" /> Live Metrics
            </h3>
            
            <div className="space-y-12">
               <div>
                  <div className="flex justify-between items-end mb-4">
                     <div className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-[0.2em] transition-colors">Reporting Rate</div>
                     <div className="text-2xl font-black text-sky-500 italic">{health.reportsToday} <span className="text-[10px] font-bold text-sidebar-text-muted/60 not-italic uppercase ml-1 transition-colors">Daily Total</span></div>
                  </div>
                  <div className="w-full h-1.5 bg-card border border-card-border rounded-full overflow-hidden transition-colors">
                     <div className="h-full bg-sky-500 animate-pulse" style={{ width: '65%' }} />
                  </div>
               </div>

               <div>
                  <div className="flex justify-between items-end mb-4">
                     <div className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-[0.2em] transition-colors">Node Uptime</div>
                     <div className="text-2xl font-black text-sky-400 italic">{health.serverUptime}</div>
                  </div>
                  <div className="w-full h-1.5 bg-card border border-card-border rounded-full overflow-hidden transition-colors">
                     <div className="h-full bg-sky-400" style={{ width: '99.98%' }} />
                  </div>
               </div>

               <div className="p-6 bg-card border border-card-border rounded-3xl mt-auto shadow-sm dark:shadow-none transition-colors">
                  <div className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                     <Server size={14} /> System Node Health
                  </div>
                  <div className="text-[32px] font-black text-text-main leading-tight italic transition-colors">OPTIMAL <span className="not-italic text-sm text-sidebar-text-muted uppercase ml-2 select-none transition-colors">— NORMAL PARAMS</span></div>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}
