import { useState } from 'react'
import { Search, Filter, User } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import type { AdminDashboardContextType } from '../AdminDashboard'
import type { ActivityLog } from '../../../types/database'

type LogFilter = 'all' | 'LOGIN' | 'LOGOUT' | 'REGISTER' | 'SUBMIT_REPORT' | 'ASSIGN_ACCESS_ID' | 'REISSUE_ACCESS_ID' | 'UPDATE_USER_STATUS' | 'AUTHORIZE_USER' | 'SOS_TRIGGERED' | 'VITALS_SUBMITTED' | 'CLINICAL_SIGN_OFF' | 'SOS_RESOLVED'

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
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 h-[calc(100vh-140px)] flex flex-col">
      
      {/* ── HEADER & SEARCH BAR ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shadow-[0_0_10px_#0ea5e9]" />
            <span className="text-[10px] font-black text-sky-500 uppercase tracking-[0.4em]">Governance: System Audit</span>
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
            Immutable <span className="text-sky-500">Activity Stream</span>
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
            Global Ledger • Encrypted Forensic Trace
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search by Action or Node ID..."
              className="w-full sm:w-80 bg-slate-900/60 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-700"
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <select 
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              className="p-3.5 bg-slate-900/40 border border-white/10 rounded-2xl text-slate-500 hover:text-sky-500 transition-all outline-none appearance-none cursor-pointer pr-10"
            >
              <option value="all">All Ops</option>
              <option value="LOGIN">Logins</option>
              <option value="SUBMIT_REPORT">Reports</option>
              <option value="SOS_TRIGGERED">SOS Alerts</option>
              <option value="VITALS_SUBMITTED">Clinical Vitals</option>
              <option value="CLINICAL_SIGN_OFF">Sign-Offs</option>
            </select>
            <Filter size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── AUDIT LEDGER CONTAINER ── */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] overflow-hidden flex flex-col shadow-2xl flex-1 min-h-0">
        
        {/* ── TABLE HEADER ── */}
        <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-white/5 bg-white/[0.02] text-[10px] font-black text-slate-500 uppercase tracking-widest">
          <div className="col-span-2">Timeline Index</div>
          <div className="col-span-3">Principal Identity</div>
          <div className="col-span-2 text-center">Action Token</div>
          <div className="col-span-5">Metadata analysis</div>
        </div>

        {/* ── SCROLLABLE TABLE BODY ── */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/5">
          <div className="divide-y divide-white/5">
            {filteredLogs.map((log) => (
              <div key={log.log_id} className="grid grid-cols-12 gap-4 px-8 py-5 hover:bg-white/[0.02] transition-colors group items-center">
                
                {/* 1. Timeline */}
                <div className="col-span-2 space-y-1">
                  <p className="text-xs font-mono font-bold text-white leading-none">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </p>
                </div>

                {/* 2. Identity */}
                <div className="col-span-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 border border-white/5 group-hover:text-sky-500 transition-colors">
                      <User size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-sky-500/80 font-bold truncate max-w-[120px]">
                        {log.user_id?.toUpperCase().slice(0, 8)}...
                      </p>
                      <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">{log.user_type} Authorized Session</p>
                    </div>
                  </div>
                </div>

                {/* 3. Action Badge */}
                <div className="col-span-2 flex justify-center">
                  <span className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border shadow-sm ${
                    log.action === 'SOS_TRIGGERED' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 animate-pulse' :
                    log.action === 'CLINICAL_SIGN_OFF' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                    'bg-white/5 border-white/10 text-slate-400'
                  }`}>
                    {log.action.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* 4. METADATA (Human Readable Formatting) */}
                <div className="col-span-5 flex flex-wrap gap-2">
                   {log.details && typeof log.details === 'object' ? (
                     Object.entries(log.details).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-1.5 px-2 py-1 bg-slate-950/50 border border-white/5 rounded-lg">
                         <span className="text-[7px] font-black text-slate-600 uppercase">{key}:</span>
                         <span className="text-[9px] font-bold text-slate-300 truncate max-w-[150px]">
                           {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                         </span>
                      </div>
                     ))
                   ) : (
                     <span className="text-[9px] text-slate-700 italic">No Trace Metadata</span>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
