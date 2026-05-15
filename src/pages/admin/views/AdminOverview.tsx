import { Users, Activity, ShieldAlert, Cpu, User, Clock, RefreshCw } from 'lucide-react'
import { useOutletContext, Link } from 'react-router-dom'
import type { AdminDashboardContextType } from '../AdminDashboard'
import type { ActivityLog } from '../../../types/database'
import { SkeletonCard, SkeletonRow, EmptyState } from '../../../components/ClinicalPolish'

export default function AdminOverview() {
  const { users, logs, health, performance, isLoading, error, loadData } = useOutletContext<AdminDashboardContextType>()

  const handleRetry = () => {
    loadData()
  }

  if (error) {
    return (
      <EmptyState 
        title="Sync Pipeline Error"
        message={`The administrative node failed to synchronize clinical data: ${error}`}
        onRetry={handleRetry}
        icon={RefreshCw}
      />
    )
  }

  const stats = {
    caregivers: users.length,
    reports: health.reportsToday,
    alerts: health.criticalAlerts
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* ── HEADER ── */}
      <div className="px-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shadow-[0_0_10px_#0ea5e9]" />
          <span className="text-[10px] font-black text-sky-500 uppercase tracking-[0.4em]">Node: Administrative Central</span>
        </div>
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
          System <span className="text-sky-500">Governance</span>
        </h2>
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-2">
          Barangay Bantayan Oversight • Security & Coordination Protocol
        </p>
      </div>

      {/* ── SECTION 1: GLOBAL HUD ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatItem label="Network Fleet" value={stats.caregivers} sub="Personnel Active" icon={<Users size={18}/>} color="sky" />
        <StatItem label="Active reports" value={stats.reports} sub="Telemetry Logs" icon={<Activity size={18}/>} color="emerald" />
        <StatItem label="Security Alerts" value={stats.alerts} sub="Breach Detection" icon={<ShieldAlert size={18}/>} color="rose" />
        <StatItem label="System Uptime" value="99.98%" sub="Node Stability" icon={<Cpu size={18}/>} color="sky" />
      </div>

      {/* ── SECTION 2: PERSONNEL NODE PERFORMANCE (PRIORITIZED TOP) ── */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-sky-500 rounded-full" />
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Personnel Node Performance</h3>
           </div>
           <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Live Efficiency Matrix</span>
        </div>
        
        {/* 4-Column Grid for high-density overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {performance.map(staff => (
            <div key={staff.caregiver_id} className="p-5 bg-slate-950/40 border border-white/5 rounded-[32px] hover:border-sky-500/30 transition-all group relative overflow-hidden">
              {/* Background Accent */}
              <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-10 transition-opacity">
                 <Activity size={60} />
              </div>

              <div className="flex justify-between items-start mb-5">
                 <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-slate-600 group-hover:text-sky-500 transition-colors">
                    <User size={18} />
                 </div>
                 <div className="bg-sky-500/10 text-sky-500 border border-sky-500/20 px-2.5 py-1 rounded-xl text-[9px] font-black tracking-tighter">
                    {staff.total_reports} LOGS
                 </div>
              </div>
              
              <p className="text-xs font-black text-white uppercase truncate">{staff.full_name}</p>
              <p className="text-[8px] font-bold text-slate-600 uppercase mt-1 tracking-widest">{staff.unique_access_id}</p>
              
              <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-1.5">
                    <Clock size={10} className="text-slate-700" />
                    <p className="text-[8px] text-slate-500 font-bold uppercase">
                      {staff.last_report_sent ? new Date(staff.last_report_sent).toLocaleDateString() : 'Inactive'}
                    </p>
                 </div>
                 <div className={`w-1.5 h-1.5 rounded-full ${staff.last_report_sent ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-800'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 3: THE LOWER HUB (60/40 Split) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* LEFT: ENROLLMENT (6 Spans) */}
        <div className="lg:col-span-6 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Recent Enrollments</h3>
             </div>
             <Link to="/dashboard/admin/users" className="text-[9px] font-black text-sky-500 uppercase tracking-[0.2em] hover:text-sky-400">Manage All →</Link>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
            {users.map(u => (
              <div key={u.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 border border-white/5 font-black uppercase">
                    {u.full_name?.[0]}
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase">{u.full_name}</p>
                    <p className="text-[9px] text-slate-600 font-medium">{u.email || 'Node Unregistered'}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase ${u.status === 'authorized' ? 'text-emerald-500' : 'text-amber-500'}`}>
                   <div className={`w-1 h-1 rounded-full ${u.status === 'authorized' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                   {u.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: GLOBAL ACTIVITY (4 Spans) */}
        <div className="lg:col-span-4 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl h-full">
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8">Global Activity</h3>
          <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2">
            {logs.map((log) => (
              <div key={log.log_id} className="relative pl-6 pb-6 border-l border-white/5 last:border-l-0">
                 <div className="absolute -left-[4.5px] top-0 w-2 h-2 rounded-full bg-slate-800 border border-sky-500/50" />
                 <div>
                    <div className="flex items-center justify-between">
                       <p className="text-[9px] font-black text-white uppercase tracking-tight">{log.action.replace('_', ' ')}</p>
                       <p className="text-[7px] font-bold text-slate-600 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</p>
                    </div>
                    <p className="text-[8px] text-slate-500 mt-1 uppercase tracking-tighter truncate opacity-70">
                      Audit ID: {log.user_id?.slice(-6)}
                    </p>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- HELPER COMPONENT: STAT ITEM ---
function StatItem({ label, value, sub, icon, color }: any) {
  const colors: any = {
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-6 rounded-[32px] flex flex-col justify-between h-36 shadow-xl hover:bg-slate-900/60 transition-all group">
      <div className="flex justify-between items-center">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
        <div className={`p-2 rounded-xl ${colors[color]}`}>{icon}</div>
      </div>
      <div>
        <h3 className="text-3xl font-black text-white tracking-tighter">{value}</h3>
        <p className="text-[8px] font-black text-slate-600 uppercase mt-1">{sub}</p>
      </div>
    </div>
  );
}

