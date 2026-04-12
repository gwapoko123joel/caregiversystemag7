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
        <div className="relative p-1 bg-gradient-to-r from-red-600 to-red-900 rounded-[32px] overflow-hidden group shadow-[0_0_40px_rgba(220,38,38,0.4)] animate-pulse">
           <div className="bg-brand-dark/90 backdrop-blur-md rounded-[28px] p-8 flex flex-col md:flex-row items-center gap-8 border border-white/10">
              <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center text-red-500 animate-bounce">
                 <ShieldAlert size={32} />
              </div>
              <div className="flex-1 space-y-4">
                 <div>
                    <h3 className="text-2xl font-black text-red-500 uppercase tracking-tighter italic leading-none">Critical Emergency Detected</h3>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">{criticalAlerts.length} nodes reporting clinical threshold breaches</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {criticalAlerts.slice(0, 4).map(a => (
                      <div key={a.id} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5 group/alert hover:border-red-500/30 transition-all">
                         <div>
                            <div className="text-xs font-black text-white uppercase">{a.patient_name}</div>
                            <div className="text-[10px] font-bold text-red-500/60 uppercase italic tracking-tighter mt-1">{a.vitals}</div>
                         </div>
                         <button 
                           onClick={() => initiateCall(undefined, a.patient_name)} 
                           className="p-2.5 bg-red-600 rounded-xl text-white hover:scale-110 active:scale-95 transition-all shadow-lg"
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
           { label: 'Network Roster', val: patientsCount, icon: Users, color: 'text-brand-neon-green', bg: 'bg-brand-neon-green/10', path: '/dashboard/practitioner/feed' },
           { label: 'Pending Response', val: alertCount, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10', path: '/dashboard/practitioner/alerts' },
           { label: 'Telemetry Flow', val: totalAlerts, icon: TrendingUp, color: 'text-brand-accent-green', bg: 'bg-brand-accent-green/10', path: '/dashboard/practitioner/history' },
         ].map((stat, i) => (
           <Link 
             key={i} 
             to={stat.path}
             className="p-8 bg-white/5 border border-white/5 rounded-[32px] flex items-center gap-6 group hover:border-white/10 transition-all text-left"
           >
              <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                 <stat.icon size={28} />
              </div>
              <div>
                 <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 leading-none">{stat.label}</div>
                 <div className="text-3xl font-black italic tracking-tighter text-white">{stat.val}</div>
              </div>
              <ChevronRight size={16} className="ml-auto text-gray-800 transition-transform group-hover:translate-x-1" />
           </Link>
         ))}
      </div>

      {/* ── NETWORK HEALTH SUMMARY ── */}
      <div className="bg-white/5 border border-white/5 rounded-[40px] p-12 overflow-hidden relative">
         <div className="absolute top-1/2 right-12 -translate-y-1/2 opacity-5 pointer-events-none">
            <Activity size={240} className="text-brand-neon-green" />
         </div>
         <div className="relative z-10 max-w-xl space-y-6">
            <h4 className="text-xs font-black text-brand-neon-green uppercase tracking-[0.3em]">Operational Readiness</h4>
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tight leading-tight">Barangay Bantayan Monitoring Hub</h2>
            <p className="text-sm font-medium text-gray-400 leading-relaxed">
               The regional network is currently processing synchronized telemetry from all deployed caregiver nodes. Ensure all critical threshold breaches are acknowledged and verified via secure consultation.
            </p>
            <div className="flex gap-4 pt-4">
               <Link to="/dashboard/practitioner/feed" className="px-8 py-4 bg-brand-neon-green text-brand-dark font-black uppercase text-[10px] tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-neon-green/20">
                  Access Live Feed
               </Link>
               <Link to="/dashboard/practitioner/alerts" className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all">
                  Open Alert Center
               </Link>
            </div>
         </div>
      </div>
    </div>
  )
}
