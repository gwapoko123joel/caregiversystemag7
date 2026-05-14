import { useState, useEffect } from 'react'
import { 
  Phone, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  User, 
  Stethoscope, 
  ChevronRight,
  Plus,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { Link, useOutletContext } from 'react-router-dom'
import { AlertCircle, Loader2, ShieldAlert, Navigation } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'

export default function EmergencyView() {
  const { user } = useAuth()
  const { patient, assignedPatients } = useOutletContext<any>()
  const [practitioners, setPractitioners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDispatching, setIsDispatching] = useState(false)
  const [sosSuccess, setSosSuccess] = useState(false)
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
       // ADD THIS after the emergency_dispatches insert:
       await supabase.from('activity_logs').insert({
         user_id: user?.id,
         user_type: 'caregiver',
         action: 'SOS_TRIGGERED',
         details: { 
           severity: 'CRITICAL',
           location: 'Barangay Bantayan'
         }
       });

       setSosSuccess(true)
       // Auto-revert success message after 5 seconds
       setTimeout(() => setSosSuccess(false), 5000)
    } else {
       alert("SOS FAILED: " + error.message)
    }
    setIsDispatching(false)
  }

  useEffect(() => {
    const fetchPractitioners = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('available_practitioners_directory')
        .select('*')
        .eq('availability_status', 'available')
        .limit(3)
      
      if (!error && data) {
        setPractitioners(data)
      }
      setLoading(false)
    }

    fetchPractitioners()
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4 pb-20">
      
      {/* ── 1. GLOBAL SOS PANIC BUTTON ── */}
      <div className="bg-red-600/10 border border-red-500/20 p-8 rounded-[40px] text-center space-y-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:bg-red-600/20 transition-all duration-700" />
        
        <div className="relative z-10">
          <ShieldAlert size={64} className={`mx-auto text-red-600 ${isDispatching ? 'animate-spin' : 'animate-pulse'}`} />
          <h2 className="text-3xl font-black text-text-main uppercase tracking-tighter mt-4">Global Crisis SOS</h2>
          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-2">Life-Threatening Emergency Protocol</p>
          <p className="text-xs text-sidebar-text-muted mt-2 max-w-sm mx-auto">Triggering this will broadcast a red alert to all Available Doctors on the network instantly.</p>
        </div>
        
        <div className="grid gap-3 mt-8 relative z-10">
          {(assignedPatients || [patient]).filter(Boolean).map((p: any) => (
            <button
              key={p.patient_id}
              disabled={isDispatching}
              onClick={() => triggerSOS(p.patient_id)}
              className="w-full py-6 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white rounded-3xl font-black uppercase tracking-widest transition-all shadow-xl shadow-red-500/20 active:scale-95 flex items-center justify-center gap-3 group/btn"
            >
              {isDispatching ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <AlertCircle size={20} className="group-hover/btn:animate-bounce" />
                  PANIC SOS: {p.first_name} {p.last_name}
                </>
              )}
            </button>
          ))}
        </div>

        {sosSuccess && (
          <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-in zoom-in duration-300">
            <p className="text-emerald-500 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
              <ShieldCheck size={16} /> SOS BROADCASTED TO DOCTORS
            </p>
          </div>
        )}

        {/* Practitioner Response Status */}
        {sosStatus === 'responding' && (
          <div className="mt-4 bg-emerald-500/20 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-center gap-3 animate-in zoom-in">
            <CheckCircle2 className="text-emerald-500" size={20} />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Practitioner Intercepted • Help is Active</span>
          </div>
        )}
      </div>

      {/* ── 2. PATIENT CONTEXT (FOR CALLER) ── */}
      {patient && (
        <div className="soft-card bg-slate-900 border-none p-6 flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-brand-cyan/10 rounded-xl flex items-center justify-center text-brand-cyan">
                 <User size={20} />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Patient Context</p>
                 <p className="text-sm font-light text-white uppercase ">{patient.first_name} {patient.last_name}</p>
              </div>
           </div>
           <div className="flex items-center gap-6">
              <div className="text-right">
                 <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Last Vitals</p>
                 <p className="text-[10px] text-brand-cyan font-bold uppercase tracking-widest">
                    {patient.patient_monitoring_logs?.[0]?.vital_signs?.heart_rate || '--'} BPM · {patient.patient_monitoring_logs?.[0]?.vital_signs?.blood_pressure || '--'}
                 </p>
              </div>
              <div className="w-px h-8 bg-white/5" />
              <div className="text-right">
                 <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Primary Condition</p>
                 <p className="text-[10px] text-white font-bold uppercase tracking-widest truncate max-w-[120px]">{patient.medical_conditions || 'Stable'}</p>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ── 3. PRACTITIONER REGISTRY ── */}
        <div className="soft-card bg-slate-900 border-none p-8 space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-1 h-6 bg-brand-cyan rounded-full" />
                 <h3 className="text-sm font-light text-white uppercase tracking-widest">Available Practitioners</h3>
              </div>
              <Link 
                to="/dashboard/caregiver/doctors" 
                className="text-[9px] font-bold text-brand-cyan uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
              >
                 View All <ChevronRight size={12} />
              </Link>
           </div>

           <div className="space-y-3">
              {loading ? (
                <div className="py-10 text-center">
                   <div className="w-6 h-6 border-2 border-brand-cyan border-t-transparent animate-spin rounded-full mx-auto" />
                </div>
              ) : practitioners.length === 0 ? (
                <div className="py-8 text-center space-y-3">
                   <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">No doctors currently flagged as Available on the network.</p>
                   <Link to="/dashboard/caregiver/doctors" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-950 border border-white/5 rounded-lg text-[9px] font-bold text-brand-cyan uppercase tracking-widest">
                      <Plus size={12} /> Find Busy Doctors
                   </Link>
                </div>
              ) : (
                practitioners.map((dr) => (
                  <a 
                    key={dr.caregiver_id}
                    href={`tel:${dr.clinical_hotline}`}
                    className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-white/5 hover:border-brand-cyan/30 transition-all group"
                  >
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand-cyan/10 rounded-xl flex items-center justify-center text-brand-cyan">
                           <Stethoscope size={20} />
                        </div>
                        <div>
                           <p className="text-[10px] font-bold text-white uppercase tracking-widest">{dr.full_name}</p>
                           <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">{dr.prc_profession} · PRC #{dr.prc_license_number}</p>
                        </div>
                     </div>
                     <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan group-hover:bg-brand-cyan group-hover:text-slate-950 transition-all">
                        <Phone size={18} />
                     </div>
                  </a>
                ))
              )}
           </div>
        </div>

        {/* ── 4. EMERGENCY HOTLINES ── */}
        <div className="space-y-4">
           <div className="flex items-center gap-3 px-2">
              <div className="w-1 h-6 bg-red-500 rounded-full" />
              <h3 className="text-sm font-light text-white uppercase tracking-widest">Local Service Dispatch</h3>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <EmergencyContactCard label="Ambulance" phone="032-488-9000" icon={<MapPin size={18} />} color="red" />
              <EmergencyContactCard label="Health Center" phone="032-488-9111" icon={<Stethoscope size={18} />} color="brand-cyan" />
              <EmergencyContactCard label="Fire Bureau" phone="032-488-9222" icon={<Clock size={18} />} color="orange" />
              <EmergencyContactCard label="Police Dept" phone="032-488-9333" icon={<ShieldCheck size={18} />} color="blue" />
           </div>
        </div>

      </div>
    </div>
  )
}

function EmergencyContactCard({ label, phone, icon, color }: any) {
  const colors: any = {
    red: 'text-red-500 bg-red-500/10 border-red-500/20',
    'brand-cyan': 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/20',
    orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  }
  
  return (
    <a 
      href={`tel:${phone.replace(/-/g, '')}`}
      className={`soft-card bg-slate-900 border-none p-6 flex flex-col gap-4 hover:scale-105 active:scale-95 transition-all group`}
    >
       <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          {icon}
       </div>
       <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
          <p className="text-sm font-light text-white uppercase ">{phone}</p>
       </div>
    </a>
  )
}
