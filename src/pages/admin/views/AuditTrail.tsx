import { useState } from 'react'
import { Search } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import type { AdminDashboardContextType } from '../AdminDashboard'
import type { ActivityLog } from '../../../types/database'

type LogFilter = 'all' | 'LOGIN' | 'LOGOUT' | 'REGISTER' | 'SUBMIT_REPORT' | 'ASSIGN_ACCESS_ID' | 'REISSUE_ACCESS_ID' | 'UPDATE_USER_STATUS' | 'AUTHORIZE_USER'

export default function AuditTrail() {
  const { logs } = useOutletContext<AdminDashboardContextType>()
  const [logSearch, setLogSearch] = useState('')
  const [logFilter, setLogFilter] = useState<LogFilter | string>('all')

  const filteredLogs = logs.filter((l: ActivityLog) => {
    const matchFilter = logFilter === 'all' || l.action === logFilter
    const q = logSearch.toLowerCase()
    const detailsStr = l.details ? JSON.stringify(l.details).toLowerCase() : ''
    const matchSearch = l.action.toLowerCase().includes(q) || detailsStr.includes(q) || l.user_id?.toLowerCase().includes(q) || l.user_type?.toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-500 slide-in-from-bottom-4">
      <div className="bg-card border border-card-border rounded-[32px] overflow-hidden shadow-sm dark:shadow-none transition-colors">
        <div className="p-6 md:p-8 border-b border-card-border flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card transition-colors">
          <div>
            <h3 className="text-lg md:text-xl font-black text-text-main uppercase tracking-tight transition-colors">System Audit Log</h3>
            <p className="text-[10px] font-bold text-sidebar-text-muted uppercase tracking-widest mt-1 transition-colors">Immutable Global Activity Stream</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
             <div className="relative group w-full md:min-w-[200px]">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:text-sky-500" />
                <input 
                  value={logSearch}
                  onChange={e => setLogSearch(e.target.value)}
                  className="w-full bg-card border border-card-border rounded-xl py-3.5 md:py-2 pl-10 pr-4 text-[10px] font-black text-text-main focus:outline-none uppercase tracking-widest placeholder:text-sidebar-text-muted/50 transition-colors shadow-sm dark:shadow-none" 
                  placeholder="SEARCH DETAILS..." 
                />
             </div>
             <select 
                value={logFilter} 
                onChange={e => setLogFilter(e.target.value)}
                className="w-full md:w-auto bg-card border border-card-border rounded-xl px-4 py-3.5 md:py-2 text-[10px] font-black uppercase text-sidebar-text-muted hover:text-text-main focus:outline-none appearance-none cursor-pointer transition-colors shadow-sm dark:shadow-none"
              >
                <option value="all" className="bg-card text-text-main">All Ops</option>
                <option value="LOGIN" className="bg-card text-text-main">Logins</option>
                <option value="SUBMIT_REPORT" className="bg-card text-text-main">Reports</option>
                <option value="ASSIGN_ACCESS_ID" className="bg-card text-text-main">Provision ID</option>
                <option value="REISSUE_ACCESS_ID" className="bg-card text-text-main">Reissue ID</option>
                <option value="UPDATE_USER_STATUS" className="bg-card text-text-main">User Status</option>
             </select>
          </div>
        </div>
        <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest bg-card transition-colors">
                  <th className="px-6 py-4">Timeline Index</th>
                  <th className="px-6 py-4">Principal Identity</th>
                  <th className="px-6 py-4">Action Token</th>
                  <th className="px-6 py-4">Metadata Analysis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border transition-colors">
                {filteredLogs.map((l: ActivityLog) => (
                  <tr key={l.log_id} className="hover:bg-card transition-colors">
                    <td className="px-6 py-4 font-mono text-[10px] text-sidebar-text-muted transition-colors">{new Date(l.timestamp).toLocaleDateString()} · {new Date(l.timestamp).toLocaleTimeString([], { timeStyle: 'medium' }).toUpperCase()}</td>
                    <td className="px-6 py-4">
                       <div className="text-xs font-black text-sky-500 dark:text-sky-400 uppercase transition-colors">{l.user_id?.slice(0, 8)}...</div>
                       <div className="text-[10px] font-bold text-sidebar-text-muted/60 tracking-tighter uppercase italic transition-colors">{l.user_type} SESSION</div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-[10px] font-black text-text-main px-2 py-1 bg-card rounded border border-card-border transition-colors">{l.action}</span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="text-[10px] font-medium font-mono text-sidebar-text-muted max-w-md truncate hover:whitespace-normal transition-all transition-colors">{JSON.stringify(l.details)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>

        {/* Mobile View (Cards) */}
        <div className="md:hidden divide-y divide-card-border">
           {filteredLogs.map((l: ActivityLog) => (
             <div key={l.log_id} className="p-6 transition-all active:bg-primary/20">
                <div className="flex items-start justify-between mb-4">
                   <div className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest">{new Date(l.timestamp).toLocaleString()}</div>
                   <span className="text-[10px] font-black text-brand-luminous-cyan px-2 py-1 bg-sky-500/10 rounded-lg border border-sky-500/20">{l.action}</span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                   <div className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-500 font-black text-[10px]">ID</div>
                   <div>
                      <div className="text-xs font-black text-text-main uppercase">{l.user_id?.slice(0, 12)}...</div>
                      <div className="text-[9px] font-bold text-sidebar-text-muted uppercase tracking-widest">{l.user_type} SESSION</div>
                   </div>
                </div>

                <div className="bg-primary/30 rounded-2xl p-4 border border-card-border">
                   <div className="text-[9px] font-black text-sidebar-text-muted uppercase tracking-[0.2em] mb-2">Payload Data:</div>
                   <div className="text-[10px] font-medium font-mono text-text-main leading-relaxed break-all whitespace-pre-wrap">{JSON.stringify(l.details, null, 2)}</div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  )
}
