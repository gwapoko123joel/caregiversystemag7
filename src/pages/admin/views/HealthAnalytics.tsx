import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { Activity, Map, Users, Download } from 'lucide-react'

export default function HealthAnalytics() {
  const [healthData, setHealthData] = useState<any[]>([])

  useEffect(() => {
    const fetchHealthProfile = async () => {
      const { data } = await supabase.from('barangay_population_health').select('*')
      setHealthData(data || [])
    }
    fetchHealthProfile()
  }, [])

  const exportToCSV = () => {
    // 1. Define Headers
    const headers = ["Purok", "Patient Count", "Hypertension", "Diabetes", "Emergencies"];
    
    // 2. Format Data
    const rows = healthData.map(p => [
      p.location, 
      p.patient_count, 
      p.hypertension_cases, 
      p.diabetes_cases, 
      p.active_emergencies
    ]);
  
    // 3. Combine into one string
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
  
    // 4. Create the download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bantayan_Health_Report_${new Date().toLocaleDateString()}.csv`);
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* ── HEADER: POPULATION INTELLIGENCE ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shadow-[0_0_10px_#0ea5e9]" />
            <span className="text-[10px] font-semibold text-sky-500 uppercase tracking-[0.4em]">Analytics: Population Health</span>
          </div>
          <h2 className="text-4xl font-semibold text-slate-50 uppercase tracking-tighter leading-tight">
            Health <span className="text-sky-500">Profile</span>
          </h2>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-2 leading-relaxed">
            Barangay Bantayan Coordination Map • Dumaguete City Node
          </p>
        </div>
        
        <button 
          onClick={exportToCSV}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-50 rounded-2xl text-[10px] font-semibold uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2 shrink-0"
        >
          <Download size={16} /> Generate Monthly Report
        </button>
      </div>

      {/* ── SECTION 1: TOP HUD ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <AnalyticsHUD label="Total Population" value={healthData.reduce((acc, curr) => acc + (curr.patient_count || 0), 0)} sub="Synced Subjects" color="sky" />
         <AnalyticsHUD label="Active Emergencies" value={healthData.reduce((acc, curr) => acc + (curr.active_emergencies || 0), 0)} sub="Critical Triage" color="rose" />
         <AnalyticsHUD label="Disease Density" value="14.2" sub="Avg % per Purok" color="amber" unit="%" />
      </div>

      {/* ── SECTION 2: THE MAIN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        
        {/* LEFT: GEOGRAPHIC DISTRIBUTION (7/10) */}
        <div className="lg:col-span-7 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between mb-10">
             <div className="flex items-center gap-3">
                <Map className="text-sky-500" size={20} />
                <h3 className="text-sm font-semibold text-slate-50 uppercase tracking-tighter leading-tight">Purok-Level Distribution</h3>
             </div>
             <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/5 text-[9px] font-semibold text-slate-500 uppercase">
                Last Aggregate: Just Now
             </div>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pr-2 scrollbar-thin">
            {healthData.length === 0 ? (
              <div className="py-20 text-center opacity-30">
                 <Activity size={48} className="mx-auto mb-4" />
                 <p className="text-xs font-semibold uppercase leading-relaxed">No telemetry nodes found in registry</p>
              </div>
            ) : (
              healthData.map((purok) => (
                <div key={purok.location} className="p-6 bg-slate-950/40 border border-white/5 rounded-[32px] group hover:border-sky-500/30 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-6">
                     <div className="w-12 h-12 bg-white/5 rounded-2xl flex flex-col items-center justify-center border border-white/5">
                        <span className="text-[8px] font-semibold text-slate-600 uppercase">Purok</span>
                        <span className="text-sm font-bold text-slate-50">{purok.location?.match(/\d+/) || '?' }</span>
                     </div>
                     <div>
                        <h4 className="text-base font-semibold text-slate-50 uppercase tracking-tight">{purok.location || 'General Sector'}</h4>
                        <div className="flex items-center gap-4 mt-1.5">
                           <div className="flex items-center gap-1.5">
                              <Users size={10} className="text-slate-600" />
                              <span className="text-[9px] font-bold text-slate-500 uppercase">{purok.patient_count} Patients</span>
                           </div>
                           <div className="w-px h-2 bg-white/10" />
                           <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                              <span className="text-[9px] font-bold text-slate-500 uppercase">Active Monitoring</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-8">
                     <div className="text-center">
                        <p className="text-[8px] font-semibold text-rose-500 uppercase mb-1 leading-relaxed">Critical</p>
                        <p className={`text-sm font-bold ${purok.active_emergencies > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-700'}`}>
                          {purok.active_emergencies}
                        </p>
                     </div>
                     <div className="text-center">
                        <p className="text-[8px] font-semibold text-sky-500 uppercase mb-1 leading-relaxed">HTN</p>
                        <p className="text-sm font-bold text-slate-50 leading-relaxed">{purok.hypertension_cases}</p>
                     </div>
                     <div className="text-center">
                        <p className="text-[8px] font-semibold text-amber-500 uppercase mb-1 leading-relaxed">Diabetes</p>
                        <p className="text-sm font-bold text-slate-50 leading-relaxed">{purok.diabetes_cases || 0}</p>
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: COORDINATION FLOW (3/10) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
               <Activity className="text-emerald-500" size={20} />
               <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em] tracking-tighter leading-tight">Coordination Flow</h3>
            </div>

            <div className="space-y-6">
               <div className="bg-slate-950/50 p-6 rounded-3xl border border-white/5 group hover:border-emerald-500/30 transition-all">
                  <p className="text-[9px] font-semibold text-slate-600 uppercase tracking-widest mb-3 leading-relaxed">Avg. Response Time</p>
                  <div className="flex items-baseline gap-2">
                     <span className="text-3xl font-bold text-slate-50">12.4</span>
                     <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Minutes</span>
                  </div>
               </div>

               <div className="bg-slate-950/50 p-6 rounded-3xl border border-white/5 group hover:border-sky-500/30 transition-all">
                  <p className="text-[9px] font-semibold text-slate-600 uppercase tracking-widest mb-3 leading-relaxed">Reporting Frequency</p>
                  <div className="flex items-baseline gap-2">
                     <span className="text-3xl font-bold text-slate-50">42</span>
                     <span className="text-xs font-bold text-sky-500 uppercase tracking-widest">Logs / Day</span>
                  </div>
               </div>
            </div>

            <div className="mt-10 pt-6 border-t border-white/5 flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
               <span className="text-[9px] font-semibold text-emerald-500 uppercase tracking-widest">System Load: Optimal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── HELPER: ANALYTICS HUD ──
function AnalyticsHUD({ label, value, sub, color, unit }: any) {
  const colors: any = {
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  };

  return (
    <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[32px] shadow-xl hover:bg-slate-900/60 transition-all relative overflow-hidden group">
      <div className={`absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform ${colors[color].split(' ')[0]}`}>
         <Activity size={100} />
      </div>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em] mb-4 leading-relaxed">{label}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-4xl font-bold text-slate-50 tracking-tighter leading-tight">{value}{unit || ''}</h3>
      </div>
      <p className={`text-[9px] font-bold uppercase mt-2 tracking-widest ${colors[color].split(' ')[0]}`}>{sub}</p>
    </div>
  );
}
