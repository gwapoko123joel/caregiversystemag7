import { 
  Users, 
  Zap, 
  TrendingUp, 
  ShieldAlert, 
  Phone, 
  Activity, 
  ChevronRight,
  User
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'

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
  const [activePersonnel, setActivePersonnel] = useState<any[]>([]);

  const fetchActivePersonnel = async () => {
    const { data } = await supabase
      .from('caregivers')
      .select('id, full_name, duty_status, unique_access_id')
      .eq('role', 'caregiver')
      .eq('duty_status', 'on_duty'); // Only show BHWs who are currently working

    setActivePersonnel(data || []);
  };

  useEffect(() => {
    fetchActivePersonnel();

    // REAL-TIME: Listen for BHWs toggling their "On Duty" switch
    const channel = supabase
      .channel('active-fleet-monitor')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'caregivers' }, 
        () => fetchActivePersonnel()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
      {/* ── EMERGENCY BANNER ── */}
      {criticalAlerts.length > 0 && (
        <div className="relative p-1 bg-gradient-to-r from-sky-500/50 to-slate-900/50 rounded-[32px] overflow-hidden group shadow-[0_0_40px_rgba(0,229,255,0.2)] animate-pulse">
           <div className="bg-card/90 backdrop-blur-md rounded-[28px] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8 border border-card-border">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-sky-500/20 rounded-full flex items-center justify-center text-sky-500 animate-bounce">
                 <ShieldAlert size={24} className="md:w-8 md:h-8" />
              </div>
              <div className="flex-1 space-y-4 w-full">
                 <div className="text-center md:text-left">
                    <h3 className="text-lg md:text-2xl font-light text-sky-500 uppercase tracking-[0.1em] leading-none">Critical Emergency Detected</h3>
                    <p className="text-[10px] font-bold text-sidebar-text-muted uppercase tracking-widest mt-2">{criticalAlerts.length} nodes reporting breaches</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {criticalAlerts.slice(0, 4).map(a => (
                      <div key={a.id} className="flex items-center justify-between bg-card p-4 rounded-2xl border border-card-border group/alert hover:border-sky-500/30 transition-all shadow-sm">
                         <div>
                            <div className="text-xs font-light text-text-main uppercase">{a.patient_name}</div>
                            <div className="text-[10px] font-bold text-sky-500/60 uppercase tracking-tighter mt-1">{a.vitals}</div>
                         </div>
                         <button 
                           onClick={() => initiateCall(undefined, a.patient_name)} 
                           className="p-3 md:p-2.5 bg-sky-500 rounded-xl text-white active:scale-95 transition-all shadow-lg"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
         {[
           { label: 'Network Roster', val: patientsCount, icon: Users, color: 'text-sky-500', bg: 'bg-sky-500/10', path: '/dashboard/practitioner/feed' },
           { label: 'Pending Response', val: alertCount, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10', path: '/dashboard/practitioner/alerts' },
           { label: 'Telemetry Flow', val: totalAlerts, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', path: '/dashboard/practitioner/history' },
         ].map((stat, i) => (
           <Link 
             key={i} 
             to={stat.path}
             className="p-6 md:p-8 bg-card border border-card-border rounded-[24px] md:rounded-[32px] flex items-center gap-5 md:gap-6 group hover:border-sky-500/20 transition-all text-left shadow-sm active:scale-95"
           >
              <div className={`w-12 h-12 md:w-14 md:h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}>
                 <stat.icon size={24} className="md:w-7 md:h-7" />
              </div>
              <div className="flex-1 min-w-0">
                 <div className="text-[9px] md:text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest mb-1 leading-none truncate">{stat.label}</div>
                 <div className="text-2xl md:text-3xl font-light tracking-[0.1em] text-text-main">{stat.val}</div>
              </div>
              <ChevronRight size={16} className="text-sidebar-text-muted transition-transform group-hover:translate-x-1" />
           </Link>
         ))}
      </div>

      {/* ── NETWORK HEALTH SUMMARY ── */}
      <div className="bg-card border border-card-border rounded-[32px] md:rounded-[40px] p-8 md:p-12 overflow-hidden relative shadow-sm dark:shadow-none">
         <div className="absolute top-1/2 right-12 -translate-y-1/2 opacity-5 pointer-events-none hidden md:block">
            <Activity size={240} className="text-sky-500" />
         </div>
         <div className="relative z-10 max-w-xl space-y-4 md:space-y-6">
            <h4 className="text-[10px] md:text-xs font-light text-sky-500 uppercase tracking-[0.3em]">Operational Readiness</h4>
            <h2 className="text-2xl md:text-4xl font-light text-text-main uppercase tracking-[0.1em] leading-tight">Barangay Bantayan Monitoring Hub</h2>
            <p className="text-xs md:text-sm font-medium text-sidebar-text-muted leading-relaxed">
               The regional network is currently processing synchronized telemetry from all deployed caregiver nodes. Ensure all breaches are verified via secure consultation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
               <Link to="/dashboard/practitioner/feed" className="w-full sm:w-auto px-8 py-4 bg-sky-500 text-white font-light uppercase text-[10px] tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-sky-500/20 text-center">
                  Access Live Feed
               </Link>
               <Link to="/dashboard/practitioner/alerts" className="w-full sm:w-auto px-8 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-card-border text-text-main font-light uppercase text-[10px] tracking-widest rounded-2xl transition-all text-center">
                  Open Alert Center
               </Link>
            </div>
         </div>
      </div>

      {/* ── ACTIVE FIELD FLEET ── */}
      <div className="bg-card border border-card-border rounded-[32px] p-6 md:p-8 shadow-sm">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <div>
            <h3 className="text-[10px] md:text-xs font-black text-sidebar-text-muted uppercase tracking-[0.2em]">Active Field Fleet</h3>
            <p className="text-[8px] md:text-[10px] font-bold text-emerald-500 uppercase mt-0.5 tracking-widest">Live Personnel Presence</p>
          </div>
          <div className="bg-emerald-500/10 px-4 py-2 rounded-full text-[9px] md:text-[10px] font-black text-emerald-500 border border-emerald-500/20">
            {activePersonnel.length} NODES ONLINE
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activePersonnel.length === 0 ? (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-card-border rounded-3xl opacity-40">
              <p className="text-[10px] font-black uppercase tracking-widest text-sidebar-text-muted">No Caregivers Currently On-Duty</p>
            </div>
          ) : (
            activePersonnel.map((staff) => (
              <div key={staff.id} className="p-5 bg-primary/20 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-sky-500/30 transition-all shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full absolute -top-0.5 -right-0.5 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)] z-10" />
                    <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-500 border border-sky-500/20 transition-colors group-hover:bg-sky-500/20">
                      <User size={20} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-black text-text-main uppercase tracking-tight">{staff.full_name}</p>
                    <p className="text-[9px] font-bold text-sidebar-text-muted uppercase tracking-tighter mt-0.5">
                      ID: {staff.unique_access_id || 'FIELD-NODE'} • Status: Active
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
