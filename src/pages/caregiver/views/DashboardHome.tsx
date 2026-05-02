import { useState, useEffect } from 'react';
import { 
  User, 
  MapPin, 
  TrendingUp, 
  ChevronRight,
  Plus,
  RefreshCw,
  Clock,
  Shield,
  ClipboardList,
  Activity,
  AlertTriangle,
  Stethoscope,
  ArrowRight,
  Phone
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PatientCard from '../../../components/patients/PatientCard';
import { UserPlus } from 'lucide-react';
import type { Patient, PatientMonitoringLog } from '../../../types/database';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../hooks/useAuth';


interface DashboardHomeProps {
  patient: Patient | null;
  userProfile: any | null;
  loadingPatient: boolean;
  recentLogs: PatientMonitoringLog[];
}

export default function DashboardHome({ patient, userProfile, loadingPatient, recentLogs }: DashboardHomeProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [pendingPatients, setPendingPatients] = useState<Patient[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchAvailableDoctors = async () => {
    const { data } = await supabase
      .from('available_practitioners_directory')
      .select('*')
      .eq('availability_status', 'available')
      .limit(3);
    
    if (data) {
      setAvailableDoctors(data);
    }

    const { count } = await supabase
      .from('available_practitioners_directory')
      .select('*', { count: 'exact', head: true })
      .eq('availability_status', 'available');
    
    setAvailableCount(count || 0);
  };

  const fetchPendingPatients = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('patients')
      .select('*')
      .eq('registration_status', 'pending_verification')
      .eq('registered_by', user.id);
    if (data) setPendingPatients(data);
  };

  useEffect(() => {
    fetchAvailableDoctors();
    fetchPendingPatients();
    
    // Realtime subscription
    const channel = supabase
      .channel('dashboard-availability-sync')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'practitioner_availability' },
        () => fetchAvailableDoctors()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Stats calculation
  const totalReports = recentLogs.length;
  const reportsThisWeek = recentLogs.filter(log => {
    const logDate = new Date(log.recorded_at!);
    const now = new Date();
    const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
    return logDate > oneWeekAgo;
  }).length;

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const caregiverName = userProfile?.full_name?.split(' ')[0] || 'Caregiver';

  return (
    <div className="max-w-6xl mx-auto space-y-4 page-enter pb-10">
      
      {/* ── GREETING & CLOCK ── */}
      <div className="soft-card bg-slate-900 border-none flex flex-col md:flex-row md:items-center justify-between gap-4 p-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-light text-white  tracking-tight leading-none">
            {getGreeting()}, {caregiverName} 👋
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ">
            Welcome back to your caregiver dashboard.
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-3 px-6 py-3 bg-slate-950/50 rounded-2xl shadow-neumorphic-pressed border border-white/5">
            <Clock size={16} className="text-brand-cyan" />
            <div className="text-right">
              <p className="text-xs font-light text-white leading-none uppercase ">{formatTime(currentTime)}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1">{formatDate(currentTime)}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/dashboard/caregiver/onboarding')}
            className="w-full md:w-auto px-6 py-3 bg-sky-500/20 border border-sky-500/30 text-sky-400 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-sky-500/30 transition-all shadow-lg shadow-sky-500/5 active:scale-95"
          >
            <UserPlus size={16} /> Register New Patient
          </button>
        </div>
      </div>

      {/* ── QUICK STATS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatItem 
          label="Total Reports" 
          value={String(totalReports)} 
          icon={<ClipboardList size={18} />} 
          color="cyan" 
        />
        <StatItem 
          label="Reports This Week" 
          value={String(reportsThisWeek)} 
          icon={<TrendingUp size={18} />} 
          color="emerald" 
        />
        <StatItem 
          label="Session Logins" 
          value={String(userProfile?.login_count || 0)} 
          icon={<MonitorIcon size={18} />} 
          color="purple" 
        />
        <StatItem 
          label="Duty Status" 
          value={userProfile?.current_shift_status?.replace('_', ' ').toUpperCase() || 'OFF DUTY'} 
          icon={<Shield size={18} />} 
          color={userProfile?.current_shift_status === 'on_duty' || userProfile?.current_shift_status === 'active' ? 'emerald' : 'slate'}
          isActive={userProfile?.current_shift_status === 'on_duty' || userProfile?.current_shift_status === 'active'}
        />
      </div>

      {/* ── BENTO CENTER ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Assigned Patient Block */}
        <div className="lg:col-span-2 soft-card bg-slate-900 border-none relative overflow-hidden group min-h-[300px] flex flex-col">
          <div className="relative flex-1 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-6 bg-brand-cyan rounded-full" />
              <h3 className="text-sm font-light text-white uppercase tracking-widest ">Assigned Patient</h3>
            </div>

            {loadingPatient ? (
              <div className="animate-pulse space-y-4">
                <div className="h-10 w-2/3 bg-slate-800 rounded-xl" />
                <div className="h-4 w-1/2 bg-slate-800 rounded-xl" />
                <div className="h-4 w-1/3 bg-slate-800 rounded-xl" />
              </div>
            ) : patient ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="text-4xl font-light text-white uppercase  tracking-tighter leading-none">
                    {patient.first_name} {patient.last_name}
                  </h4>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-brand-cyan/10 text-brand-cyan text-[10px] font-light uppercase tracking-widest border border-brand-cyan/20 ">
                      Case #{patient.patient_id.toString().padStart(4, '0')}
                    </span>
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPin size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[200px]">{patient.address}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
                  <div>
                    <p className="text-[9px] font-light text-slate-600 uppercase tracking-widest mb-1">Birth Date</p>
                    <p className="text-xs font-bold text-slate-300 ">{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-light text-slate-600 uppercase tracking-widest mb-1">Status</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-emerald" />
                      <p className="text-xs font-bold text-brand-emerald uppercase ">{patient.status}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center gap-8 py-4">
                <div className="w-20 h-20 bg-slate-950/50 rounded-[2rem] border border-white/5 flex items-center justify-center text-slate-700 shadow-neumorphic-pressed shrink-0">
                   <AlertTriangle size={36} />
                </div>
                <div className="space-y-4 text-left">
                  <div className="space-y-1">
                    <p className="text-lg font-light text-white uppercase ">No Patient Assigned</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-[280px] leading-relaxed">Your administrator will assign a patient to your secure care node shortly.</p>
                  </div>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="flex items-center gap-2 px-6 py-3 bg-slate-950/50 border border-brand-cyan/20 rounded-xl text-[10px] font-light text-brand-cyan uppercase tracking-widest hover:bg-brand-cyan hover:text-slate-950 transition-all active:scale-95 shadow-lg shadow-brand-cyan/5"
                  >
                    <RefreshCw size={14} /> Refresh Node
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Block */}
        <div className="soft-card bg-slate-950 border border-white/5 flex flex-col h-full">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-brand-cyan rounded-full" />
                <h3 className="text-sm font-light text-white uppercase tracking-widest ">Doctors On Call</h3>
              </div>
              <div className="px-2 py-1 bg-brand-cyan/10 rounded-lg border border-brand-cyan/20">
                 <p className="text-[8px] font-bold text-brand-cyan uppercase tracking-widest">{availableCount} Available</p>
              </div>
           </div>
           
           <div className="flex-1 space-y-3">
              {availableDoctors.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-6 text-center space-y-3">
                   <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-slate-700">
                      <Stethoscope size={20} />
                   </div>
                   <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest max-w-[120px]">No doctors currently available</p>
                </div>
              ) : (
                availableDoctors.map((doc) => (
                  <a 
                    key={doc.caregiver_id}
                    href={`tel:${doc.clinical_hotline}`}
                    className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-white/5 hover:border-brand-cyan/30 transition-all group"
                  >
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-cyan/10 rounded-lg flex items-center justify-center text-brand-cyan">
                           <User size={16} />
                        </div>
                        <div>
                           <p className="text-[9px] font-bold text-white uppercase tracking-widest leading-none">{doc.full_name}</p>
                           <p className="text-[7px] text-slate-500 uppercase tracking-widest mt-1">{doc.prc_profession}</p>
                        </div>
                     </div>
                     <Phone size={14} className="text-brand-cyan group-hover:scale-110 transition-transform" />
                  </a>
                ))
              )}
           </div>

           <Link 
             to="/dashboard/caregiver/doctors"
             className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between group"
           >
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">Directory</span>
              <ArrowRight size={14} className="text-slate-600 group-hover:text-brand-cyan group-hover:translate-x-1 transition-all" />
           </Link>
        </div>
      </div>

      {/* ── PENDING APPROVAL SECTION ── */}
      {pendingPatients.length > 0 && (
        <div className="soft-card bg-slate-900 border-none space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
             <h3 className="text-sm font-light text-white uppercase tracking-widest ">Pending Approval</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingPatients.map(p => (
              <PatientCard key={p.patient_id} patient={p} showActions={false} />
            ))}
          </div>
        </div>
      )}

      {/* ── RECENT ACTIVITY BLOCK ── */}
      <div className="soft-card bg-slate-900 border-none space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-6 bg-brand-emerald rounded-full" />
             <h3 className="text-sm font-light text-white uppercase tracking-widest ">Recent Activity</h3>
          </div>
          {recentLogs.length > 0 && (
            <Link to="/dashboard/caregiver/history" className="flex items-center gap-1.5 text-[9px] font-light text-slate-500 uppercase tracking-[0.2em] hover:text-brand-cyan transition-colors ">
              View All <ChevronRight size={14} />
            </Link>
          )}
        </div>

        {recentLogs.length === 0 ? (
          <div className="flex items-center gap-8 py-6">
             <div className="w-20 h-20 bg-slate-950/50 rounded-[2rem] border border-white/5 flex items-center justify-center text-slate-700 shadow-neumorphic-pressed shrink-0">
                <ClipboardList size={36} />
             </div>
             <div className="space-y-4 text-left">
                <div className="space-y-1">
                   <p className="text-lg font-light text-white uppercase ">No reports submitted yet</p>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Start by sending your first patient health update to the care network.</p>
                </div>
                {patient && (
                  <Link 
                    to="/dashboard/caregiver/report" 
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand-cyan text-slate-950 rounded-xl text-[10px] font-light uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-brand-cyan/10 active:scale-95"
                  >
                    <Plus size={16} /> Submit First Report
                  </Link>
                )}
             </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {recentLogs.slice(0, 3).map((log) => (
              <div key={log.log_id} className="p-5 bg-slate-950/50 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-brand-cyan/20 transition-all">
                <div className="flex items-center gap-5">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      log.physical_status === 'stable' ? 'bg-brand-emerald/10 text-brand-emerald' : 
                      log.physical_status === 'warning' ? 'bg-brand-amber/10 text-brand-amber' : 'bg-brand-red/10 text-brand-red'
                   } shadow-neumorphic-pressed`}>
                      <Activity size={20} />
                   </div>
                   <div>
                      <p className="text-[10px] font-light text-slate-600 uppercase tracking-widest  leading-none">Record #{log.log_id.toString().slice(-4)}</p>
                      <h5 className="text-sm font-light text-white uppercase  mt-1 tracking-tight">
                        {log.physical_status === 'stable' ? 'Stable Condition' : log.physical_status === 'warning' ? 'Health Warning' : 'Critical Update'}
                      </h5>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1">Sent at {new Date(log.recorded_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                   </div>
                </div>
                <ChevronRight size={16} className="text-slate-800 group-hover:text-brand-cyan group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── HELPER COMPONENTS ─── */

interface StatItemProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: 'cyan' | 'emerald' | 'purple' | 'slate';
  isActive?: boolean;
}

const StatItem = ({ label, value, icon, color, isActive }: StatItemProps) => {
  const colors: any = {
    cyan: 'text-brand-cyan border-brand-cyan/30',
    emerald: 'text-brand-emerald border-brand-emerald/30',
    purple: 'text-brand-purple border-brand-purple/30',
    slate: 'text-slate-500 border-white/5',
  };
  
  return (
    <div className="soft-card bg-slate-900 border-none p-6 flex flex-col justify-between gap-4 group hover:bg-slate-800/50 transition-all">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-light text-slate-500 uppercase tracking-widest leading-none">{label}</p>
          <div className="flex items-center gap-1.5">
            {isActive ? (
              <div className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse" />
                 <span className="text-[8px] font-bold text-brand-emerald uppercase tracking-tighter">Active</span>
              </div>
            ) : (
              <span className="text-[8px] font-bold text-slate-700 uppercase tracking-tighter">Verified</span>
            )}
          </div>
        </div>
        <div className={`p-2 rounded-xl bg-slate-950/50 border ${colors[color]} ${colors[color].split(' ')[0]} shadow-lg transition-transform group-hover:scale-110`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-white tracking-tighter leading-none">{value}</p>
    </div>
  );
};



const MonitorIcon = (props: any) => (
  <svg 
    {...props} 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <line x1="8" x2="16" y1="21" y2="21" />
    <line x1="12" x2="12" y1="17" y2="21" />
  </svg>
);
