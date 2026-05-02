import { useState, useMemo } from 'react'
import { 
  ClipboardList, 
  Search, 
  Activity, 
  Heart, 
  Thermometer, 
  Zap, 
  Calendar,
  ChevronDown,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PatientMonitoringLog } from '../../../types/database'

interface HistoryViewProps {
  logs: PatientMonitoringLog[]
}

type ConditionFilter = 'all' | 'stable' | 'warning' | 'critical'
type SortOrder = 'newest' | 'oldest'

export default function HistoryView({ logs }: HistoryViewProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ConditionFilter>('all')
  const [sort, setSort] = useState<SortOrder>('newest')

  // Stats calculation
  const stats = useMemo(() => {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const thisWeek = logs.filter(l => new Date(l.recorded_at!) > oneWeekAgo).length
    const thisMonth = logs.filter(l => new Date(l.recorded_at!) > oneMonthAgo).length
    
    const lastUpdate = logs.length > 0 
      ? new Date(logs[0].recorded_at!).toLocaleString([], { hour: 'numeric', minute: 'numeric' })
      : 'N/A'

    return { total: logs.length, thisWeek, thisMonth, lastUpdate }
  }, [logs])

  // Filtering and Sorting
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch = log.notes?.toLowerCase().includes(search.toLowerCase()) || 
                             log.physical_status?.toLowerCase().includes(search.toLowerCase())
        const matchesFilter = filter === 'all' || log.physical_status === filter
        return matchesSearch && matchesFilter
      })
      .sort((a, b) => {
        const dateA = new Date(a.recorded_at!).getTime()
        const dateB = new Date(b.recorded_at!).getTime()
        return sort === 'newest' ? dateB - dateA : dateA - dateB
      })
  }, [logs, search, filter, sort])

  // Grouping by Date
  const groupedLogs = useMemo(() => {
    const groups: Record<string, PatientMonitoringLog[]> = {}
    filteredLogs.forEach(log => {
      const date = new Date(log.recorded_at!).toLocaleDateString(undefined, { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      })
      const today = new Date().toLocaleDateString(undefined, { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      })
      const yesterday = new Date(Date.now() - 86400000).toLocaleDateString(undefined, { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      })

      let groupKey = date
      if (date === today) groupKey = 'TODAY'
      else if (date === yesterday) groupKey = 'YESTERDAY'

      if (!groups[groupKey]) groups[groupKey] = []
      groups[groupKey].push(log)
    })
    return groups
  }, [filteredLogs])

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700 slide-in-from-bottom-4">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20">
             <ClipboardList size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-light text-text-main uppercase tracking-tight  leading-tight">Report History</h1>
            <p className="text-[10px] font-bold text-sidebar-text-muted uppercase tracking-[0.2em] mt-0.5 opacity-70">View all your submitted patient reports</p>
          </div>
        </div>
        
        <Link 
          to="/dashboard/caregiver/report"
          className="flex items-center gap-2 px-6 py-3 bg-sky-500 text-white rounded-xl text-[10px] font-light uppercase tracking-widest hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20 active:scale-95"
        >
          <Plus size={14} /> New Report
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', value: stats.total, icon: ClipboardList, color: 'sky' },
          { label: 'This Week', value: stats.thisWeek, icon: TrendingUp, color: 'emerald' },
          { label: 'This Month', value: stats.thisMonth, icon: Calendar, color: 'purple' },
          { label: 'Last Update', value: stats.lastUpdate, icon: Clock, color: 'amber' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-card-border rounded-2xl p-4 md:p-6 shadow-sm group hover:border-sky-500/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[8px] md:text-[9px] font-light text-sidebar-text-muted uppercase tracking-widest leading-none">{s.label}</p>
              <s.icon size={14} className={`text-${s.color}-500 opacity-50 group-hover:opacity-100 transition-opacity`} />
            </div>
            <p className="text-lg md:text-xl font-light text-text-main uppercase  leading-none">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-card border border-card-border rounded-[32px] p-4 md:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
             <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:text-sky-500 transition-colors" />
             <input 
               placeholder="Search reports or symptoms..."
               value={search}
               onChange={e => setSearch(e.target.value)}
               className="w-full bg-card border border-card-border rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-text-main focus:outline-none focus:border-sky-500/50 transition-all"
             />
          </div>
          <div className="relative min-w-[140px]">
             <select 
               value={sort}
               onChange={e => setSort(e.target.value as SortOrder)}
               className="w-full appearance-none bg-card border border-card-border rounded-2xl py-4 px-6 text-[10px] font-light uppercase tracking-widest text-text-main focus:outline-none focus:border-sky-500/50 transition-all cursor-pointer"
             >
               <option value="newest">Newest First</option>
               <option value="oldest">Oldest First</option>
             </select>
             <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Reports' },
            { id: 'stable', label: 'Stable' },
            { id: 'warning', label: 'Attention' },
            { id: 'critical', label: 'Critical' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as ConditionFilter)}
              className={`px-5 py-2.5 rounded-full text-[9px] font-light uppercase tracking-widest transition-all border ${
                filter === f.id 
                  ? 'bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-500/20' 
                  : 'bg-card text-sidebar-text-muted border-card-border hover:border-sidebar-text-muted/30'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-10">
        {Object.keys(groupedLogs).length === 0 ? (
          <div className="py-24 bg-card border border-card-border border-dashed rounded-[40px] flex flex-col items-center text-center space-y-6">
             <div className="w-20 h-20 bg-sky-500/5 rounded-full flex items-center justify-center text-sky-500/30">
                <ClipboardList size={40} />
             </div>
             <div className="space-y-2">
                <h3 className="text-lg font-light text-text-main uppercase ">No records found</h3>
                <p className="text-[10px] font-bold text-sidebar-text-muted uppercase tracking-widest max-w-xs leading-relaxed">
                  {search || filter !== 'all' 
                    ? "Try adjusting your search or filters to find what you're looking for." 
                    : "You haven't submitted any reports yet. Start by sending your first patient health update."}
                </p>
             </div>
             {(!search && filter === 'all') && (
               <Link 
                 to="/dashboard/caregiver/report"
                 className="px-8 py-4 bg-sky-500 text-white rounded-2xl text-xs font-light uppercase tracking-widest shadow-xl shadow-sky-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
               >
                 Submit First Report <ArrowRight size={16} />
               </Link>
             )}
          </div>
        ) : (
          Object.entries(groupedLogs).map(([group, logs]) => (
            <div key={group} className="space-y-4">
              <div className="flex items-center gap-4 px-2">
                <span className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-[0.3em] whitespace-nowrap">{group}</span>
                <div className="h-[1px] w-full bg-card-border opacity-50" />
              </div>

              <div className="grid gap-4">
                {logs.map(log => (
                  <div 
                    key={log.log_id} 
                    className="bg-card border border-card-border rounded-[32px] p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-center group hover:border-sky-500/30 transition-all shadow-sm"
                  >
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${
                            log.physical_status === 'stable' ? 'bg-emerald-500/10 text-emerald-500' :
                            log.physical_status === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {log.physical_status === 'stable' ? <CheckCircle2 size={18} /> : 
                             log.physical_status === 'warning' ? <AlertTriangle size={18} /> : <AlertCircle size={18} />}
                          </div>
                          <div>
                            <p className={`text-[11px] font-light uppercase tracking-tight leading-none ${
                              log.physical_status === 'stable' ? 'text-emerald-500' :
                              log.physical_status === 'warning' ? 'text-amber-500' : 'text-red-500'
                            }`}>
                              {log.physical_status === 'stable' ? 'Stable Condition' :
                               log.physical_status === 'warning' ? 'Needs Attention' : 'Critical Update'}
                            </p>
                            <p className="text-[9px] font-bold text-sidebar-text-muted uppercase tracking-widest mt-1">
                              ID: #{log.log_id.toString().slice(-4)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-light text-text-main  leading-none font-mono">
                            {new Date(log.recorded_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-[8px] font-light text-sidebar-text-muted uppercase tracking-widest mt-1 opacity-50">Local Node Time</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-card-border">
                        {[
                          { label: 'BP', val: log.vital_signs?.blood_pressure, icon: Activity, color: 'sky' },
                          { label: 'HR', val: log.vital_signs?.heart_rate, icon: Heart, color: 'red' },
                          { label: 'Temp', val: log.vital_signs?.temperature ? `${log.vital_signs.temperature}°C` : null, icon: Thermometer, color: 'amber' },
                          { label: 'O₂', val: log.vital_signs?.oxygen_saturation ? `${log.vital_signs.oxygen_saturation}%` : null, icon: Zap, color: 'sky' },
                        ].map(v => (
                          <div key={v.label} className="space-y-1">
                            <div className="flex items-center gap-1 opacity-50">
                              <v.icon size={10} className={`text-${v.color}-500`} />
                              <span className="text-[8px] font-black uppercase tracking-widest">{v.label}</span>
                            </div>
                            <p className="text-xs font-black text-text-main font-mono">{v.val || '—'}</p>
                          </div>
                        ))}
                      </div>

                      {log.notes && (
                        <div className="bg-sidebar-text-muted/5 rounded-2xl p-4 border border-card-border/50">
                           <p className="text-[11px] font-medium text-sidebar-text-muted italic leading-relaxed">
                             "{log.notes}"
                           </p>
                        </div>
                      )}
                    </div>

                    {log.image_url && (
                      <div className="w-full md:w-32 h-32 rounded-2xl overflow-hidden border border-card-border flex-shrink-0 group-hover:scale-[1.02] transition-transform">
                         <img src={log.image_url} alt="Patient Record" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
