import { useState, useEffect } from 'react';
import { 
  User, TrendingUp, ChevronRight, 
  ClipboardList, 
  Phone, Bell, UserPlus, ShieldCheck, AlertTriangle, MessageSquare, X, Clock, Activity, Send, HeartPulse
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../hooks/useAuth';

export default function DashboardHome({ assignedPatients, recentLogs }: any) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [onlineDoctors, setOnlineDoctors] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [latestAnnouncement, setLatestAnnouncement] = useState<any>(null);
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [handoverData, setHandoverData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const SHIFT_DURATION_MS = 9 * 60 * 60 * 1000;
  const shiftProgress = Math.min((elapsedMs / SHIFT_DURATION_MS) * 100, 100);
  const isWarningZone = elapsedMs >= 8 * 60 * 60 * 1000; 
  const isOvertime = elapsedMs >= SHIFT_DURATION_MS;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // ── LIVE CHRONOGRAPH LOGIC ──
  useEffect(() => {
    let interval: any;
    if (currentShift && currentShift.start_time && currentShift.status !== 'completed') {
      const updateTimer = () => {
        const start = new Date(currentShift.start_time).getTime();
        const now = new Date().getTime();
        const diff = Math.max(0, now - start);
        setElapsedMs(diff);
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        const format = (n: number) => n.toString().padStart(2, '0');
        setElapsedTime(`${format(hours)}:${format(minutes)}:${format(seconds)}`);
      };
      
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setElapsedTime('00:00:00');
      setElapsedMs(0);
    }
    return () => clearInterval(interval);
  }, [currentShift]);

  const fetchOrders = async () => {
    if (!user) return;
    const { data: assignments } = await supabase
      .from('caregiver_patient_assignments')
      .select('patient_id')
      .eq('caregiver_id', user.id);

    if (!assignments || assignments.length === 0) {
      setOrders([]);
      return;
    }

    const myPatientIds = assignments.map(a => a.patient_id);
    const { data: filteredOrders } = await supabase
      .from('clinical_instructions')
      .select(`*, doctor:caregivers!doctor_id (last_name), patient:patients!patient_id (first_name, last_name)`)
      .in('patient_id', myPatientIds)
      .order('created_at', { ascending: false })
      .limit(5);

    setOrders(filteredOrders || []);
  };

  const fetchLastHandover = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('personnel_shifts')
      .select('*, user:caregivers!user_id(full_name, role)')
      .eq('status', 'completed')
      .neq('user_id', user.id) // <--- CRITICAL: Exclude self
      .order('end_time', { ascending: false })
      .limit(1);

    // Post-fetch check:
    if (data?.[0]?.user?.role === profile?.role) {
      const dismissedId = localStorage.getItem('dismissed_handover_id');
      if (dismissedId !== data[0].shift_id) {
        setHandoverData(data[0]);
      }
    } else {
      setHandoverData(null);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    if (user) {
      // 1. Get active shift
      const { data: activeShift } = await supabase
        .from('personnel_shifts')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'completed')
        .maybeSingle();
      
      setCurrentShift(activeShift || null);

      // 2. Get doctors
      const { data: d } = await supabase
        .from('caregivers')
        .select('*')
        .eq('role', 'medical_practitioner')
        .neq('duty_status', 'off_duty');
      setOnlineDoctors(d || []);

      await fetchOrders();
      await fetchLastHandover();

      // 3. Get announcements
      const { data: ann } = await supabase
        .from('system_announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      if (ann && ann[0]) setLatestAnnouncement(ann[0]);
    }
    setLoading(false);
  };

  useEffect(() => { 
    fetchData(); 
    const channel = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_announcements' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinical_instructions' }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  async function handleClockIn() {
    const { data, error } = await supabase
      .from('personnel_shifts')
      .insert({ user_id: user.id, status: 'active' })
      .select().single();
    if (!error) {
      setCurrentShift(data);
      await supabase.from('caregivers').update({ duty_status: 'on_duty' }).eq('id', user.id);
    }
  }

  async function handleClockOut() {
    const note = prompt("9-HOUR OPERATIONAL LIMIT MET.\nMANDATORY: Enter Clinical Handover Note for the next shift:");
    if (!note) return;
    await supabase.from('personnel_shifts').update({ end_time: new Date().toISOString(), status: 'completed', handover_note: note }).eq('shift_id', currentShift.shift_id);
    await supabase.from('caregivers').update({ duty_status: 'off_duty' }).eq('id', user.id);
    setCurrentShift(null);
    alert("Shift Terminated. Handover transmitted.");
  }

  // --- UTILITIES ---
  const calculateAge = (dob: string | undefined) => {
    if (!dob) return '--';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const formatName = (name: string) => {
    if (!name) return 'OPERATOR';
    return name.split(' ')[0].toUpperCase();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 pb-12 px-4 md:px-0 font-sans">
      
      {/* ── HANDOVER BRIEFING ── */}
      {handoverData && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-[32px] p-6 shadow-xl relative overflow-hidden group">
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-10 h-10 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/30">
              <ClipboardList size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-2">Incoming Handover Briefing</p>
              <p className="text-sm text-white font-medium italic">"{handoverData.handover_note}"</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase mt-4">Prepared by: {handoverData.user?.full_name}</p>
              <div className="mt-6 flex gap-3">
                 <button onClick={() => window.location.reload()} className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-lg active:scale-95">Synchronize Roster</button>
                 <button onClick={() => { localStorage.setItem('dismissed_handover_id', handoverData.shift_id); setHandoverData(null); }} className="px-4 py-2 bg-white/5 text-slate-500 rounded-xl text-[9px] font-black uppercase hover:text-white transition-all">Dismiss</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN HEADER: IDENTITY SYNC ── */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-8 rounded-[40px] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full ${currentShift ? 'bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse' : 'bg-slate-500'}`} />
             <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${currentShift ? 'text-emerald-500' : 'text-slate-500'}`}>
               {currentShift ? 'NODE ONLINE' : 'NODE OFFLINE'}
             </span>
          </div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
            System Login: {formatName(profile?.full_name)}
          </h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
            Authorized {profile?.role?.replace('_', ' ')} • Node ID: <span className="text-sky-500/80 font-mono">{profile?.unique_access_id}</span> • Barangay Bantayan Network
          </p>
        </div>
        
        <div className="flex items-center gap-4 z-10">
           <div className="hidden lg:block text-right pr-6 border-r border-white/10">
              <p className="text-white font-mono text-xl font-bold">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
           </div>
           <button onClick={() => navigate('/dashboard/caregiver/onboarding')} className="px-8 py-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-sky-500/20 transition-all active:scale-95 flex items-center gap-3">
             <UserPlus size={16} /> Register Patient
           </button>
        </div>
      </div>

      {/* ── BROADCAST ── */}
      {latestAnnouncement && (
        <div className="bg-sky-500/10 border border-sky-500/20 p-5 rounded-[28px] flex items-center gap-5 animate-in slide-in-from-top duration-700">
          <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-sky-500/20 animate-pulse"><Bell size={22} /></div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-sky-400 uppercase tracking-tighter">{latestAnnouncement.title}</p>
            <p className="text-xs text-white font-medium italic">"{latestAnnouncement.message}"</p>
          </div>
        </div>
      )}

      {/* ── CORE HUD ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <StatCard label="Total Reports" value={recentLogs?.length || 0} icon={<ClipboardList size={20}/>} color="sky" />
        <StatCard label="Weekly Pulse" value={recentLogs?.length || 0} icon={<TrendingUp size={20}/>} color="emerald" />
        
        <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-[40px] p-8 shadow-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Operational Shift Protocol</h3>
            {currentShift && <span className="text-[9px] font-mono text-emerald-500 animate-pulse">LIVE NODE: {currentShift.shift_id.slice(0,8)}</span>}
          </div>

          {!currentShift ? (
            <button onClick={handleClockIn} className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-95">Initialize Shift</button>
          ) : (
            <div className="space-y-6 relative z-10">
              <div className="p-6 bg-slate-950/60 rounded-3xl border border-white/5 flex items-center justify-between">
                 <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Session Duration</p>
                 <p className="text-4xl font-mono font-black text-emerald-400 drop-shadow-[0_0_10px_#10b981]">{elapsedTime}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ShiftActionBtn onClick={() => {}} label="Lunch/Break" icon={<Clock size={14}/>} active={currentShift.status === 'break'} />
                <ShiftActionBtn onClick={() => {}} label="System Break" icon={<Activity size={14}/>} active={false} />
                <button onClick={handleClockOut} className="py-4 bg-rose-500 hover:bg-rose-400 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Terminate Shift</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-[40px] p-8 shadow-2xl">
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8">Active Care Roster</h3>
          <div className="space-y-4">
            {assignedPatients?.map((p: any) => (
              <div key={p.patient_id} onClick={() => navigate('/dashboard/caregiver/report', { state: { patient: p } })} className="p-5 bg-white/[0.02] border border-white/5 rounded-[32px] flex items-center justify-between group cursor-pointer hover:border-sky-500/30 transition-all">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-500 border border-sky-500/20 group-hover:scale-110 transition-transform"><User size={24} /></div>
                  <div><h4 className="text-lg font-black text-white uppercase">{p.first_name} {p.last_name}</h4><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{p.address}</p></div>
                </div>
                <ChevronRight size={20} className="text-slate-800 group-hover:text-sky-500 transition-all" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-white/5 rounded-[40px] p-8 shadow-2xl">
            <h3 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
               <Bell size={14} /> Medical Orders
            </h3>
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="py-10 text-center opacity-20"><ShieldCheck size={32} className="mx-auto mb-2" /><p className="text-[10px] font-black uppercase tracking-widest">No Instructions</p></div>
              ) : (
                orders.map(o => (
                  <div key={o.instruction_id} className="p-4 bg-sky-500/5 border-l-2 border-sky-500 rounded-r-2xl">
                     <p className="text-[9px] font-black text-sky-400 uppercase mb-1">FOR: {o.patient?.first_name}</p>
                     <p className="text-[11px] text-white italic mb-2">"{o.instruction_text}"</p>
                     <p className="text-[8px] font-black text-slate-500 uppercase">— DR. {o.doctor?.last_name}</p>
                  </div>
                ))
              )}
            </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  const colors: any = { sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20', emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  return (
    <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[32px] flex flex-col justify-between h-36 shadow-xl hover:bg-slate-900/60 transition-all group">
      <div className="flex justify-between items-center"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p><div className={`p-2 rounded-xl ${colors[color]}`}>{icon}</div></div>
      <h3 className="text-3xl font-black text-white tracking-tighter">{value}</h3>
    </div>
  );
}

function ShiftActionBtn({ label, icon, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`py-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${active ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-white/5 text-slate-500 border-white/10 hover:text-white'}`}>
      {icon} {label}
    </button>
  );
}