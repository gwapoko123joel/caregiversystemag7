import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from '../../../hooks/useAuth'
import { AlertCircle, ShieldAlert, ChevronRight, CheckCircle2, User } from 'lucide-react'

export default function AlertCenter() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          patient:patients (
            first_name,
            last_name
          )
        `)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAlerts(data || [])
    } catch (err: any) {
      console.error("Fetch Error:", err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
    // Real-time subscription to new alerts
    const channel = supabase.channel('live-alerts').on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'alerts' }, () => fetchAlerts()).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function resolveAlert(alertId: string, patientId: number) {
    const { error } = await supabase
      .from('alerts')
      .update({ 
        is_resolved: true, 
        resolved_at: new Date().toISOString(),
        resolved_by: user.id 
      })
      .eq('alert_id', alertId);

    if (!error) {
      // Go straight to the patient to give them orders!
      navigate(`/dashboard/practitioner/patient/${patientId}`);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-text-main uppercase tracking-tight">Clinical Threshold Inbox</h2>
          <p className="text-[10px] font-bold text-sidebar-text-muted uppercase tracking-widest mt-1">Active Priority Breaches</p>
        </div>
        <div className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest">
           {alerts.filter(a => a.severity === 'critical').length} CRITICAL ALERTS
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="p-12 text-center opacity-40">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-card border border-card-border rounded-[32px] p-12 text-center opacity-40">
             <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-500" />
             <p className="text-[10px] uppercase font-black tracking-widest">All systems clear. No active breaches.</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div key={alert.alert_id} className={`p-6 border rounded-[32px] flex items-center justify-between transition-all group ${
              alert.severity === 'critical' ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'
            }`}>
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  alert.severity === 'critical' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-amber-500 text-white'
                }`}>
                  <ShieldAlert size={28} className={alert.severity === 'critical' ? 'animate-pulse' : ''} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-text-main uppercase">
                    {alert.patient?.first_name} {alert.patient?.last_name}
                  </h4>
                  <p className={`text-[11px] font-medium mt-1 ${alert.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
                    {alert.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                 <div className="text-right">
                    <p className="text-[10px] font-black text-sidebar-text-muted uppercase">{new Date(alert.created_at).toLocaleTimeString()}</p>
                    <p className="text-[8px] font-bold text-sidebar-text-muted/50 uppercase mt-1">Telemetry breach</p>
                 </div>
                 <button 
                  onClick={() => resolveAlert(alert.alert_id, alert.patient_id)}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center gap-2"
                >
                  Intervene Now <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
