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
  ShieldCheck
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { Link, useOutletContext } from 'react-router-dom'

export default function EmergencyView() {
  const { patient } = useOutletContext<any>()
  const [practitioners, setPractitioners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
      
      {/* ── 1. EMERGENCY ACTION BANNER ── */}
      <div className="soft-card bg-red-600/10 border border-red-500/20 p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:bg-red-600/20 transition-all duration-700" />
         
         <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 text-center md:text-left">
            <div className="w-16 h-16 bg-red-600 rounded-[2rem] flex items-center justify-center text-white shadow-lg shadow-red-600/40 animate-pulse-slow">
               <AlertTriangle size={32} />
            </div>
            <div>
               <h2 className="text-3xl font-light text-white uppercase tracking-widest leading-none">Life-Threatening Emergency?</h2>
               <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-3">Immediate intervention protocol for Barangay Bantayan</p>
            </div>
         </div>

         <a 
           href="tel:911"
           className="w-full md:w-auto px-10 py-5 bg-red-600 text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-red-600/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 relative z-10"
         >
            <Phone size={20} className="fill-current" /> Dial 911 Now
         </a>
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
