import { 
  Users, 
  Search, 
  Activity, 
  Image as ImageIcon, 
  ArrowUpRight 
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Patient, MonitoringLog } from '../PractitionerDashboard'

interface PatientFeedProps {
  patients: Patient[]
  loading: boolean
}

export default function PatientFeed({ patients, loading }: PatientFeedProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
      <div className="bg-card border border-card-border rounded-[32px] md:rounded-[40px] p-6 lg:p-12 shadow-sm dark:shadow-none transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8 mb-8 md:mb-12 transition-colors">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-luminous-cyan/10 rounded-xl flex items-center justify-center">
                 <Users size={20} className="text-brand-luminous-cyan" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-black text-text-main uppercase tracking-tight leading-none italic transition-colors">Patient Roster</h3>
                <p className="text-[10px] font-bold text-sidebar-text-muted uppercase tracking-widest mt-1 transition-colors">Live synchronized network roster</p>
              </div>
           </div>

           <div className="relative group w-full md:max-w-sm">
               <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:text-sky-500 transition-colors" />
               <input 
                 placeholder="SCAN PATIENT ROSTER..." 
                 className="w-full bg-card border border-card-border rounded-xl md:rounded-2xl py-4 md:py-3.5 pl-12 pr-4 text-[10px] md:text-xs font-semibold text-text-main focus:outline-none focus:border-sky-500/40 placeholder:text-sidebar-text-muted/50 tracking-wider transition-colors shadow-sm dark:shadow-none" 
               />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
           {loading ? (
              <div className="col-span-full py-20 flex flex-col items-center gap-4">
                 <div className="w-12 h-12 border-4 border-brand-luminous-cyan/30 border-t-brand-luminous-cyan rounded-full animate-spin" />
                 <span className="text-[10px] font-black uppercase text-sidebar-text-muted tracking-widest transition-colors">Accessing Node Telemetry Stream...</span>
              </div>
           ) : patients.length === 0 ? (
              <div className="col-span-full py-20 text-center">
                 <div className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest italic transition-colors">No patients registered in network.</div>
              </div>
           ) : (
              patients.map(p => {
                 const latestLog = p.patient_monitoring_logs?.[0] as MonitoringLog | undefined
                 return (
                    <Link 
                      key={p.patient_id} 
                      to={`/dashboard/practitioner/patient/${p.patient_id}`}
                      className="relative group bg-card border border-card-border rounded-[32px] overflow-hidden hover:border-sky-500/30 transition-all duration-500 cursor-pointer flex flex-col shadow-card-harmonized hover:shadow-harmonized dark:shadow-none"
                    >
                       <div className="h-40 bg-card border-b border-card-border relative overflow-hidden flex-shrink-0 transition-colors">
                          {latestLog?.image_url ? (
                            <img src={latestLog.image_url} alt="Thumbnail" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100" />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-sidebar-text-muted transition-colors">
                               <ImageIcon size={32} className="mb-2" />
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-card to-transparent flex items-end justify-between transition-colors">
                             <div className={`px-3 py-1 bg-card/90 backdrop-blur-md rounded-full border border-card-border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${latestLog?.physical_status === 'critical' ? 'node-urgent border-none px-3 py-1' : ''}`}>
                                <Activity size={10} className={latestLog?.physical_status === 'critical' ? 'text-current animate-pulse' : 'text-sky-500'} />
                                <span className={latestLog?.physical_status === 'critical' ? 'text-current' : 'text-text-main'}>{latestLog ? latestLog.physical_status : 'NO DATA'}</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="p-5 md:p-6 flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-4">
                             <div>
                                <h3 className="text-base md:text-lg font-black text-text-main italic tracking-tight leading-none transition-colors">{p.first_name} {p.last_name}</h3>
                                <div className="text-[8px] md:text-[9px] font-bold text-sidebar-text-muted uppercase tracking-widest mt-2 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">PT-{p.patient_id.toString().padStart(4, '0')}</div>
                             </div>
                             <div className="w-8 h-8 rounded-full border border-card-border flex items-center justify-center text-sidebar-text-muted group-hover:bg-sky-500 group-hover:text-white group-hover:border-transparent transition-all shadow-xl shadow-sky-500/10 active:scale-95">
                                <ArrowUpRight size={14} />
                             </div>
                          </div>
                          <div className="mt-auto space-y-2">
                             <div className="flex justify-between text-[9px] md:text-[10px] font-black uppercase tracking-widest border-t border-card-border pt-4 transition-colors">
                                <span className="text-sidebar-text-muted transition-colors">Last Sync</span>
                                <span className="text-text-main font-mono transition-colors">{latestLog ? new Date(latestLog.recorded_at).toLocaleTimeString([], {timeStyle:'short'}) : '—'}</span>
                             </div>
                          </div>
                       </div>
                    </Link>
                 )
              })
           )}
        </div>
      </div>
    </div>
  )
}
