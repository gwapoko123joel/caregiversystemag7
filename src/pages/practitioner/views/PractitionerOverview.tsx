import { 
  Users, 
  Zap, 
  TrendingUp, 
  ShieldAlert, 
  Phone, 
  Activity, 
  ChevronRight 
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface AlertItem {
  id: number
  patient_name: string
  status: string
  time: string
  vitals: string
  dismissed: boolean
}

interface PractitionerOverviewProps {
  patientsCount: number
  alertCount: number
  totalAlerts: number
  criticalAlerts: AlertItem[]
  initiateCall: (caregiverName?: string, patientName?: string) => void
}

export default function PractitionerOverview({
  patientsCount,
  alertCount,
  totalAlerts,
  criticalAlerts,
  initiateCall
}: PractitionerOverviewProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
      {/* ── EMERGENCY BANNER ── */}
      {criticalAlerts.length > 0 && (
        <div className="relative p-1 bg-gradient-to-r from-sky-500/50 to-slate-900/50 rounded-[32px] overflow-hidden group shadow-[0_0_40px_rgba(0,229,255,0.2)] animate-pulse">
           <div className="bg-card/90 backdrop-blur-md rounded-[28px] p-8 flex flex-col md:flex-row items-center gap-8 border border-card-border">
              <div className="w-16 h-16 bg-sky-500/20 rounded-full flex items-center justify-center text-sky-500 animate-bounce">
                 <ShieldAlert size={32} />
              </div>
              <div className="flex-1 space-y-4">
                 <div>
                    <h3 className="text-2xl font-black text-sky-500 uppercase tracking-tighter italic leading-none">Critical Emergency Detected</h3>
                    <p className="text-xs font-bold text-sidebar-text-muted uppercase tracking-widest mt-2">{criticalAlerts.length} nodes reporting clinical threshold breaches</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {criticalAlerts.slice(0, 4).map(a => (
                      <div key={a.id} className="flex items-center justify-between bg-card p-4 rounded-2xl border border-card-border group/alert hover:border-sky-500/30 transition-all">
                         <div>
                            <div className="text-xs font-black text-text-main uppercase">{a.patient_name}</div>
                            <div className="text-[10px] font-bold text-sky-500/60 uppercase italic tracking-tighter mt-1">{a.vitals}</div>
                         </div>
                         <button 
                           onClick={() => initiateCall(undefined, a.patient_name)} 
                           className="p-2.5 bg-sky-500 rounded-xl text-white hover:scale-110 active:scale-95 transition-all shadow-lg"
                         >
                            <Phone size={14} className="fill-white" />
                         </button>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* ── STATS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { label: 'Network Roster', val: patientsCount, icon: Users, color: 'text-sky-500', bg: 'bg-sky-500/10', path: '/dashboard/practitioner/feed' },
           { label: 'Pending Response', val: alertCount, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10', path: '/dashboard/practitioner/alerts' },
           { label: 'Telemetry Flow', val: totalAlerts, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', path: '/dashboard/practitioner/history' },
         ].map((stat, i) => (
           <Link 
             key={i} 
             to={stat.path}
             className="p-8 bg-card border border-card-border rounded-[32px] flex items-center gap-6 group hover:border-sky-500/20 transition-all text-left shadow-sm dark:shadow-none"
           >
              <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                 <stat.icon size={28} />
              </div>
              <div>
                 <div className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest mb-1 leading-none">{stat.label}</div>
                 <div className="text-3xl font-black italic tracking-tighter text-text-main">{stat.val}</div>
              </div>
              <ChevronRight size={16} className="ml-auto text-sidebar-text-muted transition-transform group-hover:translate-x-1" />
           </Link>
         ))}
      </div>

      {/* ── NETWORK HEALTH SUMMARY ── */}
      <div className="bg-card border border-card-border rounded-[40px] p-12 overflow-hidden relative shadow-sm dark:shadow-none">
         <div className="absolute top-1/2 right-12 -translate-y-1/2 opacity-5 pointer-events-none">
            <Activity size={240} className="text-sky-500" />
         </div>
         <div className="relative z-10 max-w-xl space-y-6">
            <h4 className="text-xs font-black text-sky-500 uppercase tracking-[0.3em]">Operational Readiness</h4>
            <h2 className="text-4xl font-black text-text-main uppercase italic tracking-tight leading-tight">Barangay Bantayan Monitoring Hub</h2>
            <p className="text-sm font-medium text-sidebar-text-muted leading-relaxed">
               The regional network is currently processing synchronized telemetry from all deployed caregiver nodes. Ensure all critical threshold breaches are acknowledged and verified via secure consultation.
            </p>
            <div className="flex gap-4 pt-4">
               <Link to="/dashboard/practitioner/feed" className="px-8 py-4 bg-sky-500 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-sky-500/20">
                  Access Live Feed
               </Link>
               <Link to="/dashboard/practitioner/alerts" className="px-8 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-card-border text-text-main font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all">
                  Open Alert Center
               </Link>
            </div>
         </div>
      </div>
    </div>
  )
}
