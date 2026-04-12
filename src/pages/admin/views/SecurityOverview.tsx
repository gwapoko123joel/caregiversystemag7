import { ShieldCheck, Lock, Key, AlertTriangle } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import type { AdminDashboardContextType } from '../AdminDashboard'

export default function SecurityOverview() {
  const { users, logs } = useOutletContext<AdminDashboardContextType>()

  const authStats = {
    total: users.length,
    authorized: users.filter(u => u.status === 'authorized').length,
    pending: users.filter(u => u.status === 'pending').length,
    revoked: users.filter(u => u.status === 'revoked').length,
  }

  const securityEvents = logs.filter(l => 
    l.action === 'UPDATE_USER_STATUS' || 
    l.action === 'REISSUE_ACCESS_ID' || 
    l.action === 'AUTHORIZE_USER'
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-4">
      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
           <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-brand-neon-green/10 text-brand-neon-green rounded-2xl flex items-center justify-center">
                 <ShieldCheck size={24} />
              </div>
           </div>
           <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Active Nodes</div>
           <div className="text-3xl font-black tracking-tight">{authStats.authorized}</div>
        </div>
        <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
           <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-yellow-500/10 text-yellow-500 rounded-2xl flex items-center justify-center">
                 <AlertTriangle size={24} />
              </div>
           </div>
           <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Pending Approval</div>
           <div className="text-3xl font-black tracking-tight">{authStats.pending}</div>
        </div>
        <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
           <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center">
                 <Lock size={24} />
              </div>
           </div>
           <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Revoked Access</div>
           <div className="text-3xl font-black tracking-tight">{authStats.revoked}</div>
        </div>
        <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
           <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-brand-accent-green/10 text-brand-accent-green rounded-2xl flex items-center justify-center">
                 <Key size={24} />
              </div>
           </div>
           <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Security Events</div>
           <div className="text-3xl font-black tracking-tight">{securityEvents.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Policy Enforcement */}
        <div className="bg-white/5 border border-white/5 rounded-[32px] p-8">
           <h3 className="text-xl font-black text-white uppercase tracking-tight mb-6">Policy Enforcement</h3>
           <div className="space-y-4">
              <div className="p-4 bg-brand-neon-green/5 border border-brand-neon-green/20 rounded-2xl flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <ShieldCheck size={20} className="text-brand-neon-green" />
                    <div>
                       <div className="text-sm font-black text-white uppercase">Row Level Security (RLS)</div>
                       <div className="text-[10px] font-medium text-gray-400">Database tables isolated per tenant logic</div>
                    </div>
                 </div>
                 <span className="text-[10px] font-black text-brand-neon-green bg-brand-neon-green/10 px-2 py-1 rounded uppercase">Active</span>
              </div>
              <div className="p-4 bg-brand-neon-green/5 border border-brand-neon-green/20 rounded-2xl flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Lock size={20} className="text-brand-neon-green" />
                    <div>
                       <div className="text-sm font-black text-white uppercase">Strict Auth Hooks</div>
                       <div className="text-[10px] font-medium text-gray-400">Verifying session validity on all mutations</div>
                    </div>
                 </div>
                 <span className="text-[10px] font-black text-brand-neon-green bg-brand-neon-green/10 px-2 py-1 rounded uppercase">Enforced</span>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between opacity-70">
                 <div className="flex items-center gap-3">
                    <Key size={20} className="text-gray-400" />
                    <div>
                       <div className="text-sm font-black text-white uppercase">2FA Requirement</div>
                       <div className="text-[10px] font-medium text-gray-400">Enforce Multi-Factor for Administrators</div>
                    </div>
                 </div>
                 <span className="text-[10px] font-black text-gray-500 bg-white/10 px-2 py-1 rounded uppercase">Not Configured</span>
              </div>
           </div>
        </div>

        {/* Recent Security Activity */}
        <div className="bg-white/5 border border-white/5 rounded-[32px] p-8">
           <h3 className="text-xl font-black text-white uppercase tracking-tight mb-6">Recent Security Actions</h3>
           <div className="space-y-4">
              {securityEvents.slice(0, 5).map(event => (
                 <div key={event.log_id} className="flex gap-4 items-start p-4 bg-brand-dark/50 rounded-2xl border border-white/5">
                    <div className="w-8 h-8 rounded-xl bg-brand-dark flex items-center justify-center shrink-0 border border-white/10">
                       <ShieldCheck size={14} className={event.action === 'REISSUE_ACCESS_ID' ? 'text-brand-accent-green' : 'text-brand-neon-green'} />
                    </div>
                    <div>
                       <div className="text-xs font-black text-white uppercase">{event.action.replace(/_/g, ' ')}</div>
                       <div className="text-[10px] font-medium text-gray-500 mt-1">
                          Node: {typeof event.details === 'object' && event.details && 'target_user' in event.details ? String(event.details.target_user).slice(0, 8) : ''}...
                       </div>
                       <div className="text-[10px] font-bold text-gray-600 mt-2">{new Date(event.timestamp).toLocaleString()}</div>
                    </div>
                 </div>
              ))}
              {securityEvents.length === 0 && (
                 <div className="text-center py-8 text-[10px] font-black text-gray-500 uppercase tracking-widest">No recent security events</div>
              )}
           </div>
        </div>
      </div>
    </div>
  )
}
