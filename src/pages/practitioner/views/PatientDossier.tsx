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
         <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-xl flex justify-center items-center p-8 animate-in fade-in duration-300">
            <button onClick={() => setMagnifiedImage(null)} className="absolute top-8 right-8 w-12 h-12 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white transition-all border border-white/10">
               <X size={28} />
            </button>
            <div className="max-w-[90vw] max-h-[90vh] rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(0,229,255,0.15)] ring-1 ring-white/10">
               <img src={magnifiedImage} alt="Magnified Footage" className="w-full h-full object-contain" />
            </div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-slate-900/80 backdrop-blur-md rounded-full border border-sky-500/30 text-sky-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
               <Zap size={14} className="fill-sky-400" /> Actual Node Footage
            </div>
         </div>
      )}

      <button 
         onClick={() => navigate(-1)}
         className="px-6 py-3 bg-card hover:bg-card/80 border border-card-border rounded-xl flex items-center gap-2 text-xs font-black uppercase transition-all w-fit group shadow-sm dark:shadow-none"
      >
         <ChevronLeft size={16} className="text-sidebar-text-muted group-hover:-translate-x-1 group-hover:text-text-main transition-all" /> 
         <span className="text-text-main transition-colors">Return to Stream</span>
      </button>

      <div className="bg-card border border-card-border rounded-[40px] p-8 lg:p-12 relative overflow-hidden shadow-sm dark:shadow-none transition-colors">
         <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 blur-[100px] rounded-full pointer-events-none" />
         
         <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-8 relative z-10 mb-12">
            <div className="flex items-center gap-8">
               <div className="w-24 h-24 bg-gradient-to-br from-sky-500/10 to-slate-900/10 dark:from-sky-500/20 dark:to-slate-950/20 rounded-3xl border border-card-border flex items-center justify-center shadow-xl dark:shadow-2xl relative transition-colors">
                  <User size={40} className="text-sky-500 transition-colors" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-sky-500 rounded-full border-4 border-card transition-colors" />
               </div>
               <div className="space-y-2">
                  <h2 className="text-4xl font-black text-text-main italic tracking-tight transition-colors">{patient.first_name} {patient.last_name}</h2>
                  <div className="flex flex-wrap gap-4 pt-2">
                     <div className="flex items-center gap-2 text-sidebar-text-muted font-bold uppercase text-[10px] tracking-widest transition-colors"><Calendar size={14} className="text-sidebar-text-muted/50" /> {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : '—'}</div>
                     <div className="flex items-center gap-2 text-sidebar-text-muted font-bold uppercase text-[10px] tracking-widest transition-colors"><MapPin size={14} className="text-sidebar-text-muted/50" /> {patient.address}</div>
                  </div>
               </div>
            </div>
            <button 
               onClick={() => initiateCall(patient.patient_monitoring_logs?.[0]?.caregiver_name, `${patient.first_name} ${patient.last_name}`)}
               className="px-10 py-5 node-urgent font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-[var(--shadow-harmonized)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
               <Video size={18} /> Initiate Remote Consult
            </button>
         </div>

         <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative z-10">
            
            {/* ── PHYSICAL GALLERY ── */}
            <div className="space-y-6">
               <div className="text-[10px] font-black text-sky-500 uppercase tracking-[0.3em] flex items-center gap-2 transition-colors">
                  <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse transition-colors" />
                  Visual Health Inventory
               </div>
               <div className="bg-card border border-card-border rounded-[32px] p-8 grid grid-cols-2 lg:grid-cols-3 gap-4 shadow-sm dark:shadow-none transition-colors">
                  {patient.patient_monitoring_logs.filter((l: MonitoringLog) => l.image_url).length === 0 ? (
                     <div className="col-span-full py-16 text-center text-[10px] font-black uppercase tracking-widest text-sidebar-text-muted italic border border-dashed border-card-border rounded-2xl transition-colors">No visual telemetry uploaded</div>
                  ) : (
                     patient.patient_monitoring_logs.filter((l: MonitoringLog) => l.image_url).map((log: MonitoringLog) => (
                        <div key={log.log_id} className="relative aspect-square rounded-2xl overflow-hidden border border-card-border group shadow-lg transition-colors">
                           <img src={log.image_url!} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" alt="Patient state" />
                           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button onClick={() => setMagnifiedImage(log.image_url)} className="p-4 bg-sky-500 text-white rounded-full shadow-[0_0_20px_rgba(0,229,255,0.5)] transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                 <ZoomIn size={18} />
                              </button>
                           </div>
                           <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-card/80 rounded border border-card-border text-[8px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-tighter transition-colors">
                              {new Date(log.recorded_at).toLocaleDateString()}
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </div>

            {/* ── TELEMETRY TIMELINE ── */}
            <div className="space-y-6">
               <div className="text-[10px] font-black text-sky-500 uppercase tracking-[0.3em] flex items-center gap-2 transition-colors">
                  <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse transition-colors" />
                  Clinical Protocol Stream
               </div>
               <div className="bg-card border border-card-border rounded-[32px] p-8 max-h-[500px] overflow-y-auto space-y-6 scrollbar-hide shadow-sm dark:shadow-none transition-colors">
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
                                     <div className="absolute left-[11px] top-4 border-l-2 border-dashed border-red-500/30 dark:border-sky-500/30 h-full transition-colors" />
                                     <div className="absolute left-[5px] top-1/2 w-4 h-4 bg-red-500/20 dark:bg-sky-500/20 border-2 border-red-500 dark:border-sky-500 rounded-full shadow-[0_0_100px_rgba(239,68,68,0.3)] animate-pulse transition-colors" />
                                     <div className="text-[10px] font-black text-red-500 dark:text-sky-400 uppercase tracking-[0.2em] pl-4 italic transition-colors">CRITICAL GAP: ~{Math.round(hoursDiff)} HOURS MISSED REPORTING</div>
                                  </div>
                               );
                           }
                        }

                        items.push(
                           <div key={currentLog.log_id} className="relative pl-8 group">
                              <div className="absolute left-[11px] top-6 border-l-2 border-card-border h-full group-last:hidden transition-colors" />
                              <div className={`absolute left-[7px] top-2 w-2.5 h-2.5 rounded-full ring-4 ring-card z-10 transition-all ${currentLog.physical_status === 'critical' ? 'bg-alert-text shadow-[0_0_10px_var(--color-alert-text)]' : 'bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]'}`} />
                              <div className="bg-card border border-card-border rounded-2xl p-6 hover:border-sky-500/20 transition-colors shadow-sm dark:shadow-none">
                                 <div className="flex justify-between items-start mb-4">
                                    <div className="text-[10px] font-black text-text-main uppercase tracking-widest leading-none bg-card px-2 py-1 rounded border border-card-border transition-colors">
                                       {new Date(currentLog.recorded_at).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' }).toUpperCase()}
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border transition-colors ${currentLog.physical_status === 'critical' ? 'node-urgent text-[8px] px-2 py-0.5' : 'bg-success-bg text-success-text border-success-border font-black uppercase tracking-[0.2em] shadow-[var(--shadow-harmonized)]'}`}>
                                       {currentLog.physical_status}
                                    </span>
                                 </div>
                                 <div className="grid grid-cols-2 gap-4 text-[10px] uppercase font-black text-sidebar-text-muted tracking-widest border-t border-card-border pt-4 transition-colors">
                                    <div>BP: <span className="text-text-main font-mono transition-colors">{currentLog.vital_signs?.blood_pressure || '—'}</span></div>
                                    <div>HR: <span className="text-text-main font-mono transition-colors">{currentLog.vital_signs?.heart_rate || '—'}</span></div>
                                 </div>
                                 {currentLog.notes && <div className="mt-4 text-[11px] text-sidebar-text-muted italic leading-relaxed border-l-2 border-card-border pl-4 ml-1 transition-colors">"{currentLog.notes}"</div>}
                                 <div className="mt-6 flex items-center gap-2">
                                    <div className="w-5 h-5 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-[8px] font-black text-text-main transition-colors">{currentLog.caregiver_name?.[0]}</div>
                                    <div className="text-[9px] font-black text-sidebar-text-muted uppercase tracking-widest italic transition-colors">Node Assessor: {currentLog.caregiver_name}</div>
                                 </div>
                              </div>
                           </div>
                        );
                     }
                     if (items.length === 0) return <div className="text-center py-16 text-[10px] font-black uppercase tracking-widest text-sidebar-text-muted italic border border-dashed border-card-border rounded-2xl transition-colors">Protocol history empty</div>;
                     return items;
                  })()}
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}
