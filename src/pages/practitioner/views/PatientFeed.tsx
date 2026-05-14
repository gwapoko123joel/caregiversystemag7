import { 
  Users, 
  Search, 
  Activity, 
  Image as ImageIcon, 
  ArrowUpRight,
  User,
  MapPin
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PatientWithLogs } from '../PractitionerDashboard'
import { SkeletonCard, EmptyState } from '../../../components/ClinicalPolish'

interface PatientFeedProps {
  patients: PatientWithLogs[]
  loading: boolean
}

export default function PatientFeed({ patients, loading }: PatientFeedProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
      <div className="bg-card border border-card-border rounded-[32px] md:rounded-[40px] p-6 lg:p-12 shadow-sm dark:shadow-none transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8 mb-8 md:mb-12 transition-colors">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center">
                 <Users size={20} className="text-sky-500" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-light text-text-main uppercase tracking-[0.1em] leading-none transition-colors">Patient Roster</h3>
                <p className="text-[10px] font-bold text-sidebar-text-muted uppercase tracking-widest mt-1 transition-colors">Live synchronized network roster</p>
              </div>
           </div>

           <div className="relative group w-full md:max-w-sm">
               <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:text-sky-500 transition-colors" />
               <input 
                 placeholder="SCAN PATIENT ROSTER..." 
                 className="w-full bg-card border border-card-border rounded-xl md:rounded-2xl py-4 md:py-3.5 pl-12 pr-4 text-[10px] md:text-xs font-light text-text-main focus:outline-none focus:border-sky-500/40 placeholder:text-sidebar-text-muted/50 tracking-[0.15em] transition-colors shadow-sm dark:shadow-none" 
               />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
           {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
           ) : patients.length === 0 ? (
              <div className="col-span-full">
                <EmptyState 
                  title="No Patients Synchronized"
                  message="The clinical node has not detected any active patient records in the monitoring fleet."
                  icon={Users}
                  onRetry={() => window.location.reload()}
                />
              </div>
           ) : (
              patients.map(p => {
                 const latestLog = p.patient_monitoring_logs?.[0]
                 return (
                    <Link 
                      key={p.patient_id} 
                      to={`/dashboard/practitioner/patient/${p.patient_id}`}
                      className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[32px] p-8 hover:border-sky-500/30 transition-all cursor-pointer group shadow-2xl block"
                    >
                      <div className="flex justify-between items-start mb-8">
                        <div className="w-14 h-14 bg-white/5 rounded-3xl flex items-center justify-center text-slate-500 group-hover:text-sky-500 transition-colors border border-white/5">
                          <User size={28} />
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          latestLog?.physical_status === 'critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                        }`}>
                          {latestLog?.physical_status || 'NO DATA'}
                        </div>
                      </div>

                      <h3 className="text-2xl font-black text-white uppercase tracking-tight">{p.first_name} {p.last_name}</h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1 mb-6">PT-ID: {p.patient_id.toString().padStart(4, '0')}</p>

                      <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase truncate pr-4">
                          <MapPin size={14} className="text-sky-500 flex-shrink-0" />
                          <span className="truncate">{p.address}</span>
                        </div>
                        <div className="text-right flex-shrink-0">
                           <p className="text-[8px] text-slate-600 font-black uppercase">Last Sync</p>
                           <p className="text-[10px] text-white font-mono">
                             {latestLog ? new Date(latestLog.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                           </p>
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
