import { useState } from 'react'
import { 
  User, 
  Calendar, 
  MapPin, 
  Video, 
  ZoomIn, 
  Zap, 
  X,
  ChevronLeft
} from 'lucide-react'
import type { Patient, MonitoringLog } from '../PractitionerDashboard'
import { useNavigate } from 'react-router-dom'

interface PatientDossierProps {
  patient: Patient
  initiateCall: (caregiverName?: string, patientName?: string) => void
}

export default function PatientDossier({
  patient,
  initiateCall
}: PatientDossierProps) {
  const navigate = useNavigate()
  const [magnifiedImage, setMagnifiedImage] = useState<string | null>(null)

  return (
    <div className="animate-in slide-in-from-right-8 duration-500 space-y-6">
      {/* MAGNIFY LIGHTBOX */}
      {magnifiedImage && (
         <div className="fixed inset-0 z-[200] bg-brand-dark/95 backdrop-blur-xl flex justify-center items-center p-8 animate-in fade-in duration-300">
            <button onClick={() => setMagnifiedImage(null)} className="absolute top-8 right-8 w-12 h-12 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white transition-all border border-white/10">
               <X size={28} />
            </button>
            <div className="max-w-[90vw] max-h-[90vh] rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(57,255,20,0.15)] ring-1 ring-white/10">
               <img src={magnifiedImage} alt="Magnified Footage" className="w-full h-full object-contain" />
            </div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-brand-dark/80 backdrop-blur-md rounded-full border border-brand-neon-green/30 text-brand-neon-green text-xs font-black uppercase tracking-widest flex items-center gap-2">
               <Zap size={14} className="fill-brand-neon-green" /> Actual Node Footage
            </div>
         </div>
      )}

      <button 
         onClick={() => navigate(-1)}
         className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center gap-2 text-xs font-black uppercase transition-all w-fit group"
      >
         <ChevronLeft size={16} className="text-gray-500 group-hover:-translate-x-1 group-hover:text-white transition-all" /> 
         Return to Stream
      </button>

      <div className="bg-[#1e1b4b]/30 border border-brand-neon-green/20 rounded-[40px] p-8 lg:p-12 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-96 h-96 bg-brand-neon-green/5 blur-[100px] rounded-full pointer-events-none" />
         
         <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-8 relative z-10 mb-12">
            <div className="flex items-center gap-8">
               <div className="w-24 h-24 bg-gradient-to-br from-brand-neon-green/20 to-brand-purple/20 rounded-3xl border border-white/10 flex items-center justify-center shadow-2xl relative">
                  <User size={40} className="text-brand-neon-green" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand-neon-green rounded-full border-4 border-brand-dark" />
               </div>
               <div className="space-y-2">
                  <h2 className="text-4xl font-black text-white italic tracking-tight">{patient.first_name} {patient.last_name}</h2>
                  <div className="flex flex-wrap gap-4 pt-2">
                     <div className="flex items-center gap-2 text-gray-500 font-bold uppercase text-[10px] tracking-widest"><Calendar size={14} className="text-gray-700" /> {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : '—'}</div>
                     <div className="flex items-center gap-2 text-gray-500 font-bold uppercase text-[10px] tracking-widest"><MapPin size={14} className="text-gray-700" /> {patient.address}</div>
                  </div>
               </div>
            </div>
            <button 
               onClick={() => initiateCall(patient.patient_monitoring_logs?.[0]?.caregiver_name, `${patient.first_name} ${patient.last_name}`)}
               className="px-10 py-5 bg-brand-neon-green text-brand-dark font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-[0_0_30px_rgba(57,255,20,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
               <Video size={18} /> Initiate Remote Consult
            </button>
         </div>

         <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative z-10">
            
            {/* ── PHYSICAL GALLERY ── */}
            <div className="space-y-6">
               <div className="text-[10px] font-black text-brand-neon-green uppercase tracking-[0.3em] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-brand-neon-green rounded-full animate-pulse" />
                  Visual Health Inventory
               </div>
               <div className="bg-brand-dark/50 border border-white/5 rounded-[32px] p-8 grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {patient.patient_monitoring_logs.filter((l: MonitoringLog) => l.image_url).length === 0 ? (
                     <div className="col-span-full py-16 text-center text-[10px] font-black uppercase tracking-widest text-gray-700 italic border border-dashed border-white/5 rounded-2xl">No visual telemetry uploaded</div>
                  ) : (
                     patient.patient_monitoring_logs.filter((l: MonitoringLog) => l.image_url).map((log: MonitoringLog) => (
                        <div key={log.log_id} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group shadow-lg">
                           <img src={log.image_url!} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" alt="Patient state" />
                           <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button onClick={() => setMagnifiedImage(log.image_url)} className="p-4 bg-brand-neon-green text-brand-dark rounded-full shadow-[0_0_20px_rgba(57,255,20,0.5)] transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                 <ZoomIn size={18} />
                              </button>
                           </div>
                           <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-brand-dark/80 rounded border border-white/10 text-[8px] font-black text-brand-accent-green uppercase tracking-tighter">
                              {new Date(log.recorded_at).toLocaleDateString()}
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </div>

            {/* ── TELEMETRY TIMELINE ── */}
            <div className="space-y-6">
               <div className="text-[10px] font-black text-brand-accent-green uppercase tracking-[0.3em] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-brand-accent-green rounded-full animate-pulse" />
                  Clinical Protocol Stream
               </div>
               <div className="bg-brand-dark/50 border border-white/5 rounded-[32px] p-8 max-h-[500px] overflow-y-auto space-y-6 scrollbar-hide">
                  {(()=>{
                     const items: React.ReactNode[] = [];
                     const logs = patient.patient_monitoring_logs;
                     for(let i = 0; i < logs.length; i++) {
                        const currentLog = logs[i];
                        
                        // Check gap with previous log
                        if (i < logs.length - 1) {
                           const earlierLogDate = new Date(logs[i+1].recorded_at).getTime();
                           const currentLogDate = new Date(currentLog.recorded_at).getTime();
                           const hoursDiff = (currentLogDate - earlierLogDate) / (1000 * 60 * 60);
                           
                           if (hoursDiff > 6) {
                              items.push(
                                 <div key={`gap-${i}`} className="relative pl-8 py-4">
                                    <div className="absolute left-[11px] top-4 border-l-2 border-dashed border-red-500/30 h-full" />
                                    <div className="absolute left-[5px] top-1/2 w-4 h-4 bg-red-600/20 border-2 border-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse" />
                                    <div className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] pl-4 italic">CRITICAL GAP: ~{Math.round(hoursDiff)} HOURS MISSED REPORTING</div>
                                 </div>
                              );
                           }
                        }

                        items.push(
                           <div key={currentLog.log_id} className="relative pl-8 group">
                              <div className="absolute left-[11px] top-6 border-l-2 border-white/5 h-full group-last:hidden" />
                              <div className={`absolute left-[7px] top-2 w-2.5 h-2.5 rounded-full ring-4 ring-brand-dark z-10 ${currentLog.physical_status === 'critical' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-brand-neon-green shadow-[0_0_10px_rgba(57,255,20,0.5)]'}`} />
                              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                                 <div className="flex justify-between items-start mb-4">
                                    <div className="text-[10px] font-black text-brand-neon-green uppercase tracking-widest leading-none bg-brand-neon-green/5 px-2 py-1 rounded">
                                       {new Date(currentLog.recorded_at).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' }).toUpperCase()}
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${currentLog.physical_status === 'critical' ? 'bg-red-500/20 text-red-500 border-red-500/40' : 'bg-brand-neon-green/10 text-brand-neon-green border-brand-neon-green/20'}`}>
                                       {currentLog.physical_status}
                                    </span>
                                 </div>
                                 <div className="grid grid-cols-2 gap-4 text-[10px] uppercase font-black text-gray-600 tracking-widest border-t border-white/5 pt-4">
                                    <div>BP: <span className="text-white font-mono">{currentLog.vital_signs?.blood_pressure || '—'}</span></div>
                                    <div>HR: <span className="text-white font-mono">{currentLog.vital_signs?.heart_rate || '—'}</span></div>
                                 </div>
                                 {currentLog.notes && <div className="mt-4 text-[11px] text-gray-400 italic leading-relaxed border-l-2 border-white/5 pl-4 ml-1">"{currentLog.notes}"</div>}
                                 <div className="mt-6 flex items-center gap-2">
                                    <div className="w-5 h-5 bg-white/5 rounded-full flex items-center justify-center text-[8px] font-black">{currentLog.caregiver_name?.[0]}</div>
                                    <div className="text-[9px] font-black text-gray-700 uppercase tracking-widest italic">Node Assessor: {currentLog.caregiver_name}</div>
                                 </div>
                              </div>
                           </div>
                        );
                     }
                     if (items.length === 0) return <div className="text-center py-16 text-[10px] font-black uppercase tracking-widest text-gray-700 italic border border-dashed border-white/5 rounded-2xl">Protocol history empty</div>;
                     return items;
                  })()}
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}
