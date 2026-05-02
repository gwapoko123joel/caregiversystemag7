import { 
  Zap, 
  Search, 
  Phone, 
  ShieldAlert 
} from 'lucide-react'

interface AlertItem {
  id: number
  patient_name: string
  status: string
  time: string
  vitals: string
  dismissed: boolean
}

interface AlertCenterProps {
  alerts: AlertItem[]
  alertCount: number
  dismissAlert: (id: number) => void
  initiateCall: (caregiverName?: string, patientName?: string) => void
}

export default function AlertCenter({ 
  alerts, 
  alertCount, 
  dismissAlert,
  initiateCall 
}: AlertCenterProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-right-4">
      <div className="bg-card border border-card-border rounded-[32px] md:rounded-[40px] p-6 lg:p-12 shadow-sm dark:shadow-none transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8 mb-8 md:mb-12 transition-colors">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                 <Zap size={20} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-light text-text-main uppercase tracking-[0.1em] leading-none transition-colors">Alert Inbox</h3>
                <p className="text-[10px] font-bold text-sidebar-text-muted uppercase tracking-widest mt-1 transition-colors">
                   Active threshold breaches
                </p>
              </div>
           </div>

           <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 w-full lg:w-auto">
              <div className="w-full sm:w-auto px-4 py-3 md:py-2 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-center gap-2">
                 <ShieldAlert size={14} className="text-sky-500" />
                 <span className="text-[10px] font-light text-sky-500 uppercase tracking-widest leading-none">{alertCount} Critical Alerts</span>
              </div>
              <div className="relative group w-full sm:max-w-xs md:min-w-[200px]">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:text-sky-500 transition-colors" />
                  <input placeholder="SEARCH ALERTS..." className="w-full bg-card border border-card-border rounded-2xl py-4 md:py-3 pl-10 pr-4 text-[10px] font-light text-text-main focus:outline-none focus:border-sky-500/40 placeholder:text-sidebar-text-muted/50 tracking-[0.2em] transition-colors shadow-sm dark:shadow-none" />
              </div>
           </div>
        </div>

        <div className="hidden md:block bg-card border border-card-border rounded-[32px] overflow-hidden shadow-sm dark:shadow-none transition-colors">
           <table className="w-full">
              <thead>
                 <tr className="text-left text-[10px] font-light text-sidebar-text-muted uppercase tracking-[0.2em] bg-card transition-colors">
                    <th className="px-8 py-5">Severity Threshold</th>
                    <th className="px-8 py-5">Principal Identity</th>
                    <th className="px-8 py-5">Telemetry Payload</th>
                    <th className="px-8 py-5 text-right">Intervention</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-card-border transition-colors">
                 {alerts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest transition-colors">All systems clear. No active alerts.</div>
                      </td>
                    </tr>
                 ) : (
                    alerts.map(a => (
                       <tr key={a.id} className={`group hover:bg-card/50 transition-all ${a.dismissed ? 'opacity-30' : ''}`}>
                          <td className="px-8 py-8">
                             <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${a.status === 'critical' ? 'bg-alert-text shadow-[0_0_10px_var(--color-alert-text)] animate-pulse' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`} />
                                <span className={`px-3 py-1 rounded text-[10px] font-light uppercase tracking-widest border transition-colors ${a.status === 'critical' ? 'node-urgent border-none shadow-none text-[10px]' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                   {a.status}
                                </span>
                             </div>
                          </td>
                          <td className="px-8 py-8">
                             <div className="text-sm font-light text-text-main tracking-tight transition-colors">{a.patient_name}</div>
                             <div className="text-[10px] font-bold text-sidebar-text-muted uppercase tracking-tighter mt-1 transition-colors">{a.time} NETWORK_EVENT</div>
                          </td>
                          <td className="px-8 py-8">
                             <div className="text-xs font-light text-sky-500/80 font-mono tracking-tighter bg-card px-4 py-2 rounded-xl border border-card-border inline-block transition-colors">{a.vitals}</div>
                          </td>
                          <td className="px-8 py-8 text-right">
                             {!a.dismissed ? (
                                <div className="flex justify-end gap-3 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                   <button 
                                     onClick={() => initiateCall(undefined, a.patient_name)}
                                     className="p-3 bg-alert-bg text-alert-text border border-alert-border shadow-[var(--shadow-harmonized)] rounded-xl hover:scale-110 active:scale-95 transition-all"
                                     title="Initiate Emergency Call"
                                   >
                                      <Phone size={14} className="fill-current text-current font-sans" />
                                   </button>
                                   <button 
                                     onClick={() => dismissAlert(a.id)} 
                                     className="px-6 py-3 bg-sky-500 text-white text-[10px] font-light uppercase rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[var(--shadow-harmonized)]"
                                   >
                                      Acknowledge
                                   </button>
                                </div>
                             ) : (
                                <span className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest transition-colors">Acknowledged</span>
                             )}
                          </td>
                       </tr>
                    ))
                 )}
              </tbody>
           </table>
        </div>

        {/* Mobile View (Cards) */}
        <div className="md:hidden space-y-4">
           {alerts.length === 0 ? (
              <div className="p-12 text-center bg-card border border-card-border rounded-3xl">
                 <div className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest">All systems clear.</div>
              </div>
           ) : (
              alerts.map(a => (
                 <div key={a.id} className={`bg-card border border-card-border rounded-[32px] p-6 shadow-sm transition-all active:scale-[0.98] ${a.dismissed ? 'opacity-40 grayscale-[0.5]' : ''}`}>
                    <div className="flex items-start justify-between mb-4">
                       <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${a.status === 'critical' ? 'bg-alert-text animate-pulse shadow-[0_0_8px_var(--color-alert-text)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                          <span className={`px-2 py-0.5 rounded text-[9px] font-light uppercase tracking-widest border transition-colors ${a.status === 'critical' ? 'bg-alert-bg border-alert-border text-alert-text' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                             {a.status}
                          </span>
                       </div>
                       <div className="text-[9px] font-bold text-sidebar-text-muted uppercase tracking-widest">{a.time}</div>
                    </div>

                    <div className="mb-6">
                       <div className="text-base font-light text-text-main tracking-tight">{a.patient_name}</div>
                       <div className="mt-3 p-3 bg-primary/40 rounded-2xl border border-card-border font-mono text-xs font-light text-sky-500/80">
                          {a.vitals}
                       </div>
                    </div>

                    {!a.dismissed ? (
                       <div className="flex gap-3 pt-4 border-t border-card-border">
                          <button 
                            onClick={() => initiateCall(undefined, a.patient_name)}
                            className="p-4 bg-alert-bg text-alert-text border border-alert-border rounded-2xl active:scale-90 transition-all flex items-center justify-center flex-1"
                          >
                             <Phone size={16} className="fill-current text-current" />
                          </button>
                          <button 
                            onClick={() => dismissAlert(a.id)} 
                            className="flex-[2] py-4 bg-sky-500 text-white text-[10px] font-light uppercase rounded-2xl active:scale-95 transition-all shadow-lg"
                          >
                             Acknowledge
                          </button>
                       </div>
                    ) : (
                       <div className="pt-4 border-t border-card-border text-center">
                          <span className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest">Acknowledged Event</span>
                       </div>
                    )}
                 </div>
              ))
           )}
        </div>
      </div>
    </div>
  )
}
