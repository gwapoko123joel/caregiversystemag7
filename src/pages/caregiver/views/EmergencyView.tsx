import { useState, useEffect } from 'react'
import { 
  Phone, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  User, 
  Stethoscope, 
  ShieldCheck,
  CheckCircle2,
  AlertCircle, 
  Loader2, 
  ShieldAlert, 
  Navigation,
  Siren,
  Activity
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'

export default function EmergencyView() {
  const { user } = useAuth()
  const { patient, assignedPatients } = useOutletContext<any>()
  const [practitioners, setPractitioners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDispatching, setIsDispatching] = useState(false)
  const [sosStatus, setSosStatus] = useState<string>('idle');

  useEffect(() => {
    // Listen for the Doctor's response
    const channel = supabase.channel('sos-response-tracker')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'emergency_dispatches' }, 
        (payload) => {
          if (payload.new.status === 'responding') {
            setSosStatus('responding');
            alert("DISPATCH CONFIRMED: A Doctor is now reviewing this case.");
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function triggerSOS(patientId: number) {
    if (!user) return
    setIsDispatching(true)
    const { error } = await supabase.from('emergency_dispatches').insert({
      caregiver_id: user.id,
      patient_id: patientId,
      status: 'active'
    })

    if (!error) {
       await supabase.from('activity_logs').insert({
         user_id: user?.id,
         user_type: 'caregiver',
         action: 'SOS_TRIGGERED',
         details: { 
           severity: 'CRITICAL',
           location: 'Barangay Bantayan',
           patient_id: patientId
         }
       });
       setSosStatus('active');
    } else {
       alert("SOS FAILED: " + error.message)
    }
    setIsDispatching(false)
  }

  useEffect(() => {
    const fetchPractitioners = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('caregivers')
        .select('*')
        .eq('role', 'medical_practitioner')
        .eq('duty_status', 'available')
        .limit(3)
      
      if (!error && data) {
        setPractitioners(data)
      }
      setLoading(false)
    }

    fetchPractitioners()
  }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 px-4 md:px-0">
      
      {/* ── HEADER: CRISIS PROTOCOL ── */}
      <div className="px-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_#f43f5e]" />
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em]">Protocol: Emergency Dispatch</span>
        </div>
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
          Emergency <span className="text-rose-500">Support</span>
        </h2>
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-2">
          Direct Crisis Intervention • Global SOS Broadcast Node
        </p>
      </div>

      {/* ── SECTION 1: GLOBAL CRISIS SOS ── */}
      <div className="bg-rose-500/5 border border-rose-500/20 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden ring-1 ring-rose-500/10">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <ShieldAlert size={200} className="text-rose-500" />
        </div>

        <div className="max-w-2xl relative z-10 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-6 mb-10">
             <div className="w-20 h-20 bg-rose-500 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-rose-500/40 animate-pulse">
                <ShieldAlert size={40} />
             </div>
             <div>
                <h3 className="text-3xl font-black text-white uppercase tracking-tight">Global Crisis SOS</h3>
                <p className="text-xs text-rose-400/80 font-bold uppercase tracking-widest mt-1">Life-Threatening Emergency Protocol Only</p>
             </div>
          </div>

          <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-lg">
            Triggering a Panic SOS will broadcast a high-priority red alert to all authorized practitioners on the network instantly.
          </p>

          {/* SOS PATIENT GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(assignedPatients || [patient]).filter(Boolean).map((p: any) => (
              <button
                key={p.patient_id}
                disabled={isDispatching}
                onClick={() => triggerSOS(p.patient_id)}
                className="group relative flex items-center justify-between p-6 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white rounded-3xl transition-all shadow-xl shadow-rose-900/20 active:scale-95"
              >
                <div className="flex flex-col items-start">
                   <span className="text-[8px] font-black text-rose-200 uppercase tracking-widest mb-1">Trigger Alarm for:</span>
                   <span className="text-sm font-black uppercase tracking-tight">{p.first_name} {p.last_name}</span>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                   {isDispatching ? <Loader2 className="animate-spin" size={20} /> : <Siren size={20} />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        
        {/* ── SECTION 2: SUBJECT CONTEXT & DOCTORS (6/10) ── */}
        <div className="lg:col-span-6 space-y-6">
          {/* ACTIVE PATIENT CONTEXT */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[32px] p-8">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Subject Identity Context</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 border border-white/5">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-lg font-black text-white uppercase tracking-tight">
                    {patient?.first_name || 'No Active'} {patient?.last_name || 'Subject'}
                  </p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">
                    {patient?.patient_monitoring_logs?.[0] 
                      ? `Last Sync: ${patient.patient_monitoring_logs[0].vital_signs.blood_pressure} BP • ${patient.patient_monitoring_logs[0].vital_signs.heart_rate} BPM`
                      : 'No Telemetry Recorded'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                 <span className={`text-[10px] font-black px-2 py-1 rounded border uppercase tracking-widest ${
                   patient?.status === 'active' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-500 bg-white/5 border-white/10'
                 }`}>
                   {patient?.status || 'Unknown'}
                 </span>
              </div>
            </div>
          </div>

          {/* NETWORK PRACTITIONERS */}
          <div className="bg-slate-900/40 border border-white/5 rounded-[32px] p-8">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Network Availability</h3>
                <button className="text-[8px] font-black text-sky-500 uppercase tracking-widest hover:text-sky-400">View All Practitioners</button>
             </div>
             
             <div className="space-y-3">
                {loading ? (
                  <div className="py-10 text-center opacity-40">
                     <Loader2 size={24} className="animate-spin mx-auto mb-2 text-sky-500" />
                  </div>
                ) : practitioners.length === 0 ? (
                  <div className="py-10 text-center border border-dashed border-white/10 rounded-3xl opacity-40">
                    <Phone size={24} className="mx-auto mb-2 text-slate-600" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No available doctors on-call</p>
                  </div>
                ) : (
                  practitioners.map(dr => (
                    <div key={dr.id} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <div>
                             <p className="text-xs font-black text-white uppercase">Dr. {dr.last_name}</p>
                             <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{dr.prc_license || 'Verified Node'}</p>
                          </div>
                       </div>
                       <a href={`tel:${dr.phone_number}`} className="p-2 bg-sky-500/10 text-sky-500 rounded-lg hover:bg-sky-500 hover:text-white transition-all">
                          <Phone size={14} />
                       </a>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>

        {/* ── SECTION 3: LOCAL SERVICE DISPATCH (4/10) ── */}
        <div className="lg:col-span-4 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl flex flex-col">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Local Service Dispatch</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            <DispatchCard label="Ambulance" number="032-488-9000" icon={<Phone size={14}/>} color="rose" />
            <DispatchCard label="Health Center" number="032-488-9111" icon={<Navigation size={14}/>} color="sky" />
            <DispatchCard label="Fire Bureau" number="032-488-9222" icon={<Activity size={14}/>} color="amber" />
            <DispatchCard label="Police Dept" number="032-488-9333" icon={<ShieldCheck size={14}/>} color="emerald" />
          </div>

          <button className="mt-8 w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">
            Update Dispatch Registry
          </button>
        </div>
      </div>
    </div>
  );
}

// ── HELPER: DISPATCH CARD ──
function DispatchCard({ label, number, icon, color }: any) {
  const themes: any = {
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20 hover:border-rose-500/50',
    sky: 'text-sky-500 bg-sky-500/10 border-sky-500/20 hover:border-sky-500/50',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20 hover:border-amber-500/50',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/50',
  };

  return (
    <a href={`tel:${number.replace(/-/g, '')}`} className={`p-5 rounded-[24px] border transition-all flex flex-col justify-between group h-32 ${themes[color]}`}>
      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</p>
        <p className="text-xs font-mono font-bold whitespace-nowrap">{number}</p>
      </div>
    </a>
  );
}
