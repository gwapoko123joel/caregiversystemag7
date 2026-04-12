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
          { label: 'Network Fleet', val: users.length, icon: Users, color: 'text-brand-neon-green', bg: 'bg-brand-neon-green/10', path: '/dashboard/admin/users' },
          { label: 'Active Reports', val: health.reportsToday, icon: Activity, color: 'text-brand-accent-green', bg: 'bg-brand-accent-green/10', path: '/dashboard/admin/health' },
          { label: 'Security Alerts', val: health.criticalAlerts, icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10', path: '/dashboard/admin/security' },
          { label: 'Uptime', val: health.serverUptime, icon: Server, color: 'text-brand-neon-green', bg: 'bg-brand-neon-green/10', path: '/dashboard/admin/health' },
        ].map(stat => (
          <Link to={stat.path} key={stat.label} className="p-6 bg-white/5 border border-white/5 rounded-3xl group hover:border-white/20 hover:bg-white/[0.07] transition-all block cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                <stat.icon size={24} />
              </div>
              <ArrowUpRight size={20} className="text-gray-700 group-hover:text-white transition-colors" />
            </div>
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{stat.label}</div>
            <div className="text-3xl font-black tracking-tight">{stat.val}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* New Authorizations */}
        <div className="bg-white/5 border border-white/5 rounded-[32px] overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <Zap size={18} className="text-brand-neon-green" />
               <h3 className="font-black uppercase text-xs tracking-widest">Recent Enrollments</h3>
            </div>
            <Link to="/dashboard/admin/users" className="text-[10px] font-black text-brand-neon-green hover:underline uppercase tracking-tighter">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] font-black text-gray-600 uppercase tracking-widest bg-white/[0.02]">
                  <th className="px-6 py-4">Personnel</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.slice(0, 5).map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm">{u.first_name} {u.last_name}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight bg-white/5 text-gray-400`}>{u.role}</span>
                    </td>
                    <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 text-xs font-bold ${
                          u.status === 'authorized' ? 'text-brand-neon-green/90 drop-shadow-[0_0_5px_rgba(57,255,20,0.8)]' : 
                          u.status === 'pending' ? 'text-yellow-500/90 drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]' : 
                          'text-red-500/90 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]'
                        }`}>
                           <div className={`w-1.5 h-1.5 rounded-full ${
                             u.status === 'authorized' ? 'bg-brand-neon-green shadow-[0_0_10px_rgba(57,255,20,0.8)]' : 
                             u.status === 'pending' ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)] animate-pulse' : 
                             'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
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
        <div className="bg-white/5 border border-white/5 rounded-[32px] overflow-hidden">
           <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <TrendingUp size={18} className="text-brand-accent-green" />
               <h3 className="font-black uppercase text-xs tracking-widest">Global Activity</h3>
            </div>
            <Link to="/dashboard/admin/logs" className="text-[10px] font-black text-brand-neon-green hover:underline uppercase tracking-tighter">View All</Link>
          </div>
          <div className="p-6 space-y-6">
             {logs.slice(0, 6).map((l: ActivityLog) => (
               <div key={l.log_id} className="flex gap-4 items-start group">
                  <div className={`mt-1 w-2 h-2 rounded-full border-2 bg-brand-dark transition-colors ${l.action === 'SUBMIT_REPORT' ? 'border-brand-neon-green ring-4 ring-brand-neon-green/10' : l.action === 'LOGIN' ? 'border-brand-accent-green ring-4 ring-brand-accent-green/10' : 'border-gray-700'}`} />
                  <div className="flex-1 space-y-1">
                     <div className="flex justify-between">
                        <span className="text-xs font-black uppercase text-gray-300 group-hover:text-white transition-colors">{l.action}</span>
                        <span className="text-[10px] font-bold text-gray-600">{new Date(l.timestamp).toLocaleTimeString([], { timeStyle: 'short' })}</span>
                     </div>
                     <div className="text-[10px] font-bold text-gray-500 font-mono">NODE IDENTIFIER: {l.user_id?.slice(0, 16).toUpperCase()}</div>
                  </div>
                  <MoreVertical size={14} className="text-gray-700" />
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  )
}
