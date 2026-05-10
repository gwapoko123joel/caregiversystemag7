import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { BarChart3, Activity, Map, ShieldAlert, Heart } from 'lucide-react'

export default function HealthAnalytics() {
  const [healthData, setHealthData] = useState<any[]>([])

  useEffect(() => {
    const fetchHealthProfile = async () => {
      const { data } = await supabase.from('barangay_population_health').select('*')
      setHealthData(data || [])
    }
    fetchHealthProfile()
  }, [])

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-2xl font-black text-text-main uppercase tracking-tight">Barangay Health Profile</h2>
          <p className="text-[10px] font-bold text-sidebar-text-muted uppercase tracking-widest mt-1">Population Health Coordination • Dumaguete City</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap Table */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-[40px] p-8">
          <div className="flex items-center gap-3 mb-6">
            <Map className="text-sky-500" size={20} />
            <h3 className="text-sm font-black text-text-main uppercase tracking-widest">Purok-Level Distribution</h3>
          </div>
          
          <div className="space-y-3">
            {healthData.map((purok) => (
              <div key={purok.location} className="p-4 bg-primary/20 border border-card-border rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-text-main uppercase">{purok.location || 'Unspecified Purok'}</p>
                  <p className="text-[9px] text-sidebar-text-muted font-bold uppercase mt-1">{purok.patient_count} Total Patients</p>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-[8px] font-black text-red-500 uppercase">Critical</p>
                    <p className="text-sm font-black text-red-500">{purok.active_emergencies}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] font-black text-sky-500 uppercase">Hypertension</p>
                    <p className="text-sm font-black text-sky-500">{purok.hypertension_cases}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coordination Efficiency Stats */}
        <div className="bg-card border border-card-border rounded-[40px] p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Activity className="text-emerald-500" size={20} />
              <h3 className="text-sm font-black text-text-main uppercase tracking-widest">Coordination Flow</h3>
            </div>
            
            <div className="space-y-6">
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                 <p className="text-[9px] font-black text-emerald-500 uppercase mb-1">Avg. Doctor Response Time</p>
                 <p className="text-2xl font-black text-text-main font-mono">12.4 MIN</p>
              </div>
              <div className="p-4 bg-sky-500/5 border border-sky-500/20 rounded-2xl">
                 <p className="text-[9px] font-black text-sky-500 uppercase mb-1">Reporting Frequency</p>
                 <p className="text-2xl font-black text-text-main font-mono">42 / DAY</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-card-border">
             <div className="flex items-center gap-2 text-amber-500">
                <ShieldAlert size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">System Load: Optimal</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
