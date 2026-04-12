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
      <div className="bg-white/5 border border-white/5 rounded-[40px] p-8 lg:p-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-neon-green/10 rounded-xl flex items-center justify-center">
                 <Users size={20} className="text-brand-neon-green" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none italic">Patient Roster</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Live synchronized network roster</p>
              </div>
           </div>

           <div className="relative group max-w-sm flex-1">
               <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-brand-neon-green transition-colors" />
               <input 
                 placeholder="SCAN PATIENT ROSTER..." 
                 className="w-full bg-brand-dark border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-semibold text-white focus:outline-none focus:border-brand-neon-green/40 placeholder:text-gray-700 tracking-wider" 
               />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
           {loading ? (
              <div className="col-span-full py-20 flex flex-col items-center gap-4">
                 <div className="w-12 h-12 border-4 border-brand-neon-green/30 border-t-brand-neon-green rounded-full animate-spin" />
                 <span className="text-[10px] font-black uppercase text-gray-600 tracking-widest">Accessing Node Telemetry Stream...</span>
              </div>
           ) : patients.length === 0 ? (
              <div className="col-span-full py-20 text-center">
                 <div className="text-[10px] font-black text-gray-700 uppercase tracking-widest italic">No patients registered in network.</div>
              </div>
           ) : (
              patients.map(p => {
                 const latestLog = p.patient_monitoring_logs?.[0] as MonitoringLog | undefined
                 return (
                    <Link 
                      key={p.patient_id} 
                      to={`/dashboard/practitioner/patient/${p.patient_id}`}
                      className="relative group bg-brand-dark/50 border border-white/5 rounded-[32px] overflow-hidden hover:border-brand-neon-green/30 transition-all duration-500 cursor-pointer flex flex-col"
                    >
                       <div className="h-40 bg-white/[0.02] border-b border-white/5 relative overflow-hidden flex-shrink-0">
                          {latestLog?.image_url ? (
                            <img src={latestLog.image_url} alt="Thumbnail" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100" />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-brand-purple/40">
                               <ImageIcon size={32} className="mb-2" />
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-brand-dark to-transparent flex items-end justify-between">
                             <div className="px-3 py-1 bg-brand-dark/80 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                <Activity size={10} className={latestLog?.physical_status === 'critical' ? 'text-red-500 animate-pulse' : 'text-brand-neon-green'} />
                                {latestLog ? latestLog.physical_status : 'NO DATA'}
                             </div>
                          </div>
                       </div>
                       
                       <div className="p-6 flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-4">
                             <div>
                                <h3 className="text-lg font-black text-white italic tracking-tight leading-none">{p.first_name} {p.last_name}</h3>
                                <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mt-2 group-hover:text-brand-neon-green/70 transition-colors">PT-{p.patient_id.toString().padStart(4, '0')}</div>
                             </div>
                             <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-500 group-hover:bg-brand-neon-green group-hover:text-brand-dark group-hover:border-transparent transition-all shadow-xl">
                                <ArrowUpRight size={14} />
                             </div>
                          </div>
                          <div className="mt-auto space-y-2">
                             <div className="flex justify-between text-[10px] font-black uppercase tracking-widest border-t border-white/5 pt-4">
                                <span className="text-gray-600">Last Check-in</span>
                                <span className="text-white font-mono">{latestLog ? new Date(latestLog.recorded_at).toLocaleTimeString([], {timeStyle:'short'}) : '—'}</span>
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
