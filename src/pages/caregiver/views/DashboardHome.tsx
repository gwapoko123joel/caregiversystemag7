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
  ShieldCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
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

  // 2. Fetch Online Doctors
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

    // REAL-TIME: Listen for updates
    const ordersChannel = supabase
      .channel('new-medical-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clinical_instructions' }, () => fetchOrders())
      .subscribe();

    const doctorsChannel = supabase
      .channel('doctor-status-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'caregivers' }, () => fetchOnlineDoctors())
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(doctorsChannel);
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
    <div className="max-w-6xl mx-auto space-y-4 page-enter pb-10">

      {/* GREETING */}
      <div className="soft-card bg-slate-900 border-none flex flex-col md:flex-row md:items-center justify-between gap-4 p-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-light text-white tracking-tight leading-none">
            {getGreeting()}, {caregiverName} 👋
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ">
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
        <div className="lg:col-span-2 soft-card bg-slate-900 border-none min-h-[300px] flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-sky-400 rounded-full" />
            <h3 className="text-sm font-light text-white uppercase tracking-widest ">Active Care Roster</h3>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {assignedPatients.map(p => (
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
            ))}
          </div>
        </div>

        {/* Doctors & Orders */}
        <div className="space-y-6">
          {/* Doctors On Call */}
          <div className="bg-card border border-card-border rounded-[32px] p-6 shadow-sm">
            <h3 className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-[0.2em] mb-4">Doctors On Call</h3>
            <div className="space-y-3">
              {onlineDoctors.map(doc => (
                <div key={doc.prc_license} className="flex items-center justify-between p-3 bg-primary/20 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${doc.duty_status === 'available' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <p className="text-xs font-black text-text-main uppercase">Dr. {doc.last_name}</p>
                  </div>
                  
                  {/* THE FUNCTIONAL LINK */}
                  <a 
                    href={doc.phone_number ? `tel:${doc.phone_number}` : '#'}
                    onClick={(e) => { if(!doc.phone_number) { e.preventDefault(); alert("No number registered."); }}}
                    className="p-2 bg-slate-900 border border-white/10 rounded-xl text-sky-400 hover:bg-sky-500 hover:text-white transition-all shadow-sm flex items-center justify-center cursor-pointer"
                  >
                     <Phone size={14} />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Receive Orders Block */}
          <div className="bg-card border border-card-border rounded-[32px] p-6 shadow-sm">
            <h3 className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-[0.2em] mb-4">Medical Orders</h3>
            <div className="space-y-4">
              {orders.length === 0 ? (
                <p className="text-[10px] text-center opacity-30 uppercase font-black py-4">No Active Orders</p>
              ) : (
                orders.map((order) => (
                  <div 
                    key={order.instruction_id} 
                    className={`p-4 rounded-r-2xl border-l-4 transition-all ${
                      order.status === 'completed' 
                        ? 'bg-emerald-500/5 border-emerald-500 opacity-60' 
                        : 'bg-sky-500/5 border-sky-500'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${
                        order.status === 'completed' ? 'text-emerald-500' : 'text-sky-500'
                      }`}>
                        FOR: {order.patient?.first_name}
                      </span>
                      {order.status === 'completed' ? (
                        <span className="text-[8px] font-black text-emerald-500 uppercase flex items-center gap-1">
                          <ShieldCheck size={10} /> COMPLETED
                        </span>
                      ) : (
                        <span className="text-[8px] text-sidebar-text-muted">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[11px] text-text-main leading-relaxed mb-3 italic">
                      "{order.instruction_text}"
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-[8px] font-black text-sidebar-text-muted uppercase">
                        — Dr. {order.doctor?.last_name}
                      </div>
                      
                      {/* ONLY SHOW BUTTON IF NOT COMPLETED */}
                      {order.status !== 'completed' && (
                        <button 
                          onClick={() => handleAcknowledgeOrder(order.instruction_id)}
                          className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500 text-sky-500 hover:text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border border-sky-500/20"
                        >
                          Acknowledge Task
                        </button>
                      )}
                    </div>
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

/* HELPER COMPONENTS */
const StatItem = ({ label, value, icon, color, isActive }: any) => (
  <div className="soft-card bg-slate-900 border-none p-6 flex flex-col justify-between gap-4 group">
    <div className="flex items-center justify-between">
      <p className="text-[10px] font-light text-slate-500 uppercase tracking-widest">{label}</p>
      <div className={`p-2 rounded-xl bg-slate-950/50 border border-white/5 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
        {icon}
      </div>
    </div>
    <p className="text-3xl font-bold text-white tracking-tighter">{value}</p>
  </div>
);

const MonitorIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" /></svg>
);