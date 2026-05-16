import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from '../../../hooks/useAuth'
import { ShieldAlert, ChevronRight, CheckCircle2 } from 'lucide-react'
import type { AlertItem } from '../types'

interface AlertCenterProps {
  alerts: AlertItem[]
  alertCount: number
  dismissAlert: (id: number) => void
  initiateCall: (caregiverName?: string, patientName?: string) => void
}

export default function AlertCenter({ alerts, alertCount, dismissAlert, initiateCall }: AlertCenterProps) {
  const { user } = useAuth()
  const navigate = useNavigate()

  async function resolveAlert(alertId: string | number, patientId: string | number) {
    if (!user) return;
    const { error } = await supabase
      .from('alerts')
      .update({ 
        is_resolved: true, 
        resolved_at: new Date().toISOString(),
        resolved_by: user.id 
      })
      .eq('alert_id', alertId);

    if (!error) {
      // 2. NEW: Reset Patient status to active now that the doctor has seen them
      await supabase.from('patients').update({ status: 'active' }).eq('patient_id', patientId);

      // Dismiss locally if needed
      dismissAlert(alertId);

      // Go straight to the patient to give them orders!
      navigate(`/dashboard/practitioner/patient/${patientId}`);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Clinical Threshold Inbox</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Active Priority Breaches</p>
        </div>
        <div className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest">
           {alertCount} ACTIVE ALERTS
        </div>
      </div>

      <div className="grid gap-4">
        {alerts.filter(a => !a.dismissed).length === 0 ? (
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-12 text-center opacity-40 shadow-2xl">
             <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-500" />
             <p className="text-[10px] uppercase font-black tracking-widest">All systems clear. No active breaches.</p>
          </div>
        ) : (
          alerts.filter(a => !a.dismissed).map(alert => (
            <div key={alert.id} className={`p-8 backdrop-blur-xl border border-white/5 rounded-[32px] flex items-center justify-between transition-all group shadow-2xl ${
              alert.status === 'critical' ? 'bg-rose-500/10' : 'bg-amber-500/10'
            }`}>
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  alert.status === 'critical' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-amber-500 text-white'
                }`}>
                  <ShieldAlert size={28} className={alert.status === 'critical' ? 'animate-pulse' : ''} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-text-main uppercase">
                    {alert.patient_name}
                  </h4>
                  <p className={`text-[11px] font-medium mt-1 ${alert.status === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
                    {alert.vitals}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                 <div className="text-right">
                    <p className="text-[10px] font-mono font-bold text-slate-500 uppercase">{alert.time}</p>
                    <p className="text-[8px] font-bold text-slate-500/50 uppercase mt-1 tracking-[0.2em]">Telemetry breach</p>
                 </div>
                 <div className="flex items-center gap-2">
                   <button 
                    onClick={() => initiateCall('Field Caregiver', alert.patient_name)}
                    className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                   >
                     Call
                   </button>
                   <button 
                    onClick={() => resolveAlert(alert.id, (alert as any).patient_id)}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center gap-2"
                  >
                    Intervene <ChevronRight size={16} />
                  </button>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
