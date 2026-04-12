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
      <div className="bg-white/5 border border-white/5 rounded-[32px] overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">System Audit Log</h3>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Immutable Global Activity Stream</p>
          </div>
          <div className="flex gap-4">
             <div className="relative group min-w-[200px]">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-brand-neon-green" />
                <input 
                  value={logSearch}
                  onChange={e => setLogSearch(e.target.value)}
                  className="w-full bg-brand-dark border border-white/10 rounded-xl py-2 pl-10 pr-4 text-[10px] font-black text-white focus:outline-none uppercase tracking-widest placeholder:text-gray-700" 
                  placeholder="FILTER BY DETAILS..." 
                />
             </div>
             <select 
                value={logFilter} 
                onChange={e => setLogFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-gray-400 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="all" className="bg-brand-dark">All Ops</option>
                <option value="LOGIN" className="bg-brand-dark">Logins</option>
                <option value="SUBMIT_REPORT" className="bg-brand-dark">Reports</option>
                <option value="ASSIGN_ACCESS_ID" className="bg-brand-dark">Provision ID</option>
                <option value="REISSUE_ACCESS_ID" className="bg-brand-dark">Reissue ID</option>
                <option value="UPDATE_USER_STATUS" className="bg-brand-dark">User Status</option>
             </select>
          </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] font-black text-gray-600 uppercase tracking-widest bg-white/[0.01]">
                  <th className="px-6 py-4">Timeline Index</th>
                  <th className="px-6 py-4">Principal Identity</th>
                  <th className="px-6 py-4">Action Token</th>
                  <th className="px-6 py-4">Metadata Analysis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.map((l: ActivityLog) => (
                  <tr key={l.log_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono text-[10px] text-gray-500">{new Date(l.timestamp).toLocaleDateString()} · {new Date(l.timestamp).toLocaleTimeString([], { timeStyle: 'medium' }).toUpperCase()}</td>
                    <td className="px-6 py-4">
                       <div className="text-xs font-black text-brand-accent-green/80 uppercase">{l.user_id?.slice(0, 8)}...</div>
                       <div className="text-[10px] font-bold text-gray-600 tracking-tighter uppercase italic">{l.user_type} SESSION</div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-[10px] font-black text-white px-2 py-1 bg-white/5 rounded border border-white/5">{l.action}</span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="text-[10px] font-medium font-mono text-gray-500 max-w-md truncate hover:whitespace-normal transition-all">{JSON.stringify(l.details)}</div>
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
