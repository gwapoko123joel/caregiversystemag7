import { useEffect, useState } from 'react'
import { Search, User, MapPin, Activity, Loader2, Clock, ChevronRight } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from '../../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import PatientDetails from './PatientDetails' // Import the detail view

export default function PatientHistory() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // NEW: State to track which patient is being viewed
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

  // If a patient is selected, show the Detail View instead of the list
  if (selectedPatient) {
    return <PatientDetails patient={selectedPatient} onBack={() => setSelectedPatient(null)} />
  }

  const filteredPatients = patients.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-sky-500" /></div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-text-main uppercase tracking-tight">Patient Roster</h2>
          <p className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-[0.2em] mt-1">
            Clinical Records • {patients.length} Total Patients
          </p>
        </div>

        <div className="relative group max-w-sm w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:text-sky-500 transition-colors" />
          <input
            type="text"
            placeholder="Search patients by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-card-border rounded-xl py-3 pl-12 pr-4 text-text-main focus:outline-none focus:border-sky-500/50 transition-all text-sm font-medium"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredPatients.length === 0 ? (
          <div className="bg-card border border-card-border rounded-[32px] p-12 text-center">
            <div className="w-16 h-16 bg-primary/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-card-border text-sidebar-text-muted">
              <User size={32} />
            </div>
            <h3 className="text-sm font-black text-text-main uppercase tracking-tight">No Patients Found</h3>
            <p className="text-xs text-sidebar-text-muted mt-2">You don't have any patients assigned to your roster yet.</p>
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <div
              key={patient.patient_id}
              className="bg-card border border-card-border rounded-[24px] p-5 flex items-center justify-between hover:border-sky-500/50 transition-all cursor-pointer group shadow-sm hover:shadow-sky-500/5"
              onClick={() => setSelectedPatient(patient)} // Click to view details
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-center text-sky-500 group-hover:scale-110 transition-transform shadow-sm">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-text-main uppercase tracking-tight">
                    {patient.first_name} {patient.last_name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-sidebar-text-muted uppercase tracking-widest font-bold">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-rose-500" />
                      <span className="truncate max-w-[150px]">{patient.address}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Don't trigger the detail view
                    navigate('/dashboard/caregiver/report', { state: { patient } });
                  }}
                  className="hidden md:flex px-5 py-2.5 bg-primary/50 hover:bg-sky-500/10 border border-card-border hover:border-sky-500/50 rounded-xl text-[10px] font-black uppercase tracking-widest text-sidebar-text-muted hover:text-sky-500 transition-all items-center gap-2"
                >
                  <Activity size={14} /> Log Vitals
                </button>
                <div className="p-2 text-sidebar-text-muted group-hover:text-sky-500 group-hover:translate-x-1 transition-all">
                  <ChevronRight size={20} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
