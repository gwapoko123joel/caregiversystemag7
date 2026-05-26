import { useState, useEffect } from 'react'
import { 
  ArrowLeft, User, Activity, Calendar, 
  MapPin, Clock, AlertCircle,
  Loader2, ShieldCheck, TrendingUp, TrendingDown, Minus, ShieldAlert
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { calculateAge } from '../../../utils/medical'

interface PatientDetailsProps {
  patient: any
  onBack: () => void
}

export default function PatientDetails({ patient, onBack }: PatientDetailsProps) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPatientLogs()
  }, [patient.patient_id])

  async function fetchPatientLogs() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('patient_monitoring_logs')
        .select('*')
        .eq('patient_id', patient.patient_id)
        .order('recorded_at', { ascending: false })

      if (error) throw error
      setLogs(data || [])
    } catch (err) {
      console.error("Error fetching logs:", err)
    } finally {
      setLoading(false)
    }
  }

  // --- TREND CALCULATION LOGIC ---
  const getTrend = (key: string) => {
    if (logs.length < 2) return null;
    
    const current = logs[0].vital_signs[key];
    const previous = logs[1].vital_signs[key];

    if (key === 'blood_pressure') {
      const currSys = parseInt(current?.split('/')[0] || '0');
      const prevSys = parseInt(previous?.split('/')[0] || '0');
      if (currSys > prevSys + 5) return { type: 'up', color: 'text-rose-500', label: 'Rising', icon: <TrendingUp size={14} /> };
      if (currSys < prevSys - 5) return { type: 'down', color: 'text-emerald-500', label: 'Improving', icon: <TrendingDown size={14} /> };
      return { type: 'stable', color: 'text-sky-500', label: 'Stable', icon: <Minus size={14} /> };
    }

    const currVal = parseFloat(current || '0');
    const prevVal = parseFloat(previous || '0');

    if (key === 'oxygen_saturation') {
      if (currVal > prevVal) return { type: 'up', color: 'text-emerald-500', label: 'Improving', icon: <TrendingUp size={14} /> };
      if (currVal < prevVal) return { type: 'down', color: 'text-rose-500', label: 'Declining', icon: <TrendingDown size={14} /> };
    } else { // Heart Rate, Temp
      if (currVal > prevVal + 3) return { type: 'up', color: 'text-rose-500', label: 'Rising', icon: <TrendingUp size={14} /> };
      if (currVal < prevVal - 3) return { type: 'down', color: 'text-emerald-500', label: 'Lowering', icon: <TrendingDown size={14} /> };
    }
    return { type: 'stable', color: 'text-sky-500', label: 'Stable', icon: <Minus size={14} /> };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <Loader2 size={32} className="animate-spin mb-4 text-sky-500" />
        <p className="text-[10px] font-semibold uppercase tracking-widest leading-relaxed">Retrieving Clinical Dossier...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 px-4 md:px-0">
      
      {/* ── HEADER ── */}
      <div className="flex items-center gap-6 px-2">
        <button 
          onClick={onBack}
          className="p-4 bg-slate-900/40 border border-white/10 rounded-2xl text-slate-400 hover:text-sky-500 hover:border-sky-500/50 transition-all active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-4xl font-semibold text-slate-50 uppercase tracking-tighter leading-tight">
            Patient <span className="text-sky-500">Dossier</span>
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-2 leading-relaxed">
            Clinical History • Case ID: PT-{patient.patient_id.toString().padStart(4, '0')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        
        {/* ── LEFT COLUMN: SUBJECT PROFILE (3/10) ── */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <User size={120} />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-sky-500/10 rounded-full border-2 border-sky-500/20 flex items-center justify-center mb-6">
                <User size={48} className="text-sky-500" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-50 uppercase mb-1 tracking-tighter leading-tight">{patient.first_name} {patient.last_name}</h3>
              <p className="text-[9px] font-semibold text-sky-500 uppercase tracking-widest mb-8 leading-relaxed">{patient.gender || 'MALE'}</p>
              
              <div className="w-full space-y-3">
                 <ProfileDetail label="Date of Birth" value={patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'} icon={<Calendar size={12}/>} />
                 <ProfileDetail label="Current Age" value={calculateAge(patient.date_of_birth)} icon={<Activity size={12}/>} color="text-sky-400" />
                 <ProfileDetail label="Home Address" value={patient.address} icon={<MapPin size={12}/>} />
              </div>
            </div>
          </div>

          {/* ── NEW: EMERGENCY QUICK-SCAN ── */}
          <div className="bg-slate-950/50 rounded-3xl p-6 border border-rose-500/20 mb-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4 text-rose-500">
              <ShieldAlert size={16} />
              <span className="text-[10px] font-semibold uppercase tracking-widest">Emergency Metadata</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Blood Type</span>
                <span className="text-sm font-bold text-slate-50">{patient.blood_type || 'Unknown'}</span>
              </div>
              
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Known Allergies</span>
                <p className={`text-xs font-bold uppercase ${patient.allergies ? 'text-rose-400' : 'text-slate-400'}`}>
                  {patient.allergies || 'No known allergies'}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Emergency Contact</span>
                <p className="text-xs font-bold text-slate-50 uppercase leading-none">{patient.emergency_contact_name || 'N/A'}</p>
                <p className="text-[10px] font-mono text-sky-500 leading-relaxed">{patient.emergency_contact_phone || 'None'}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl">
            <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em] mb-4 tracking-tighter leading-tight">Medical Context</h3>
            <div className="p-4 bg-slate-950/50 border border-white/5 rounded-2xl">
               <p className="text-xs text-slate-300 leading-relaxed italic">"{patient.medical_history || patient.medical_conditions || 'No pre-existing conditions recorded.'}"</p>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: TELEMETRY STREAM (7/10) ── */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* TREND HUD */}
          {logs.length >= 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4 duration-1000">
              <TrendCard label="Systolic Trend" trend={getTrend('blood_pressure')} current={logs[0].vital_signs.blood_pressure} previous={logs[1].vital_signs.blood_pressure} />
              <TrendCard label="Oxygen Stability" trend={getTrend('oxygen_saturation')} current={`${logs[0].vital_signs.oxygen_saturation}%`} previous={`${logs[1].vital_signs.oxygen_saturation}%`} />
            </div>
          )}

          <div className="flex items-center gap-3 px-2">
             <div className="w-1.5 h-6 bg-sky-500 rounded-full" />
             <h3 className="text-sm font-semibold text-slate-50 uppercase tracking-[0.2em] tracking-tighter leading-tight">Clinical Observation Stream</h3>
             <div className="h-px flex-1 bg-white/5" />
             <span className="text-[10px] font-semibold text-slate-500 uppercase">{logs.length} Updates</span>
          </div>

          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-12 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5 text-slate-500">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-sm font-semibold text-slate-50 uppercase tracking-tighter leading-tight">No Monitoring Logs</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">There are no health logs recorded for this patient yet.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.log_id} className="group bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[32px] overflow-hidden hover:border-sky-500/30 transition-all shadow-xl">
                  <div className="p-6 md:p-8">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                          log.physical_status === 'critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 
                          log.physical_status === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 
                          'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                        }`}>
                          <Activity size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-50 uppercase tracking-tight">
                            {log.physical_status === 'stable' ? 'Stable Condition' : log.physical_status === 'warning' ? 'Observation Required' : 'Critical Update'}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 leading-relaxed">{new Date(log.recorded_at).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      {/* Status Indicator */}
                      {log.verified_by ? (
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 text-[8px] font-semibold uppercase">
                           <ShieldCheck size={12} /> Validated
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-slate-500 text-[8px] font-semibold uppercase">
                           <Clock size={12} /> Pending Review
                        </div>
                      )}
                    </div>

                    {/* Vitals Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <VitalsNode label="BP" value={log.vital_signs.blood_pressure} unit="mmHg" />
                      <VitalsNode label="Heart" value={log.vital_signs.heart_rate} unit="BPM" />
                      <VitalsNode label="Temp" value={log.vital_signs.temperature} unit="°C" />
                      <VitalsNode label="O2 Sat" value={`${log.vital_signs.oxygen_saturation}%`} unit="SpO2" color="text-sky-400" />
                    </div>

                    {/* Observations & Photos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                       <div className="space-y-3">
                          <p className="text-[9px] font-semibold text-slate-600 uppercase tracking-widest leading-relaxed">Caregiver Observations</p>
                          <div className="p-4 bg-slate-950/30 rounded-2xl border border-white/5">
                            <p className="text-xs text-slate-300 italic leading-relaxed">"{log.notes || 'No notes provided.'}"</p>
                          </div>
                       </div>
                       {log.image_url && (
                         <div className="space-y-3">
                            <p className="text-[9px] font-semibold text-slate-600 uppercase tracking-widest leading-relaxed">Visual Telemetry</p>
                            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 group/img">
                               <img src={supabase.storage.from('patient-photos').getPublicUrl(log.image_url).data.publicUrl} className="w-full h-full object-cover transition-transform group-hover/img:scale-105" />
                               <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="text-[8px] font-semibold text-slate-50 uppercase tracking-widest bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md">View Full Resolution</span>
                               </div>
                            </div>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── HELPER: PROFILE DETAIL ──
function ProfileDetail({ label, value, icon, color = "text-slate-50" }: any) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/5 text-left">
      <div className="text-slate-500">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[8px] font-semibold text-slate-600 uppercase tracking-widest truncate leading-relaxed">{label}</p>
        <p className={`text-[11px] font-bold uppercase truncate ${color}`}>{value || 'N/A'}</p>
      </div>
    </div>
  );
}

// ── HELPER: VITALS NODE ──
function VitalsNode({ label, value, unit, color = "text-slate-50" }: any) {
  return (
    <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
      <p className="text-[8px] font-semibold text-slate-600 uppercase tracking-tighter mb-1 leading-relaxed">{label}</p>
      <p className={`text-sm font-mono font-bold ${color}`}>{value}</p>
      <p className="text-[7px] font-bold text-slate-700 uppercase mt-1 leading-relaxed">{unit}</p>
    </div>
  );
}

// ── HELPER: TREND CARD ──
function TrendCard({ label, trend, current, previous }: any) {
  if(!trend) return null;
  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 p-6 rounded-[32px] flex items-center justify-between shadow-xl">
      <div>
        <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-1 leading-relaxed">{label}</p>
        <div className={`flex items-center gap-2 font-bold uppercase text-sm ${trend.color}`}>
          {trend.icon} {trend.label}
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-mono text-slate-50 font-bold leading-relaxed">{previous} → {current}</p>
        <p className="text-[8px] text-slate-600 font-bold uppercase tracking-tighter leading-relaxed">Last 2 Readings</p>
      </div>
    </div>
  );
}
