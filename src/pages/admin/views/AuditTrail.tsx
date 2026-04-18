import { useState } from 'react'
import { Search } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import type { AdminDashboardContextType } from '../AdminDashboard'
import type { ActivityLog } from '../../../lib/supabaseClient'

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
        <div className="p-8 border-b border-card-border flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card transition-colors">
          <div>
            <h3 className="text-xl font-black text-text-main uppercase tracking-tight transition-colors">System Audit Log</h3>
            <p className="text-[10px] font-bold text-sidebar-text-muted uppercase tracking-widest mt-1 transition-colors">Immutable Global Activity Stream</p>
          </div>
          <div className="flex gap-4">
             <div className="relative group min-w-[200px]">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:text-sky-500" />
                <input 
                  value={logSearch}
                  onChange={e => setLogSearch(e.target.value)}
                  className="w-full bg-card border border-card-border rounded-xl py-2 pl-10 pr-4 text-[10px] font-black text-text-main focus:outline-none uppercase tracking-widest placeholder:text-sidebar-text-muted/50 transition-colors shadow-sm dark:shadow-none" 
                  placeholder="FILTER BY DETAILS..." 
                />
             </div>
             <select 
                value={logFilter} 
                onChange={e => setLogFilter(e.target.value)}
                className="bg-card border border-card-border rounded-xl px-4 py-2 text-[10px] font-black uppercase text-sidebar-text-muted hover:text-text-main focus:outline-none appearance-none cursor-pointer transition-colors shadow-sm dark:shadow-none"
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
        <div className="overflow-x-auto">
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
      </div>
    </div>
  )
}
