import { Cpu, Zap, Server, Database, Activity, ShieldCheck } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import type { AdminDashboardContextType } from '../AdminDashboard'

export default function SystemHealth() {
  const { health } = useOutletContext<AdminDashboardContextType>()

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* ── HEADER ── */}
      <div className="px-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Status: Operational</span>
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
          System <span className="text-sky-500">Infrastructure</span>
        </h2>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
          Core Delivery Pipeline • Global Operations Console
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        
        {/* ── LEFT: PIPELINE DIAGNOSTICS (7/10) ── */}
        <div className="lg:col-span-7 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl flex flex-col">
          <div className="flex items-center gap-3 mb-10">
             <div className="w-10 h-10 bg-sky-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                <Cpu size={20} />
             </div>
             <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Core Delivery Pipeline</h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Real-time Backend Node Synchronization</p>
             </div>
          </div>

          <div className="space-y-4">
            <PipelineRow 
              label="Database Cluster (Production-X)" 
              status="Online" 
              meta="92ms Global Latency" 
              icon={<Database size={16}/>} 
              color="emerald" 
            />
            <PipelineRow 
              label="Real-Time WebSocket Pub/Sub" 
              status="Active" 
              meta="12 Active Channels" 
              icon={<Activity size={16}/>} 
              color="sky" 
            />
            <PipelineRow 
              label="Media Streaming Node" 
              status="Ready" 
              meta="WebRTC Peer Gateway V2.4" 
              icon={<Server size={16}/>} 
              color="sky" 
            />
            <PipelineRow 
              label="Auth Policy Enforcement" 
              status="Strict" 
              meta="RLS Filter: Active" 
              icon={<ShieldCheck size={16}/>} 
              color="emerald" 
            />
          </div>

          <div className="mt-auto pt-10 flex items-center justify-between border-t border-white/5">
             <div className="flex items-center gap-4">
                <div className="text-center">
                   <p className="text-[8px] font-black text-slate-600 uppercase">Primary Region</p>
                   <p className="text-[10px] font-bold text-white uppercase">PH-Dumaguete-01</p>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="text-center">
                   <p className="text-[8px] font-black text-slate-600 uppercase">Provider</p>
                   <p className="text-[10px] font-bold text-white uppercase">Supabase Cloud</p>
                </div>
             </div>
             <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                Download Node Logs
             </button>
          </div>
        </div>

        {/* ── RIGHT: LIVE METRICS & HEALTH (3/10) ── */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* BIG STATUS HUD */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[40px] p-8 text-center shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
                <ShieldCheck size={120} />
             </div>
             <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4">System Node Health</p>
             <h4 className="text-4xl font-black text-white uppercase tracking-tighter">Optimal</h4>
             <p className="text-[10px] text-emerald-500/60 font-bold uppercase mt-2 tracking-widest">— Stable Core —</p>
          </div>

          {/* METRICS HUD */}
          <div className="bg-slate-900/40 border border-white/5 rounded-[40px] p-8 shadow-2xl space-y-8">
             <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-sky-500" />
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Live Metrics</h3>
             </div>

             <MetricBar label="Reporting Rate" value="Daily Total" count={health.reportsToday} percent={65} />
             <MetricBar label="Node Uptime" value={health.serverUptime} count="" percent={99} />
             
             <div className="pt-6 border-t border-white/5">
                <div className="flex items-center justify-between text-[9px] font-black text-slate-500 uppercase mb-4">
                   <span>Encryption Level</span>
                   <span className="text-sky-400">AES-256</span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                   {[1,2,3,4,5].map(i => <div key={i} className="h-1 bg-sky-500/40 rounded-full" />)}
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── HELPER: PIPELINE ROW ──
function PipelineRow({ label, status, meta, icon, color }: any) {
  const colors: any = {
    emerald: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10',
    sky: 'text-sky-500 border-sky-500/20 bg-sky-500/10'
  };

  return (
    <div className="flex items-center justify-between p-5 bg-slate-950/40 border border-white/5 rounded-3xl group hover:border-white/20 transition-all">
       <div className="flex items-center gap-4">
          <div className="p-3 bg-white/5 rounded-xl text-slate-500 group-hover:text-sky-500 transition-colors">
            {icon}
          </div>
          <div>
            <p className="text-[11px] font-black text-white uppercase tracking-tight">{label}</p>
            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">{meta}</p>
          </div>
       </div>
       <div className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${colors[color]}`}>
          {status}
       </div>
    </div>
  );
}

// ── HELPER: METRIC BAR ──
function MetricBar({ label, value, count, percent }: any) {
  return (
    <div className="space-y-3">
       <div className="flex justify-between items-end px-1">
          <p className="text-[9px] font-black text-slate-500 uppercase">{label}</p>
          <p className="text-[11px] font-black text-white uppercase">
            {count} <span className="text-[8px] text-slate-600 ml-1">{value}</span>
          </p>
       </div>
       <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-sky-500 shadow-[0_0_10px_#0ea5e9]" 
            style={{ width: `${percent}%` }}
          />
       </div>
    </div>
  );
}
