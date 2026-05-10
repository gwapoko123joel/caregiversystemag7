import { useState, useEffect } from 'react'
import { 
  ArrowLeft, User, Activity, Calendar, 
  MapPin, Heart, Wind, Thermometer, 
  Droplet, FileText, Clock, AlertCircle,
  Loader2, Plus, ChevronRight
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from '../../../hooks/useAuth'

interface PatientDetailsProps {
  patient: any
  onBack: () => void
}

export default function PatientDetails({ patient, onBack }: PatientDetailsProps) {
  const { user } = useAuth()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPatientLogs()
  }, [patient.patient_id])

  async function fetchPatientLogs() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('patient_monitoring_logs')
        .select('*')
        .eq('patient_id', patient.patient_id)
        .order('recorded_at', { ascending: false })

      if (error) throw error
      setLogs(data || [])
    } catch (err) {
      console.error("Error fetching logs:", err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
      case 'warning': return 'text-amber-500 bg-amber-500/10 border-amber-500/20'
      case 'critical': return 'text-rose-500 bg-rose-500/10 border-rose-500/20'
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20'
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-3 bg-card border border-card-border rounded-xl text-sidebar-text-muted hover:text-sky-500 transition-all active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-black tracking-tight uppercase text-text-main leading-tight">Patient Dossier</h2>
          <p className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-[0.2em] mt-1">Clinical ID: PT-{patient.patient_id.toString().padStart(4, '0')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Basic Info & Profile */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-card-border rounded-[32px] p-8 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-sky-500/10 border border-sky-500/20 rounded-3xl flex items-center justify-center text-sky-500 mb-6 shadow-lg">
              <User size={48} />
            </div>
            <h3 className="text-xl font-black text-text-main uppercase tracking-tight">{patient.first_name} {patient.last_name}</h3>
            <p className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-[0.2em] mt-1">{patient.gender || 'Unknown Gender'}</p>
            
            <div className="w-full grid grid-cols-1 gap-3 mt-8 pt-8 border-t border-card-border">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500"><Calendar size={16} /></div>
                <div>
                  <p className="text-[9px] font-black text-sidebar-text-muted uppercase tracking-widest leading-none">Date of Birth</p>
                  <p className="text-xs font-bold text-text-main mt-1">{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><MapPin size={16} /></div>
                <div>
                  <p className="text-[9px] font-black text-sidebar-text-muted uppercase tracking-widest leading-none">Home Address</p>
                  <p className="text-xs font-bold text-text-main mt-1">{patient.address || 'Barangay Bantayan'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-[32px] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={16} className="text-sky-500" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-text-main">Medical Context</h3>
            </div>
            <div className="bg-primary/30 rounded-2xl p-4 border border-card-border">
              <p className="text-xs text-sidebar-text-muted leading-relaxed italic">
                {patient.medical_history || 'No recorded pre-existing conditions or chronic medical history available for this patient.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Vitals History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-rose-500" />
              <h3 className="text-sm font-black uppercase tracking-widest text-text-main">Vital Signs History</h3>
            </div>
            <p className="text-[9px] font-black text-sidebar-text-muted uppercase tracking-widest">{logs.length} Total Updates</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-sidebar-text-muted">
              <Loader2 size={32} className="animate-spin mb-4 text-sky-500" />
              <p className="text-[10px] font-black uppercase tracking-widest">Retrieving Clinical Data...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="bg-card border border-card-border rounded-[32px] p-12 text-center">
              <div className="w-16 h-16 bg-primary/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-card-border text-sidebar-text-muted">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-sm font-black text-text-main uppercase tracking-tight">No Monitoring Logs</h3>
              <p className="text-xs text-sidebar-text-muted mt-2">There are no health logs recorded for this patient yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {logs.map((log) => (
                <div key={log.log_id} className="bg-card border border-card-border rounded-[24px] p-6 hover:border-sky-500/30 transition-all group shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${getStatusColor(log.physical_status)} shadow-sm`}>
                        <Activity size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-text-main uppercase tracking-tight">
                            {log.physical_status === 'stable' ? 'Stable Condition' : log.physical_status === 'warning' ? 'Observation Required' : 'Critical Update'}
                          </h4>
                          <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase border ${getStatusColor(log.physical_status)}`}>
                            {log.physical_status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-sidebar-text-muted uppercase tracking-widest font-bold">
                          <span className="flex items-center gap-1"><Clock size={12} /> {new Date(log.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>•</span>
                          <span>{new Date(log.recorded_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:flex md:items-center gap-4 md:gap-8">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-rose-500">
                          <Heart size={12} />
                          <p className="text-[9px] font-black uppercase tracking-widest">BPM</p>
                        </div>
                        <p className="text-lg font-black text-text-main leading-none">{log.vital_signs?.heart_rate || '--'}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sky-500">
                          <Wind size={12} />
                          <p className="text-[9px] font-black uppercase tracking-widest">O2 Sat</p>
                        </div>
                        <p className="text-lg font-black text-text-main leading-none">{log.vital_signs?.oxygen_saturation || '--'}%</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-amber-500">
                          <Thermometer size={12} />
                          <p className="text-[9px] font-black uppercase tracking-widest">Temp</p>
                        </div>
                        <p className="text-lg font-black text-text-main leading-none">{log.vital_signs?.temperature || '--'}°</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-500">
                          <Droplet size={12} />
                          <p className="text-[9px] font-black uppercase tracking-widest">BP</p>
                        </div>
                        <p className="text-lg font-black text-text-main leading-none">{log.vital_signs?.blood_pressure || '--'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Image & Notes Section */}
                  {(log.image_url || log.notes) && (
                    <div className="mt-6 flex flex-col md:flex-row gap-4 border-t border-card-border pt-4">
                      
                      {/* NEW: The Photo Display */}
                      {log.image_url && (
                        <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden border border-card-border group relative">
                          <img 
                            src={supabase.storage.from('patient-photos').getPublicUrl(log.image_url).data.publicUrl} 
                            alt="Clinical Observation" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <span className="text-[8px] text-white font-black uppercase tracking-widest">View Full Photo</span>
                          </div>
                        </div>
                      )}

                      {/* The Notes */}
                      {log.notes && (
                        <div className="flex-1 p-4 bg-primary/10 rounded-2xl border-l-2 border-sky-500 flex flex-col justify-between">
                          <div>
                            <p className="text-[8px] text-sidebar-text-muted font-black uppercase tracking-widest mb-1">Caregiver Observations</p>
                            <p className="text-[11px] text-text-main italic leading-relaxed">"{log.notes}"</p>
                          </div>
                          <div className="flex items-center gap-1.5 mt-2 opacity-50">
                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                            <span className="text-[8px] font-bold text-sidebar-text-muted uppercase tracking-tighter">Verified by {user?.role || 'BHW'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
