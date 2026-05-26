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
        <div className="p-6 bg-card border border-card-border rounded-3xl shadow-sm dark:shadow-none transition-colors">
           <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-sky-500/10 text-sky-500 rounded-2xl flex items-center justify-center">
                 <ShieldCheck size={24} />
              </div>
           </div>
           <div className="text-[10px] font-semibold text-sidebar-text-muted uppercase tracking-widest mb-1 transition-colors">Active Nodes</div>
           <div className="text-3xl font-bold tracking-tight text-text-main transition-colors">{authStats.authorized}</div>
        </div>
        <div className="p-6 bg-card border border-card-border rounded-3xl shadow-sm dark:shadow-none transition-colors">
           <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
                 <AlertTriangle size={24} />
              </div>
           </div>
           <div className="text-[10px] font-semibold text-sidebar-text-muted uppercase tracking-widest mb-1 transition-colors">Pending Approval</div>
           <div className="text-3xl font-bold tracking-tight text-text-main transition-colors">{authStats.pending}</div>
        </div>
        <div className="p-6 bg-card border border-card-border rounded-3xl shadow-sm dark:shadow-none transition-colors">
           <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-sky-500/10 text-sky-500 rounded-2xl flex items-center justify-center">
                 <Lock size={24} />
              </div>
           </div>
           <div className="text-[10px] font-semibold text-sidebar-text-muted uppercase tracking-widest mb-1 transition-colors">Revoked Access</div>
           <div className="text-3xl font-bold tracking-tight text-text-main transition-colors">{authStats.revoked}</div>
        </div>
        <div className="p-6 bg-card border border-card-border rounded-3xl shadow-sm dark:shadow-none transition-colors">
           <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-sky-400/10 text-sky-400 rounded-2xl flex items-center justify-center">
                 <Key size={24} />
              </div>
           </div>
           <div className="text-[10px] font-semibold text-sidebar-text-muted uppercase tracking-widest mb-1 transition-colors">Security Events</div>
           <div className="text-3xl font-bold tracking-tight text-text-main transition-colors">{securityEvents.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Policy Enforcement */}
        <div className="bg-card border border-card-border rounded-[32px] p-8 shadow-sm dark:shadow-none transition-colors">
           <h3 className="text-xl font-semibold text-text-main uppercase mb-6 transition-colors tracking-tighter leading-tight">Policy Enforcement</h3>
           <div className="space-y-4">
              <div className="p-4 bg-sky-500/5 border border-sky-500/20 rounded-2xl flex items-center justify-between shadow-sm dark:shadow-none">
                 <div className="flex items-center gap-3">
                    <ShieldCheck size={20} className="text-sky-500" />
                    <div>
                       <div className="text-sm font-semibold text-text-main uppercase transition-colors">Row Level Security (RLS)</div>
                       <div className="text-[10px] font-medium text-sidebar-text-muted transition-colors">Database tables isolated per tenant logic</div>
                    </div>
                 </div>
                 <span className="text-[10px] font-semibold text-sky-500 bg-sky-500/10 px-2 py-1 rounded uppercase">Active</span>
              </div>
              <div className="p-4 bg-sky-500/5 border border-sky-500/20 rounded-2xl flex items-center justify-between shadow-sm dark:shadow-none">
                 <div className="flex items-center gap-3">
                    <Lock size={20} className="text-sky-500" />
                    <div>
                       <div className="text-sm font-semibold text-text-main uppercase transition-colors">Strict Auth Hooks</div>
                       <div className="text-[10px] font-medium text-sidebar-text-muted transition-colors">Verifying session validity on all mutations</div>
                    </div>
                 </div>
                 <span className="text-[10px] font-semibold text-sky-500 bg-sky-500/10 px-2 py-1 rounded uppercase">Enforced</span>
              </div>
              <div className="p-4 bg-card border border-card-border rounded-2xl flex items-center justify-between opacity-70 transition-colors shadow-sm dark:shadow-none">
                 <div className="flex items-center gap-3">
                    <Key size={20} className="text-sidebar-text-muted" />
                    <div>
                       <div className="text-sm font-semibold text-text-main uppercase transition-colors">2FA Requirement</div>
                       <div className="text-[10px] font-medium text-sidebar-text-muted transition-colors">Enforce Multi-Factor for Administrators</div>
                    </div>
                 </div>
                 <span className="text-[10px] font-semibold text-sidebar-text-muted bg-slate-100 dark:bg-white/10 px-2 py-1 rounded uppercase transition-colors">Not Configured</span>
              </div>
           </div>
        </div>

        {/* Recent Security Activity */}
        <div className="bg-card border border-card-border rounded-[32px] p-8 shadow-sm dark:shadow-none transition-colors">
           <h3 className="text-xl font-semibold text-text-main uppercase mb-6 transition-colors tracking-tighter leading-tight">Recent Security Actions</h3>
           <div className="space-y-4">
              {securityEvents.slice(0, 5).map(event => (
                 <div key={event.log_id} className="flex gap-4 items-start p-4 bg-card rounded-2xl border border-card-border transition-colors shadow-sm dark:shadow-none">
                    <div className="w-8 h-8 rounded-xl bg-card flex items-center justify-center shrink-0 border border-card-border transition-colors shadow-sm dark:shadow-none">
                       <ShieldCheck size={14} className={event.action === 'REISSUE_ACCESS_ID' ? 'text-sky-400' : 'text-sky-500'} />
                    </div>
                    <div>
                       <div className="text-xs font-semibold text-text-main uppercase transition-colors">{event.action.replace(/_/g, ' ')}</div>
                       <div className="text-[10px] font-medium text-sidebar-text-muted mt-1 transition-colors">
                          Node: {typeof event.details === 'object' && event.details && 'target_user' in event.details ? String(event.details.target_user).slice(0, 8) : ''}...
                       </div>
                       <div className="text-[10px] font-bold text-sidebar-text-muted/60 mt-2 transition-colors">{new Date(event.timestamp).toLocaleString()}</div>
                    </div>
                 </div>
              ))}
              {securityEvents.length === 0 && (
                 <div className="text-center py-8 text-[10px] font-semibold text-sidebar-text-muted uppercase tracking-widest transition-colors">No recent security events</div>
              )}
           </div>
        </div>
      </div>
    </div>
  )
}
