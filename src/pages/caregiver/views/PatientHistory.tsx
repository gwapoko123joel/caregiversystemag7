import { useEffect, useState } from 'react'
import { Search, User, MapPin, Activity, Loader2, Clock, ChevronRight } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from '../../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import PatientDetails from './PatientDetails'

export default function PatientHistory() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<any>(null)

  useEffect(() => {
    if (user) fetchAssignedPatients()
  }, [user])

  async function fetchAssignedPatients() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('caregiver_patient_assignments')
        .select(`patient:patients!patient_id (*)`)
        .eq('caregiver_id', user?.id)

      if (error) throw error
      setPatients(data?.map((item: any) => item.patient).filter(Boolean) || [])
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredPatients = patients.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (selectedPatient) {
    return <PatientDetails patient={selectedPatient} onBack={() => setSelectedPatient(null)} />
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-40">
         <Loader2 className="animate-spin text-sky-500 mb-4" size={32} />
         <p className="text-[10px] font-black uppercase tracking-widest">Scanning clinical records...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 px-4 md:px-0">
      
      {/* ── HEADER & SEARCH ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span className="text-[10px] font-black text-sky-500 uppercase tracking-[0.4em]">Registry: Patient Roster</span>
          </div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
            Managed <span className="text-sky-500">Records</span>
          </h2>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-2">
            Barangay Bantayan Health Network • {patients.length} Active Subjects
          </p>
        </div>

        <div className="relative group w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-500 transition-colors" />
          <input 
            type="text"
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/60 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-700 font-medium"
          />
        </div>
      </div>

      {/* ── PATIENT GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPatients.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[40px] opacity-30">
            <p className="text-xs font-black uppercase tracking-widest">No patient records found in this sector</p>
          </div>
        ) : (
          filteredPatients.map((p) => (
            <div 
              key={p.patient_id}
              onClick={() => setSelectedPatient(p)}
              className="group bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[32px] p-6 hover:border-sky-500/30 transition-all cursor-pointer shadow-xl relative overflow-hidden"
            >
              {/* Subtle background ID */}
              <div className="absolute -right-4 -bottom-4 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform">
                 <User size={120} />
              </div>

              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-500 border border-sky-500/20 group-hover:bg-sky-500 group-hover:text-white transition-all shadow-sm">
                  <User size={24} />
                </div>
                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                  p.status === 'critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 animate-pulse' :
                  p.status === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                  'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                }`}>
                  {p.status || 'stable'}
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-sky-400 transition-colors">
                  {p.first_name} {p.last_name}
                </h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  PT-ID: {p.patient_id.toString().padStart(4, '0')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <MapPin size={12} className="text-slate-600" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase truncate">{p.address || 'Sector Node'}</span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <Clock size={12} className="text-slate-600" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'New Entry'}
                  </span>
                </div>
              </div>

              {/* Quick Action Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/dashboard/caregiver/report', { state: { patient: p } });
                }}
                className="mt-6 w-full py-3 bg-white/5 hover:bg-sky-500 border border-white/10 hover:border-sky-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/20 active:scale-95"
              >
                <Activity size={14} /> Log Vitals
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
