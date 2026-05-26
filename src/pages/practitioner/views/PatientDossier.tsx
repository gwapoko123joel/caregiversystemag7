import { useState, useEffect } from 'react'
import { 
  Phone, 
  Zap, 
  X,
  ArrowLeft,
  ShieldCheck,
  Send,
  ArrowUpRight,
  XCircle,
  Camera,
  Activity,
  Loader2,
  FileText,
  Printer,
  ShieldAlert
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from '../../../hooks/useAuth'
import { useNavigate, useParams } from 'react-router-dom'
import { calculateAge } from '../../../utils/medical'
import ClinicalHandshake from '../../../components/shared/ClinicalHandshake'

export interface PatientDossierProps {
  initiateCall: (caregiverName?: string, patientName?: string) => void
}

export default function PatientDossier({
  initiateCall
}: PatientDossierProps) {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [magnifiedImage, setMagnifiedImage] = useState<string | null>(null)
  
  // Clinical Intervention State
  const [instruction, setInstruction] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [instructions, setInstructions] = useState<any[]>([])
  const [referrals, setReferrals] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [, setActiveDispatch] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)

  // Handshake State
  const [showHandshake, setShowHandshake] = useState(false)
  const [handshakeData, setHandshakeData] = useState({ title: '', message: '' })

  useEffect(() => {
    if (id) {
      fetchPatientData()
    }
  }, [id])

  async function fetchPatientData() {
    if (!id) return;
    
    setLoading(true);
    try {
      // 2. CONVERT THE STRING FROM URL TO A NUMBER (Strict Integer-Safe)
      const numericId = parseInt(id, 10);

      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          patient_referrals (
            *
          )
        `)
        .eq('patient_id', numericId)
        .single();

      if (error) {
        console.error("Database Error:", error.message);
        return;
      }

      if (!data) {
        console.log("No patient found with ID:", numericId);
        return;
      }

      setPatient(data);
      
      // 3. Update associated operational fetches to use the validated numeric ID
      fetchVitalsHistory(numericId);
      fetchSOS(numericId);
      fetchInstructions(numericId);
      fetchReferrals(numericId);

    } catch (err) {
      console.error("System Error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchVitalsHistory(numericId: number) {
    try {
      const { data, error } = await supabase
        .from('patient_monitoring_logs')
        .select(`
          *,
          caregiver:caregivers!caregiver_id (
            full_name
          ),
          verifier:caregivers!verified_by (
            last_name
          )
        `)
        .eq('patient_id', numericId)
        .order('recorded_at', { ascending: false });

      if (error) {
        console.error("Join Error:", error.message);
        return;
      }

      setLogs(data || []);
    } catch (err) {
      console.error("Vitals Fetch Error:", err);
    }
  }

  // Fetch Practitioner Profile for Signing
  useEffect(() => {
    if (user) {
      supabase
        .from('caregivers')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setUserProfile(data));
    }
  }, [user]);

  async function fetchSOS(patientId: number) {
    const { data } = await supabase
      .from('emergency_dispatches')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'responding')
      .single()
    
    setActiveDispatch(data || null)
  }

  async function fetchInstructions(patientId: number) {
    const { data } = await supabase
      .from('clinical_instructions')
      .select(`
        *,
        doctor:caregivers!doctor_id (last_name)
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
    
    setInstructions(data || [])
  }

  async function fetchReferrals(patientId: number) {
    const { data } = await supabase
      .from('patient_referrals')
      .select('*, doctor:caregivers!doctor_id(last_name)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    setReferrals(data || []);
  }

  async function sendInstruction() {
    if (!instruction.trim() || !user || !patient) return
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
      
      setHandshakeData({
        title: "Order Dispatched",
        message: "Your clinical intervention has been securely synchronized with the field caregiver node."
      });
      setShowHandshake(true);
      setInstruction('')
      fetchInstructions(patient.patient_id) // Refresh list
    } catch (err) {
      console.error(err)
      alert("Failed to send instruction.")
    } finally {
      setIsSending(false)
    }
  }

  async function handleSignOff(logId: number) {
    if (!user || !patient) return;
    
    try {
      // Update the log directly to set verified_by
      const { error: updateError } = await supabase
        .from('patient_monitoring_logs')
        .update({ verified_by: user.id })
        .eq('log_id', logId);

      if (updateError) throw updateError;

      // LOG ACTIVITY: CLINICAL SIGN-OFF
      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        user_type: 'medical_practitioner',
        action: 'CLINICAL_SIGN_OFF',
        details: { 
          log_id: logId,
          verified_by: `Dr. ${userProfile?.last_name || 'Practitioner'}`,
          patient_name: `${patient.first_name} ${patient.last_name}`
        }
      });

      setHandshakeData({
        title: "Clinical Sign-Off Recorded",
        message: `This monitoring log has been clinically validated by Dr. ${userProfile?.last_name}.`
      });
      setShowHandshake(true);
      fetchVitalsHistory(patient.patient_id);
    } catch (err) {
      console.error("Sign-off error:", err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 animate-pulse">
        <div className="w-16 h-16 bg-sky-500/10 rounded-full flex items-center justify-center">
          <Zap size={32} className="text-sky-500 animate-bounce" />
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Accessing Dossier Node...</p>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
        <XCircle size={48} className="text-rose-500/50" />
        <div className="text-center">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Node Not Found</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">The requested subject identity is not synchronized with this sector.</p>
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          Return to Operations
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      
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

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-3">
               <h2 className="text-3xl font-black text-white uppercase tracking-tight">{patient.first_name} {patient.last_name}</h2>
               <span className="px-3 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                 ID: PT-{patient.patient_id.toString().padStart(4, '0')}
               </span>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">
              {calculateAge(patient.date_of_birth)} • {patient.gender || 'Not Specified'} • {patient.address}
            </p>
          </div>
        </div>
        <button 
          onClick={() => initiateCall(logs?.[0]?.caregiver?.full_name, `${patient?.first_name} ${patient?.last_name}`)}
          className="px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-rose-500/20 active:scale-95 flex items-center gap-2"
        >
          <Phone size={16} /> Initiate Remote Consult
        </button>
      </div>

      {/* ── MAIN GRID (60/40 SPLIT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        
        {/* LEFT: VISUAL HEALTH & CONTEXT (6 Spans) */}
        <div className="lg:col-span-6 space-y-8">
          {/* ── NEW: EMERGENCY QUICK-SCAN ── */}
          <div className="bg-slate-950/50 rounded-3xl p-6 border border-rose-500/20 mb-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4 text-rose-500">
              <ShieldAlert size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Emergency Metadata</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Blood Type</span>
                <span className="text-sm font-black text-white">{patient.blood_type || 'Unknown'}</span>
              </div>
              
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Known Allergies</span>
                <p className={`text-xs font-bold uppercase ${patient.allergies ? 'text-rose-400' : 'text-slate-400'}`}>
                  {patient.allergies || 'No known allergies'}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Emergency Contact</span>
                <p className="text-xs font-bold text-white uppercase leading-none">{patient.emergency_contact_name || 'N/A'}</p>
                <p className="text-[10px] font-mono text-sky-500">{patient.emergency_contact_phone || 'None'}</p>
              </div>
            </div>
          </div>

          {/* PHOTO INVENTORY */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Camera size={14} className="text-sky-500" /> Visual Health Inventory
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
               {logs.filter(l => l.image_url).length === 0 ? (
                 <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-[32px] opacity-30">
                   <p className="text-[10px] font-black uppercase">No visual telemetry</p>
                 </div>
               ) : (
                 logs.filter(l => l.image_url).map(l => (
                   <div 
                     key={l.log_id} 
                     className="aspect-square rounded-3xl overflow-hidden border border-white/5 group relative cursor-zoom-in"
                     onClick={() => setMagnifiedImage(l.image_url.startsWith('http') ? l.image_url : supabase.storage.from('patient-photos').getPublicUrl(l.image_url).data.publicUrl)}
                   >
                     <img 
                       src={l.image_url.startsWith('http') ? l.image_url : supabase.storage.from('patient-photos').getPublicUrl(l.image_url).data.publicUrl} 
                       className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                       alt="Patient status"
                     />
                     <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-[8px] text-white font-mono">
                       {new Date(l.recorded_at).toLocaleDateString()}
                     </div>
                   </div>
                 ))
               )}
            </div>
          </div>

          {/* ── REFERRAL HISTORY ── */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <FileText size={14} className="text-sky-500" /> Transfer of Care Archive
            </h3>
            
            <div className="space-y-4">
              {referrals.length === 0 ? (
                <p className="text-[10px] text-center opacity-30 uppercase font-black py-4">No active referrals recorded</p>
              ) : (
                referrals.map(ref => (
                  <div key={ref.referral_id} className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-between group">
                    <div>
                      <p className="text-[10px] font-black text-sky-400 uppercase tracking-tight">TO: {ref.target_facility}</p>
                      <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">
                        Issued {new Date(ref.created_at).toLocaleDateString()} • Dr. {ref.doctor?.last_name || 'Practitioner'}
                      </p>
                    </div>
                    <button className="p-2 bg-sky-500/10 text-sky-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                      <Printer size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CLINICAL INTERVENTION (The Send Box) */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-sky-500/20 rounded-[40px] p-8 shadow-2xl ring-1 ring-sky-500/10">
            <h3 className="text-sm font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
               <ShieldCheck size={18} className="text-sky-500" /> Clinical Intervention
            </h3>
            <textarea 
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Type clinical orders for field staff..."
              className="w-full bg-slate-950/50 border border-white/10 rounded-3xl p-6 text-sm text-white focus:outline-none focus:border-sky-500/50 min-h-[150px] transition-all resize-none mb-6"
            />
            <button 
              onClick={sendInstruction}
              disabled={isSending || !instruction.trim()}
              className="w-full py-5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-xl shadow-sky-500/30"
            >
              {isSending ? <Loader2 className="animate-spin" /> : <><Send size={16} /> Dispatch Clinical Order</>}
            </button>

            {/* ── INSTRUCTION HISTORY ── */}
            <div className="mt-8 pt-8 border-t border-white/5">
              <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-6">Recent Dispatch History</h4>
              <div className="space-y-4">
                {instructions.length === 0 ? (
                  <p className="text-[10px] text-center opacity-20 uppercase font-black py-4">No past instructions</p>
                ) : (
                  instructions.map(inst => (
                    <div key={inst.instruction_id} className="flex gap-4">
                      <div className={`w-1 h-10 rounded-full ${inst.status === 'completed' ? 'bg-emerald-500' : 'bg-sky-500'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                           <span className={`text-[8px] font-black uppercase ${inst.status === 'completed' ? 'text-emerald-500' : 'text-sky-500'}`}>
                             {inst.status === 'completed' ? '✓ Actioned' : '• Dispatched'}
                           </span>
                           <span className="text-[8px] text-slate-600 font-mono">{new Date(inst.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1">"{inst.instruction_text}"</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: TELEMETRY STREAM (4 Spans) */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl flex flex-col min-h-[600px]">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <Activity size={14} className="text-rose-500" /> Clinical Protocol Stream
            </h3>

            <div className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-hide">
              {logs.length === 0 ? (
                <div className="text-center py-20 opacity-20 uppercase font-black text-[10px] tracking-widest">Empty History</div>
              ) : (
                logs.map((log) => (
                  <div key={log.log_id} className="relative pl-6 pb-6 border-l-2 border-white/5 last:border-l-0">
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-slate-900 ${
                      log.physical_status === 'critical' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                    }`} />
                    
                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 hover:bg-white/[0.05] transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <p className="text-[9px] font-black text-slate-500 uppercase">{new Date(log.recorded_at).toLocaleString()}</p>
                        <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded border ${
                          log.physical_status === 'critical' ? 'text-rose-500 border-rose-500/20 bg-rose-500/5' : 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5'
                        }`}>
                          {log.physical_status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4">
                         <div className="bg-slate-950/40 p-2 rounded-xl text-center">
                            <p className="text-[7px] font-bold text-slate-600 uppercase">BP</p>
                            <p className="text-xs font-mono text-white">{log.vital_signs.blood_pressure}</p>
                         </div>
                         <div className="bg-slate-950/40 p-2 rounded-xl text-center">
                            <p className="text-[7px] font-bold text-slate-600 uppercase">O2 Sat</p>
                            <p className="text-xs font-mono text-sky-400">{log.vital_signs.oxygen_saturation}%</p>
                         </div>
                      </div>

                      <p className="text-[11px] text-slate-400 italic">"{log.notes || 'No observations'}"</p>
                      
                      {/* SIGN-OFF BUTTON */}
                      {!log.verified_by ? (
                        <button 
                          onClick={() => handleSignOff(log.log_id)}
                          className="mt-4 w-full py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-[8px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all"
                        >
                          Verify & Sign-Off
                        </button>
                      ) : (
                        <div className="mt-4 flex items-center gap-2 text-emerald-500 text-[8px] font-black uppercase opacity-60">
                          <ShieldCheck size={12} /> Clinically Validated by {log.verifier?.last_name ? `Dr. ${log.verifier.last_name}` : 'Practitioner'}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* ── REFERRAL ARCHIVE (Bottom Spanning Section) ── */}
      <div className="bg-slate-900/40 border border-white/5 rounded-[40px] p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
           <ArrowUpRight size={20} className="text-amber-500" />
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Clinical Referral Archive</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {!patient?.patient_referrals || patient.patient_referrals.length === 0 ? (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-[32px] opacity-20">
              <p className="text-[10px] font-black uppercase tracking-widest">No formal referrals archived for this node.</p>
            </div>
          ) : (
            patient.patient_referrals.map((ref: any) => (
              <div key={ref.referral_id} className="p-8 bg-white/[0.02] border border-white/5 rounded-[32px] flex flex-col justify-between gap-6 hover:bg-white/[0.04] transition-all group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      ref.urgency_level === 'emergency' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 
                      ref.urgency_level === 'urgent' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-sky-500 text-white'
                    }`}>
                      {ref.urgency_level}
                    </span>
                    <p className="text-[9px] font-mono text-slate-500 font-bold">{new Date(ref.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">Target Facility</p>
                    <p className="text-sm font-bold text-white">{ref.target_facility}</p>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed italic">"{ref.reason_for_referral}"</p>
                </div>
                <button className="flex items-center justify-center gap-2 w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest group-hover:bg-white/10 transition-all">
                  <ArrowUpRight size={14} className="text-sky-500" /> View Referral Slip
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Handshake Success Overlay */}
      {showHandshake && (
        <ClinicalHandshake 
          title={handshakeData.title}
          message={handshakeData.message}
          onComplete={() => { 
            setShowHandshake(false); 
            fetchPatientData(); 
          }}
          actionLabel="Return to Dossier"
        />
      )}
    </div>
  );
}
