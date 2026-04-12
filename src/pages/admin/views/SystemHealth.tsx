import { Cpu, Zap, Server } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import type { AdminDashboardContextType } from '../AdminDashboard'

export default function SystemHealth() {
  const { health } = useOutletContext<AdminDashboardContextType>()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500 slide-in-from-bottom-4">
      {/* Pipeline Status */}
      <div className="lg:col-span-2 space-y-8">
         <div className="bg-white/5 border border-white/5 rounded-[40px] p-8 lg:p-12">
           <h3 className="text-2xl font-black text-white mb-8 tracking-tight uppercase flex items-center gap-3">
              <Cpu size={24} className="text-brand-neon-green" /> Core Delivery Pipeline
           </h3>
           <div className="space-y-4">
              {[
                { l: 'Database Cluster (Production-X)', v: 'ONLINE', sub: '92ms Global Latency' },
                { l: 'Real-time WebSocket Pub/Sub', v: 'ACTIVE', sub: '12 active channels' },
                { l: 'Media Streaming Node', v: 'READY', sub: 'WebRTC Peer Gateway v2.4' },
                { l: 'Auth Policy Enforcement', v: 'STRICT', sub: 'RLS Filter: ACTIVE' },
              ].map(item => (
                <div key={item.l} className="p-6 bg-brand-dark/50 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-brand-neon-green/30 transition-all">
                   <div>
                      <div className="text-xs font-black text-gray-300 uppercase tracking-widest">{item.l}</div>
                      <div className="text-[10px] font-bold text-gray-600 uppercase mt-1 italic tracking-tight">{item.sub}</div>
                   </div>
                   <div className="px-4 py-1.5 bg-brand-neon-green/10 text-brand-neon-green border border-brand-neon-green/30 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(57,255,20,0.1)] group-hover:shadow-brand-neon-green/30 transition-all">
                      {item.v}
                   </div>
                </div>
              ))}
           </div>
         </div>
      </div>

      {/* Metrics Column */}
      <div className="space-y-8">
         <div className="bg-white/5 border border-white/5 rounded-[40px] p-10 flex flex-col h-full">
            <h3 className="text-lg font-black text-white mb-8 tracking-tight uppercase flex items-center gap-2">
               <Zap size={20} className="text-brand-accent-green" /> Live Metrics
            </h3>
            
            <div className="space-y-12">
               <div>
                  <div className="flex justify-between items-end mb-4">
                     <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Reporting Rate</div>
                     <div className="text-2xl font-black text-brand-neon-green italic">{health.reportsToday} <span className="text-[10px] font-bold text-gray-600 not-italic uppercase ml-1">Daily Total</span></div>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-brand-neon-green animate-pulse" style={{ width: '65%' }} />
                  </div>
               </div>

               <div>
                  <div className="flex justify-between items-end mb-4">
                     <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Node Uptime</div>
                     <div className="text-2xl font-black text-brand-accent-green italic">{health.serverUptime}</div>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-brand-accent-green" style={{ width: '99.98%' }} />
                  </div>
               </div>

               <div className="p-6 bg-brand-neon-green/5 border border-brand-neon-green/10 rounded-3xl mt-auto">
                  <div className="text-[10px] font-black text-brand-neon-green uppercase tracking-widest mb-2 flex items-center gap-2">
                     <Server size={14} /> System Node Health
                  </div>
                  <div className="text-[32px] font-black text-white leading-tight italic">OPTIMAL <span className="not-italic text-sm text-gray-500 uppercase ml-2 select-none">— NORMAL PARAMS</span></div>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}
