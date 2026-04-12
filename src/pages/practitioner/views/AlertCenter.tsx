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
      <div className="bg-white/5 border border-white/5 rounded-[40px] p-8 lg:p-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                 <Zap size={20} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none italic">Alert Inbox</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                  Active threshold breaches needing clinical review
                </p>
              </div>
           </div>

           <div className="flex items-center gap-6">
              <div className="px-4 py-2 bg-red-600/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                 <ShieldAlert size={14} className="text-red-500" />
                 <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{alertCount} Critical Alerts</span>
              </div>
              <div className="relative group max-w-xs flex-1 min-w-[200px]">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-brand-neon-green transition-colors" />
                  <input placeholder="SEARCH ALERTS..." className="w-full bg-brand-dark border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-[10px] font-black text-white focus:outline-none focus:border-brand-neon-green/40 placeholder:text-gray-700 tracking-widest" />
              </div>
           </div>
        </div>

        <div className="bg-brand-dark/30 border border-white/5 rounded-[32px] overflow-hidden">
           <table className="w-full">
              <thead>
                 <tr className="text-left text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] bg-white/[0.01]">
                    <th className="px-8 py-5">Severity Threshold</th>
                    <th className="px-8 py-5">Principal Identity</th>
                    <th className="px-8 py-5">Telemetry Payload</th>
                    <th className="px-8 py-5 text-right">Intervention</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                 {alerts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="text-[10px] font-black text-gray-700 uppercase tracking-widest italic">All systems clear. No active alerts.</div>
                      </td>
                    </tr>
                 ) : (
                    alerts.map(a => (
                       <tr key={a.id} className={`group hover:bg-white/[0.02] transition-all ${a.dismissed ? 'opacity-30' : ''}`}>
                          <td className="px-8 py-8">
                             <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${a.status === 'critical' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`} />
                                <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${a.status === 'critical' ? 'bg-red-600/10 text-red-500 border-red-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                   {a.status}
                                </span>
                             </div>
                          </td>
                          <td className="px-8 py-8">
                             <div className="text-sm font-black text-white italic tracking-tight">{a.patient_name}</div>
                             <div className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter mt-1">{a.time} NETWORK_EVENT</div>
                          </td>
                          <td className="px-8 py-8">
                             <div className="text-xs font-black text-brand-neon-green/80 font-mono tracking-tighter bg-white/5 px-4 py-2 rounded-xl border border-white/5 inline-block">{a.vitals}</div>
                          </td>
                          <td className="px-8 py-8 text-right">
                             {!a.dismissed ? (
                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button 
                                     onClick={() => initiateCall(undefined, a.patient_name)}
                                     className="p-3 bg-red-600 text-white rounded-xl hover:scale-110 active:scale-95 transition-all shadow-lg"
                                     title="Initiate Emergency Call"
                                   >
                                      <Phone size={14} className="fill-white" />
                                   </button>
                                   <button 
                                     onClick={() => dismissAlert(a.id)} 
                                     className="px-6 py-3 bg-brand-neon-green text-brand-dark text-[10px] font-black uppercase rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md"
                                   >
                                      Acknowledge
                                   </button>
                                </div>
                             ) : (
                                <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Acknowlegded</span>
                             )}
                          </td>
                       </tr>
                    ))
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  )
}
