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
  Phone,
  ShieldCheck,
  UserPlus,
  Monitor as MonitorIcon,
  Bell,
  Radio
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { Patient, PatientMonitoringLog } from '../../../types/database';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../hooks/useAuth';

interface DashboardHomeProps {
  patient: Patient | null;
  assignedPatients: Patient[];
  userProfile: any | null;
  loadingPatient: boolean;
  recentLogs: PatientMonitoringLog[];
}

export default function DashboardHome({ patient, assignedPatients, userProfile, loadingPatient, recentLogs }: DashboardHomeProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [onlineDoctors, setOnlineDoctors] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [latestAnnouncement, setLatestAnnouncement] = useState<any>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [localDutyStatus, setLocalStatus] = useState(userProfile?.duty_status || 'off_duty');

  useEffect(() => {
    if (userProfile?.duty_status) {
      setLocalStatus(userProfile.duty_status);
    }
  }, [userProfile?.duty_status]);

  async function toggleDutyStatus() {
    const newStatus = localDutyStatus === 'on_duty' ? 'off_duty' : 'on_duty';
    
    try {
      const { error } = await supabase
        .from('caregivers')
        .update({ duty_status: newStatus })
        .eq('id', user?.id);

      if (error) throw error;
      setLocalStatus(newStatus); // Update UI immediately
      
      // Create an audit trail entry
      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        user_type: 'caregiver',
        action: newStatus === 'on_duty' ? 'SHIFT_START' : 'SHIFT_END',
        details: { node_id: user?.id, status: newStatus }
      });

    } catch (err: any) {
      console.error("Shift Toggle Error:", err.message);
    }
  }

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // 1. Fetch Doctor's Orders (Instructions)
  const fetchOrders = async () => {
    const { data } = await supabase
      .from('clinical_instructions')
      .select(`
        *,
        doctor:caregivers!doctor_id (last_name),
        patient:patients!patient_id (first_name, last_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    setOrders(data || []);
  };

  // 2. Fetch Latest Broadcast
  const fetchNews = async () => {
    const { data } = await supabase
      .from('system_announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    if (data && data[0]) setLatestAnnouncement(data[0]);
  };

  async function handleAcknowledgeOrder(instructionId: string) {
    try {
      const { error } = await supabase
        .from('clinical_instructions')
        .update({ status: 'completed' }) // Mark as done
        .eq('instruction_id', instructionId);

      if (error) throw error;

      // Refresh orders list locally
      fetchOrders();
      
      // Optional: Log this action for the Admin's Audit Trail
      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        user_type: 'caregiver',
        action: 'ORDER_ACKNOWLEDGED',
        details: { instruction_id: instructionId }
      });

    } catch (err: any) {
      console.error("Acknowledgment failed:", err.message);
    }
  }

  // 3. Fetch Online Doctors
  const fetchOnlineDoctors = async () => {
    const { data } = await supabase
      .from('caregivers')
      .select('first_name, last_name, duty_status, prc_license, phone_number')
      .eq('role', 'medical_practitioner')
      .neq('duty_status', 'off_duty');

    setOnlineDoctors(data || []);
  };

  useEffect(() => {
    fetchOrders();
    fetchOnlineDoctors();
    fetchNews();

    // REAL-TIME: Listen for updates
    const ordersChannel = supabase
      .channel('new-medical-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clinical_instructions' }, () => fetchOrders())
      .subscribe();

    const doctorsChannel = supabase
      .channel('doctor-status-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'caregivers' }, () => fetchOnlineDoctors())
      .subscribe();

    const newsChannel = supabase
      .channel('news-stream')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_announcements' }, () => fetchNews())
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(doctorsChannel);
      supabase.removeChannel(newsChannel);
    };
  }, []);

  const formatDate = (date: Date) => date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const totalReports = recentLogs.length;
  const reportsThisWeek = recentLogs.filter(log => {
    const logDate = new Date(log.recorded_at!);
    const now = new Date();
    return logDate > new Date(now.setDate(now.getDate() - 7));
  }).length;

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const caregiverName = userProfile?.full_name?.split(' ')[0] || 'Caregiver';

  return (
    <div className="max-w-6xl mx-auto space-y-6 page-enter pb-10">

      {/* GREETING */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 shadow-2xl transition-all">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-none">
            {getGreeting()}, {caregiverName} 👋
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
            System connected — Secure Line
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-3 px-6 py-3 bg-slate-950/50 rounded-2xl border border-white/5 shadow-inner">
            <Clock size={16} className="text-sky-400" />
            <div className="text-right">
              <p className="text-xs font-light text-white leading-none uppercase">{formatTime(currentTime)}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1">{formatDate(currentTime)}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/caregiver/onboarding')}
            className="w-full md:w-auto px-6 py-3 bg-sky-500/20 border border-sky-500/30 text-sky-400 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-sky-500/30 transition-all active:scale-95"
          >
            <UserPlus size={16} /> Register Patient
          </button>
        </div>
      </div>

      {/* LATEST NETWORK ANNOUNCEMENT */}
      {latestAnnouncement && (
        <div className="mt-6 bg-sky-500/10 border border-sky-500/20 p-5 rounded-[28px] flex items-center gap-4 animate-in slide-in-from-top duration-1000 shadow-lg shadow-sky-500/5">
          <div className="w-10 h-10 bg-sky-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg animate-bounce">
            <Bell size={18} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
               <span className="bg-sky-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded">URGENT</span>
               <p className="text-[10px] font-black text-sky-400 uppercase tracking-tighter">{latestAnnouncement.title}</p>
            </div>
            <p className="text-xs text-white font-medium italic">"{latestAnnouncement.message}"</p>
          </div>
          <div className="text-right border-l border-white/10 pl-4">
             <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Received</p>
             <p className="text-[9px] font-mono text-slate-400">{new Date(latestAnnouncement.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
          </div>
        </div>
      )}

      {/* QUICK STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatItem label="Total Reports" value={String(totalReports)} icon={<ClipboardList size={18} />} color="cyan" />
        <StatItem label="Reports This Week" value={String(reportsThisWeek)} icon={<TrendingUp size={18} />} color="emerald" />
        <StatItem label="Session Logins" value={String(userProfile?.login_count || 0)} icon={<MonitorIcon size={18} />} color="purple" />
        <div onClick={toggleDutyStatus} className="cursor-pointer active:scale-95 transition-transform">
          <StatItem
            label="Duty Status"
            value={localDutyStatus === 'on_duty' ? 'ON DUTY' : 'OFF DUTY'}
            icon={<Shield size={18} />}
            color={localDutyStatus === 'on_duty' ? 'emerald' : 'slate'}
            isActive={localDutyStatus === 'on_duty'}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Roster */}
        <div className="lg:col-span-2 soft-card bg-slate-900 border-none min-h-[300px] flex flex-col p-8 rounded-[40px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-sky-400 rounded-full" />
            <h3 className="text-sm font-light text-white uppercase tracking-widest ">Active Care Roster</h3>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
            {assignedPatients.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-20 py-20">
                <User size={48} />
                <p className="text-[10px] font-black uppercase mt-4">No subjects assigned</p>
              </div>
            ) : (
              assignedPatients.map(p => (
                <div
                  key={p.patient_id}
                  onClick={() => navigate('/dashboard/caregiver/report', { state: { patient: p } })}
                  className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-sky-400/20 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-sky-400/10 rounded-xl flex items-center justify-center text-sky-400">
                      <User size={20} />
                    </div>
                    <div>
                      <h4 className="text-lg font-light text-white uppercase tracking-tight">{p.first_name} {p.last_name}</h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{p.address} • Case #{p.patient_id}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-800 group-hover:text-sky-400" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Doctors & Orders */}
        <div className="space-y-6">
          {/* Doctors On Call */}
          <div className="bg-card border border-card-border rounded-[32px] p-6 shadow-sm">
            <h3 className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-[0.2em] mb-4">Doctors On Call</h3>
            <div className="space-y-3">
              {onlineDoctors.length === 0 ? (
                <div className="text-center py-6 opacity-20 text-[10px] font-black uppercase">No Doctors Online</div>
              ) : (
                onlineDoctors.map(doc => (
                  <div key={doc.prc_license} className="flex items-center justify-between p-3 bg-primary/20 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-cyan/10 rounded-lg flex items-center justify-center text-brand-cyan">
                        <Stethoscope size={14} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-white uppercase">Dr. {doc.last_name}</p>
                        <p className="text-[8px] text-brand-cyan uppercase font-bold tracking-tighter">PRC: {doc.prc_license}</p>
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Instructions */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[32px] p-6 shadow-xl">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
               <ClipboardList size={14} className="text-sky-500" /> Pending Orders
             </h3>
             <div className="space-y-3">
                {orders.filter(o => o.status !== 'completed').length === 0 ? (
                  <p className="text-center py-6 opacity-20 text-[10px] font-black uppercase">Clear Protocol</p>
                ) : (
                  orders.filter(o => o.status !== 'completed').map(order => (
                    <div key={order.instruction_id} className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 group">
                       <p className="text-[8px] font-black text-sky-500 uppercase mb-1">Subject: {order.patient?.first_name} {order.patient?.last_name}</p>
                       <p className="text-xs text-white italic font-medium leading-relaxed mb-4">"{order.instruction_text}"</p>
                       <button 
                         onClick={() => handleAcknowledgeOrder(order.instruction_id)}
                         className="w-full py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-[8px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all"
                       >
                         Complete & Verify
                       </button>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, icon, color, isActive = false }: { label: string, value: string, icon: React.ReactNode, color: string, isActive?: boolean }) {
  const colorMap: Record<string, string> = {
    cyan: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
    emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    purple: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    slate: 'text-slate-400 bg-slate-400/10 border-white/5'
  };

  return (
    <div className={`p-6 bg-slate-900/40 backdrop-blur-xl border rounded-[32px] shadow-lg transition-all ${colorMap[color]} ${isActive ? 'ring-1 ring-emerald-500/50' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">{label}</p>
        <div className="opacity-80">{icon}</div>
      </div>
      <p className="text-2xl font-black text-white tracking-tighter">{value}</p>
    </div>
  );
}