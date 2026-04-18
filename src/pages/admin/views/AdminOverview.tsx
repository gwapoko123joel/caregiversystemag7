import { Users, Activity, ShieldAlert, Server, Zap, ArrowUpRight, TrendingUp, MoreVertical } from 'lucide-react'
import { useOutletContext, Link } from 'react-router-dom'
import type { AdminDashboardContextType } from '../AdminDashboard'
import type { ActivityLog } from '../../../lib/supabaseClient'

export default function AdminOverview() {
  const { users, logs, health } = useOutletContext<AdminDashboardContextType>()

  return (
    <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Network Fleet', val: users.length, icon: Users, color: 'text-sky-500', bg: 'bg-sky-500/10', path: '/dashboard/admin/users' },
          { label: 'Active Reports', val: health.reportsToday, icon: Activity, color: 'text-sky-400', bg: 'bg-sky-400/10', path: '/dashboard/admin/health' },
          { label: 'Security Alerts', val: health.criticalAlerts, icon: ShieldAlert, color: 'text-sky-500', bg: 'bg-sky-500/10', path: '/dashboard/admin/security' },
          { label: 'Uptime', val: health.serverUptime, icon: Server, color: 'text-sky-500', bg: 'bg-sky-500/10', path: '/dashboard/admin/health' },
        ].map(stat => (
          <Link to={stat.path} key={stat.label} className="p-6 bg-card border border-card-border rounded-3xl group hover:border-sky-500/20 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all block cursor-pointer shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center transition-all`}>
                <stat.icon size={24} />
              </div>
              <ArrowUpRight size={20} className="text-sidebar-text-muted/40 group-hover:text-text-main transition-colors" />
            </div>
            <div className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest mb-1 transition-colors">{stat.label}</div>
            <div className="text-3xl font-black tracking-tight text-text-main transition-colors">{stat.val}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* New Authorizations */}
        <div className="bg-card border border-card-border rounded-[32px] overflow-hidden shadow-sm dark:shadow-none transition-colors">
          <div className="p-6 border-b border-card-border flex items-center justify-between bg-card transition-colors">
            <div className="flex items-center gap-2">
               <Zap size={18} className="text-sky-500" />
               <h3 className="font-black uppercase text-xs tracking-widest text-text-main transition-colors">Recent Enrollments</h3>
            </div>
            <Link to="/dashboard/admin/users" className="text-[10px] font-black text-sky-500 hover:underline uppercase tracking-tighter">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest bg-card transition-colors">
                  <th className="px-6 py-4">Personnel</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border transition-colors">
                {users.slice(0, 5).map(u => (
                  <tr key={u.id} className="hover:bg-card transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm text-text-main transition-colors">{u.first_name} {u.last_name}</div>
                      <div className="text-xs text-sidebar-text-muted transition-colors">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight bg-slate-100/50 dark:bg-white/5 backdrop-blur-[8px] text-sidebar-text-muted transition-colors`}>{u.role.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 text-[10px] font-black transition-all ${
                          u.status === 'authorized' ? 'text-emerald-500' : 
                          u.status === 'pending' ? 'text-amber-500 animate-pulse' : 
                          'text-red-500'
                        }`}>
                           <div className={`w-1.5 h-1.5 rounded-full ${
                             u.status === 'authorized' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                             u.status === 'pending' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 
                             'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                           }`} />
                           <span className="uppercase tracking-widest">{u.status}</span>
                        </div>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Stream */}
        <div className="bg-card border border-card-border rounded-[32px] overflow-hidden shadow-sm dark:shadow-none transition-colors">
           <div className="p-6 border-b border-card-border flex items-center justify-between bg-card transition-colors">
            <div className="flex items-center gap-2">
               <TrendingUp size={18} className="text-sky-600" />
               <h3 className="font-black uppercase text-xs tracking-widest text-text-main transition-colors">Global Activity</h3>
            </div>
            <Link to="/dashboard/admin/logs" className="text-[10px] font-black text-sky-500 hover:underline uppercase tracking-tighter transition-colors">View All</Link>
          </div>
          <div className="p-6 space-y-6">
             {logs.slice(0, 6).map((l: ActivityLog) => (
               <div key={l.log_id} className="flex gap-4 items-start group">
                  <div className={`mt-1 w-2 h-2 rounded-full border-2 bg-primary transition-colors ${l.action === 'SUBMIT_REPORT' ? 'border-sky-500 ring-4 ring-sky-500/10' : l.action === 'LOGIN' ? 'border-sky-400 ring-4 ring-sky-400/10' : 'border-card-border'}`} />
                  <div className="flex-1 space-y-1">
                     <div className="flex justify-between">
                        <span className="text-xs font-black uppercase text-sidebar-text-muted group-hover:text-text-main transition-colors">{l.action.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] font-bold text-sidebar-text-muted/60 transition-colors">{new Date(l.timestamp).toLocaleTimeString([], { timeStyle: 'short' })}</span>
                     </div>
                     <div className="text-[10px] font-bold text-sidebar-text-muted/40 font-mono transition-colors uppercase tracking-tighter">NODE IDENTIFIER: {l.user_id?.slice(0, 16).toUpperCase()}</div>
                  </div>
                  <MoreVertical size={14} className="text-sidebar-text-muted/30 hover:text-text-main transition-colors cursor-pointer" />
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  )
}
