import { useState, useEffect } from 'react'
import { 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  ZoomIn, 
  Zap, 
  X,
  ChevronLeft,
  ShieldCheck,
  Send,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from '../../../hooks/useAuth'
import type { PatientWithLogs } from '../PractitionerDashboard'
import { useNavigate } from 'react-router-dom'

interface PatientDossierProps {
  patient: PatientWithLogs
  initiateCall: (caregiverName?: string, patientName?: string) => void
}

export default function PatientDossier({
  patient,
  initiateCall
}: PatientDossierProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [magnifiedImage, setMagnifiedImage] = useState<string | null>(null)
  
  // Clinical Intervention State
  const [instruction, setInstruction] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [orders, setOrders] = useState<any[]>([])

  async function fetchOrders() {
    const { data } = await supabase
      .from('clinical_instructions')
      .select(`
        *,
        doctor:caregivers!doctor_id (last_name)
      `)
      .eq('patient_id', parseInt(patient.patient_id.toString()))
      .order('created_at', { ascending: false })
    
    setOrders(data || [])
  }

  useEffect(() => {
    fetchOrders()
  }, [patient.patient_id])

  async function sendInstruction() {
    if (!instruction.trim() || !user) return
    setIsSending(true)

    try {
      const { error } = await supabase
        .from('clinical_instructions')
        .insert({
          patient_id: parseInt(patient.patient_id.toString()),
          doctor_id: user.id,
          instruction_text: instruction.trim(),
          urgency_level: 'routine'
        })

      if (error) throw error
      setInstruction('')
      fetchOrders() // Refresh list
      alert("Instruction dispatched to Caregiver node.")
    } catch (err) {
      console.error(err)
      alert("Failed to send instruction.")
    } finally {
      setIsSending(false)
    }
  }

  // --- TREND CALCULATION LOGIC ---
  const getTrend = (key: string) => {
    const logs = patient.patient_monitoring_logs;
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
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-slate-900/80 backdrop-blur-md rounded-full border border-sky-500/30 text-sky-400 text-xs font-light uppercase tracking-widest flex items-center gap-2">
               <Zap size={14} className="fill-sky-400" /> Actual Node Footage
            </div>
         </div>
      )}

      <button 
         onClick={() => navigate(-1)}
         className="px-6 py-3 bg-card hover:bg-card/80 border border-card-border rounded-xl flex items-center gap-2 text-xs font-light uppercase transition-all w-fit group shadow-sm dark:shadow-none"
      >
         <ChevronLeft size={16} className="text-sidebar-text-muted group-hover:-translate-x-1 group-hover:text-text-main transition-all" /> 
         <span className="text-text-main transition-colors">Return to Stream</span>
      </button>

      <div className="bg-card border border-card-border rounded-[32px] md:rounded-[40px] p-6 md:p-8 lg:p-12 relative overflow-hidden shadow-sm dark:shadow-none transition-colors">
         <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 blur-[100px] rounded-full pointer-events-none" />
         
         <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 md:gap-8 relative z-10 mb-8 md:mb-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 md:gap-8 text-center sm:text-left">
               <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-sky-500/10 to-slate-900/10 dark:from-sky-500/20 dark:to-slate-950/20 rounded-3xl border border-card-border flex items-center justify-center shadow-xl dark:shadow-2xl relative transition-colors">
                  <User size={32} className="text-sky-500 md:w-10 md:h-10 transition-colors" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-sky-500 rounded-full border-[3px] md:border-4 border-card transition-colors" />
               </div>
               <div className="space-y-2">
                  <h2 className="text-2xl md:text-4xl font-light text-text-main  tracking-tight transition-colors">{patient.first_name} {patient.last_name}</h2>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-2 pt-2">
                     <div className="flex items-center gap-2 text-sidebar-text-muted font-bold uppercase text-[9px] md:text-[10px] tracking-widest transition-colors"><Calendar size={14} className="text-sidebar-text-muted/50" /> {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : '—'}</div>
                     <div className="flex items-center gap-2 text-sidebar-text-muted font-bold uppercase text-[9px] md:text-[10px] tracking-widest transition-colors"><MapPin size={14} className="text-sidebar-text-muted/50" /> {patient.address}</div>
                  </div>
               </div>
            </div>
            <button 
               onClick={() => initiateCall(patient.patient_monitoring_logs?.[0]?.caregiver_name, `${patient.first_name} ${patient.last_name}`)}
               className="w-full lg:w-auto px-6 md:px-10 py-4 md:py-5 node-urgent font-light uppercase text-[10px] tracking-[0.15em] md:tracking-[0.2em] rounded-2xl shadow-[var(--shadow-harmonized)] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
               <Phone size={18} /> Initiate Remote Consult
            </button>
         </div>

         {/* --- VITAL SIGNS TREND HUD --- */}
         {patient.patient_monitoring_logs.length >= 2 && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 animate-in slide-in-from-top-4 duration-700 relative z-10">
             <div className="bg-sky-500/5 border border-sky-500/10 rounded-[28px] p-6 flex items-center justify-between">
               <div>
                 <p className="text-[8px] font-black text-sidebar-text-muted uppercase tracking-[0.2em] mb-1">Systolic Trend</p>
                 <h4 className={`text-sm font-black uppercase flex items-center gap-2 ${getTrend('blood_pressure')?.color}`}>
                   {getTrend('blood_pressure')?.icon} {getTrend('blood_pressure')?.label}
                 </h4>
               </div>
               <div className="text-right">
                 <p className="text-[14px] font-mono text-text-main font-bold">
                   {patient.patient_monitoring_logs[1].vital_signs.blood_pressure} → {patient.patient_monitoring_logs[0].vital_signs.blood_pressure}
                 </p>
                 <p className="text-[8px] text-sidebar-text-muted uppercase font-bold">Last 2 Readings</p>
               </div>
             </div>

             <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[28px] p-6 flex items-center justify-between">
               <div>
                 <p className="text-[8px] font-black text-sidebar-text-muted uppercase tracking-[0.2em] mb-1">Oxygen Stability</p>
                 <h4 className={`text-sm font-black uppercase flex items-center gap-2 ${getTrend('oxygen_saturation')?.color}`}>
                   {getTrend('oxygen_saturation')?.icon} {getTrend('oxygen_saturation')?.label}
                 </h4>
               </div>
               <div className="text-right">
                 <p className="text-[14px] font-mono text-text-main font-bold">
                   {patient.patient_monitoring_logs[1].vital_signs.oxygen_saturation}% → {patient.patient_monitoring_logs[0].vital_signs.oxygen_saturation}%
                 </p>
                 <p className="text-[8px] text-sidebar-text-muted uppercase font-bold">O2 Saturation</p>
               </div>
             </div>
           </div>
         )}

         <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative z-10">
            
            {/* ── PHYSICAL GALLERY ── */}
            <div className="space-y-6">
               <div className="text-[10px] font-light text-sky-500 uppercase tracking-[0.3em] flex items-center gap-2 transition-colors">
                  <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse transition-colors" />
                  Visual Health Inventory
               </div>
               <div className="bg-card border border-card-border rounded-[24px] md:rounded-[32px] p-5 md:p-8 grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 shadow-sm dark:shadow-none transition-colors">
                  {patient.patient_monitoring_logs.filter(l => l.image_url).length === 0 ? (
                     <div className="col-span-full py-12 md:py-16 text-center text-[9px] md:text-[10px] font-light uppercase tracking-widest text-sidebar-text-muted  border border-dashed border-card-border rounded-2xl transition-colors font-sans">No visual telemetry</div>
                  ) : (
                     patient.patient_monitoring_logs.filter(l => l.image_url).map(log => (
                        <div key={log.log_id} className="relative aspect-square rounded-xl md:rounded-2xl overflow-hidden border border-card-border group shadow-sm md:shadow-lg transition-colors active:scale-95">
                           <img src={log.image_url!} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" alt="Patient state" />
                           <div className="absolute inset-0 bg-slate-900/40 md:bg-slate-900/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button onClick={() => setMagnifiedImage(log.image_url)} className="p-3 md:p-4 bg-sky-500 text-white rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                 <ZoomIn size={16} className="md:w-[18px] md:h-[18px]" />
                              </button>
                           </div>
                           <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-card/80 rounded border border-card-border text-[7px] md:text-[8px] font-light text-sky-600 dark:text-sky-400 uppercase tracking-tighter transition-colors">
                              {new Date(log.recorded_at).toLocaleDateString()}
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </div>

            {/* ── TELEMETRY TIMELINE ── */}
            <div className="space-y-6">
               <div className="text-[10px] font-light text-sky-500 uppercase tracking-[0.3em] flex items-center gap-2 transition-colors">
                  <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse transition-colors" />
                  Clinical Protocol Stream
               </div>
               <div className="bg-card border border-card-border rounded-[24px] md:rounded-[32px] p-5 md:p-8 max-h-[500px] overflow-y-auto space-y-6 scrollbar-hide shadow-sm dark:shadow-none transition-colors">
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
                                   <div key={`gap-${i}`} className="relative pl-6 md:pl-8 py-3 md:py-4">
                                      <div className="absolute left-[9px] md:left-[11px] top-4 border-l-2 border-dashed border-red-500/30 dark:border-sky-500/30 h-full transition-colors" />
                                      <div className="absolute left-[3px] md:left-[5px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 bg-red-500/20 dark:bg-sky-500/20 border-2 border-red-500 dark:border-sky-500 rounded-full shadow-[0_0_100px_rgba(239,68,68,0.3)] animate-pulse transition-colors" />
                                      <div className="text-[8px] md:text-[10px] font-light text-red-500 dark:text-sky-400 uppercase tracking-[0.15em] md:tracking-[0.2em] pl-4  transition-colors">GAP: ~{Math.round(hoursDiff)}H MISSED</div>
                                   </div>
                                );
                           }
                        }

                        items.push(
                           <div key={currentLog.log_id} className="relative pl-6 md:pl-8 group">
                              <div className="absolute left-[9px] md:left-[11px] top-6 border-l-2 border-card-border h-full group-last:hidden transition-colors" />
                              <div className={`absolute left-[5px] md:left-[7px] top-2 w-2.5 h-2.5 rounded-full ring-2 md:ring-4 ring-card z-10 transition-all ${currentLog.physical_status === 'critical' ? 'bg-alert-text shadow-[0_0_10px_var(--color-alert-text)]' : 'bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]'}`} />
                              <div className="bg-card border border-card-border rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-sky-500/20 transition-colors shadow-sm active:scale-[0.99]">
                                 <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-2 mb-4">
                                    <div className="text-[8px] md:text-[10px] font-light text-text-main uppercase tracking-widest leading-none bg-card px-2 py-1 rounded border border-card-border transition-colors">
                                       {new Date(currentLog.recorded_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }).toUpperCase()}
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-light uppercase tracking-widest border transition-colors ${currentLog.physical_status === 'critical' ? 'node-urgent text-[8px] px-2 py-0.5' : 'bg-success-bg text-success-text border-success-border font-light uppercase tracking-[0.1em] md:tracking-[0.2em]'}`}>
                                       {currentLog.physical_status}
                                    </span>
                                 </div>
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[9px] md:text-[10px] uppercase font-light text-sidebar-text-muted tracking-widest border-t border-card-border pt-4 transition-colors">
                                    <div>BP: <span className="text-text-main font-mono transition-colors">{currentLog.vital_signs?.blood_pressure || '—'}</span></div>
                                    <div>HR: <span className="text-text-main font-mono transition-colors">{currentLog.vital_signs?.heart_rate || '—'}</span></div>
                                    <div>TEMP: <span className="text-text-main font-mono transition-colors">{currentLog.vital_signs?.temperature || '—'}°C</span></div>
                                    <div>O₂: <span className="text-text-main font-mono transition-colors">{currentLog.vital_signs?.oxygen_saturation || '—'}%</span></div>
                                 </div>
                                 {currentLog.notes && <div className="mt-4 text-[10px] md:text-[11px] text-sidebar-text-muted  leading-relaxed border-l-2 border-card-border pl-4 ml-1 transition-colors">"{currentLog.notes}"</div>}
                                 <div className="mt-6 flex items-center gap-2">
                                    <div className="w-5 h-5 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-[7px] md:text-[8px] font-light text-text-main transition-colors">{currentLog.caregiver_name?.[0]}</div>
                                    <div className="text-[8px] md:text-[9px] font-light text-sidebar-text-muted uppercase tracking-widest  transition-colors leading-none">Node Assessor: {currentLog.caregiver_name}</div>
                                 </div>
                              </div>
                           </div>
                        );
                     }
                     if (items.length === 0) return <div className="text-center py-12 md:py-16 text-[9px] md:text-[10px] font-light uppercase tracking-widest text-sidebar-text-muted  border border-dashed border-card-border rounded-2xl transition-colors">Empty History</div>;
                     return items;
                  })()}
               </div>
            </div>
         </div>
      </div>

      {/* ── CLINICAL INTERVENTION ── */}
      <div className="bg-sky-500/5 border border-sky-500/10 rounded-[32px] md:rounded-[40px] p-8 md:p-12 shadow-sm relative overflow-hidden transition-all hover:bg-sky-500/[0.08]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-text-main uppercase tracking-tight">Clinical Intervention</h3>
            <p className="text-[10px] font-bold text-sidebar-text-muted uppercase tracking-widest mt-1">Issue formal instructions to field staff</p>
          </div>
        </div>

        <div className="relative group mb-6">
          <textarea 
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g. Patient BP is elevated. Administer maintenance meds and re-check in 1 hour..."
            className="w-full bg-card border border-card-border rounded-2xl p-6 text-sm text-text-main focus:outline-none focus:border-sky-500/50 min-h-[120px] transition-all resize-none shadow-sm placeholder:text-sidebar-text-muted/50"
          />
          <div className="absolute bottom-4 right-4 text-[9px] font-black text-sidebar-text-muted/50 uppercase tracking-widest">
            {instruction.length} Characters
          </div>
        </div>

        <button 
          onClick={sendInstruction}
          disabled={isSending || !instruction.trim()}
          className="w-full py-5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-sky-500/20 active:scale-[0.98] group"
        >
          {isSending ? (
            "Dispatching Instructions..."
          ) : (
            <>
              <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              Send Clinical Order
            </>
          )}
        </button>
      </div>

      {/* ── ORDER HISTORY ── */}
      <div className="bg-card border border-card-border rounded-[32px] md:rounded-[40px] p-8 md:p-12 shadow-sm transition-colors">
        <h3 className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-[0.2em] mb-6">Recent Dispatch History</h3>
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-card-border rounded-2xl">
              <p className="text-[10px] text-sidebar-text-muted uppercase font-black">No clinical orders found for this patient.</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.instruction_id} className="p-5 bg-primary/30 border border-card-border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${order.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${order.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {order.status === 'completed' ? '✓ Actioned' : '• Pending'}
                    </span>
                  </div>
                  <p className="text-sm text-text-main italic font-light">"{order.instruction_text}"</p>
                  <p className="text-[8px] text-sidebar-text-muted uppercase font-black tracking-widest">
                    Dispatched: {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-sky-500 uppercase">Dr. {order.doctor?.last_name}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
