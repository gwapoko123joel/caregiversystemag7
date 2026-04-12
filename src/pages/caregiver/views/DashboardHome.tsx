import { 
  User, 
  Calendar, 
  MapPin, 
  TrendingUp, 
  ChevronRight, 
  AlertTriangle 
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Patient, PatientMonitoringLog } from '../../../lib/supabaseClient'

interface DashboardHomeProps {
  patient: Patient | null
  loadingPatient: boolean
  recentLogs: PatientMonitoringLog[]
}

export default function DashboardHome({ patient, loadingPatient, recentLogs }: DashboardHomeProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
      {/* ── Patient Identity Card ── */}
      {loadingPatient ? (
        <div className="w-full h-48 bg-white/5 border border-white/5 rounded-[40px] flex items-center justify-center">
           <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-brand-neon-green/30 border-t-brand-neon-green rounded-full animate-spin" />
              <span className="text-[10px] font-black uppercase text-gray-600 tracking-widest">Accessing Patient Record...</span>
           </div>
        </div>
      ) : patient ? (
        <div className="group relative bg-[#1E1B4B]/30 border border-white/5 rounded-[40px] p-8 lg:p-12 overflow-hidden hover:border-brand-neon-green/30 transition-all duration-500">
           <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-brand-neon-green/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-brand-neon-green/20 transition-all" />
           
           <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
             <div className="flex items-start gap-8">
                <div className="relative">
                   <div className="w-24 h-24 bg-gradient-to-br from-brand-neon-green/20 to-brand-accent-green/20 rounded-[32px] border border-white/10 flex items-center justify-center shadow-2xl relative z-10 overflow-hidden">
                      <User size={40} className="text-brand-neon-green" />
                   </div>
                   <div className="absolute -inset-2 bg-brand-neon-green/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                </div>
                
                <div className="space-y-2">
                   <div className="flex items-center gap-3">
                      <h2 className="text-4xl font-black text-white tracking-tight leading-none">{patient.first_name} {patient.last_name}</h2>
                      <span className="px-3 py-1 rounded-full bg-brand-neon-green text-brand-dark text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(57,255,20,0.3)]">{patient.status}</span>
                   </div>
                   <div className="flex flex-wrap gap-4 pt-2">
                     <div className="flex items-center gap-2 text-gray-500">
                       <Calendar size={14} className="text-gray-700" />
                       <span className="text-xs font-bold uppercase tracking-tight">{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : '—'}</span>
                     </div>
                     <div className="flex items-center gap-2 text-gray-500">
                       <MapPin size={14} className="text-gray-700" />
                       <span className="text-xs font-bold uppercase tracking-tight">{patient.address}</span>
                     </div>
                   </div>
                </div>
             </div>

             <div className="flex lg:flex-col items-end gap-2 text-right">
                <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1 leading-none">Internal Case ID</div>
                <code className="text-2xl font-black text-brand-accent-green bg-brand-accent-green/5 px-4 py-2 rounded-2xl border border-brand-accent-green/10 italic tracking-tighter">PT-{patient.patient_id.toString().padStart(4, '0')}</code>
             </div>
           </div>
        </div>
      ) : (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-[40px] p-8 flex items-center gap-6 animate-pulse">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500">
            <AlertTriangle size={32} />
          </div>
          <div>
            <h4 className="text-lg font-black text-amber-500 uppercase tracking-tight">No Patient Assigned</h4>
            <p className="text-sm font-bold text-amber-500/60 uppercase tracking-widest mt-1 italic">Contact supervisor to link access credentials.</p>
          </div>
        </div>
      )}

      {/* ── Status Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Telemetry Flow Summary */}
        <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden">
          <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
             <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-brand-accent-green" />
                <h3 className="text-xs font-black uppercase text-white tracking-[0.2em] leading-none">Telemetry Flow</h3>
             </div>
             <Link to="/dashboard/caregiver/history" className="text-[9px] font-black text-gray-500 uppercase hover:text-white transition-colors">Full History</Link>
          </div>

          {recentLogs.length === 0 ? (
             <div className="p-16 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-gray-700 mb-4 italic">!</div>
                <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest">No Recent Telemetry Data</div>
             </div>
          ) : (
            <div className="divide-y divide-white/5">
              {recentLogs.map((log) => (
                 <div key={log.log_id} className="p-6 hover:bg-white/[0.02] transition-all group flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                       <div className="flex items-center justify-between">
                          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest font-mono">
                             IDX_{new Date(log.recorded_at!).getTime().toString().slice(-6)}
                          </div>
                          <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                             log.physical_status === 'stable' ? 'bg-brand-neon-green/5 text-brand-neon-green border-brand-neon-green/20' : 
                             log.physical_status === 'warning' ? 'bg-amber-500/5 text-amber-500 border-amber-500/20' : 'bg-red-500/5 text-red-500 border-red-500/20 animate-pulse'
                          }`}>
                             {log.physical_status}
                          </div>
                       </div>
                       <div className="flex items-end justify-between">
                          <div>
                             <div className="text-xl font-black text-white tracking-widest leading-none font-mono">
                                {new Date(log.recorded_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </div>
                             <div className="text-[9px] font-bold text-gray-600 uppercase mt-1 tracking-tighter">TIMESTAMP: {new Date(log.recorded_at!).toLocaleDateString()}</div>
                          </div>
                          <div className="text-right">
                             {log.vital_signs?.blood_pressure && (
                                <div className="text-xs font-black text-brand-accent-green leading-none">{log.vital_signs.blood_pressure} <span className="text-[8px] font-bold text-gray-700 ml-0.5 uppercase tracking-tighter">BP</span></div>
                             )}
                             {log.vital_signs?.heart_rate && (
                                <div className="text-xs font-black text-brand-neon-green mt-1 leading-none">{log.vital_signs.heart_rate} <span className="text-[8px] font-bold text-gray-700 ml-0.5 uppercase tracking-tighter">BPM</span></div>
                             )}
                          </div>
                       </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                 </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions / Summary */}
        <div className="p-12 bg-gradient-to-br from-[#1E1B4B]/30 to-brand-dark rounded-[40px] border border-white/5 flex flex-col justify-center">
           <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4 leading-none italic">Welcome Back</h3>
           <p className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-relaxed mb-8 max-w-[280px]">
             Ensure all clinical telemetry is synchronized before the next practitioner round.
           </p>
           <div className="space-y-4">
              <Link to="/dashboard/caregiver/report" className="flex items-center justify-between p-6 bg-brand-neon-green text-brand-dark rounded-3xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(57,255,20,0.3)]">
                 Submit New Report <ChevronRight size={16} />
              </Link>
           </div>
        </div>
      </div>
    </div>
  )
}
