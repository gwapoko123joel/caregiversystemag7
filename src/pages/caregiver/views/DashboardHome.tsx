import { useState, useEffect } from 'react';
import { 
  User, TrendingUp, ChevronRight, 
  ClipboardList, Activity, Shield, 
  Phone, Bell, UserPlus, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../hooks/useAuth';

export default function DashboardHome({ assignedPatients, userProfile, recentLogs }: any) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [onlineDoctors, setOnlineDoctors] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [latestAnnouncement, setLatestAnnouncement] = useState<any>(null);
  const [localDutyStatus, setLocalStatus] = useState(userProfile?.duty_status || 'off_duty');
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [elapsedMs, setElapsedMs] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  const SHIFT_DURATION_MS = 9 * 60 * 60 * 1000;
  const shiftProgress = Math.min((elapsedMs / SHIFT_DURATION_MS) * 100, 100);
  const isWarningZone = elapsedMs >= 8 * 60 * 60 * 1000; // 8 hours
  const isOvertime = elapsedMs >= SHIFT_DURATION_MS; // 9 hours

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Live Chronograph Logic
  useEffect(() => {
    let interval: any;
    if (currentShift && currentShift.start_time) {
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
      
      updateTimer(); // Initial call
      interval = setInterval(updateTimer, 1000);
    }
    return () => clearInterval(interval);
  }, [currentShift]);

  const fetchOrders = async () => {
    if (!user) return;

    // 1. PHASE 1: Find only the patients assigned to VICTOR
    const { data: myAssignments, error: assignError } = await supabase
      .from('caregiver_patient_assignments')
      .select('patient_id')
      .eq('caregiver_id', user.id);

    // 2. LOGIC GATE: If Victor has no patients, stop here and show nothing
    if (!myAssignments || myAssignments.length === 0) {
      setOrders([]); // This clears the "Take medicine" ghost order
      return;
    }

    // 3. PHASE 2: Fetch orders ONLY for those specific patient IDs
    const myPatientIds = myAssignments.map(a => a.patient_id);

    const { data: secureOrders, error: orderError } = await supabase
      .from('clinical_instructions')
      .select(`
        *,
        doctor:caregivers!doctor_id (last_name),
        patient:patients!patient_id (first_name, last_name)
      `)
      .in('patient_id', myPatientIds) // <--- THIS KILLS THE CONFLICT
      .order('created_at', { ascending: false })
      .limit(5);

    if (!orderError) {
      setOrders(secureOrders || []);
    }
  };

  // Fetch logic (Preserving essential real-time dashboard data)
  const fetchData = async () => {
    if (user) {
      const { data: activeShift } = await supabase
        .from('personnel_shifts')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'completed')
        .order('start_time', { ascending: false })
        .limit(1)
        .single();
      if (activeShift) {
        setCurrentShift(activeShift);
      }
    }

    const { data: d } = await supabase
      .from('caregivers')
      .select('*')
      .eq('role', 'medical_practitioner')
      .neq('duty_status', 'off_duty');
    setOnlineDoctors(d || []);

    await fetchOrders();

    const { data: ann } = await supabase
      .from('system_announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    if (ann && ann[0]) setLatestAnnouncement(ann[0]);
  };

  useEffect(() => { 
    fetchData(); 
    
    const channel = supabase
      .channel('network-broadcasts')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'system_announcements' }, 
        fetchData
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // 1. Clock In Logic
  async function handleClockIn() {
    if (!user) return;
    const { data, error } = await supabase
      .from('personnel_shifts')
      .insert({ user_id: user.id, status: 'active' })
      .select().single();
      
    if (!error) {
      setCurrentShift(data);
      await supabase.from('caregivers').update({ duty_status: 'on_duty' }).eq('id', user.id);
      
      // Log for audit trail
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        user_type: 'caregiver',
        action: 'SHIFT_START',
        details: { shift_id: data.shift_id }
      });

      setLocalStatus('on_duty');
    }
  }

  // 2. Break Toggle Logic
  async function handleToggleBreak() {
    if (!user || !currentShift) return;
    const isStartingBreak = currentShift.status !== 'break';
    
    // Safety check: Cannot start a break if already on lunch
    if (isStartingBreak && currentShift.status === 'lunch') return;

    const update = isStartingBreak 
      ? { status: 'break', break_start: new Date().toISOString() } 
      : { status: 'active', break_end: new Date().toISOString() };

    const { error } = await supabase.from('personnel_shifts').update(update).eq('shift_id', currentShift.shift_id);
    
    if (!error) {
      setCurrentShift({...currentShift, ...update});
      const newDutyStatus = isStartingBreak ? 'on_break' : 'on_duty';
      await supabase.from('caregivers').update({ duty_status: newDutyStatus }).eq('id', user.id);
      setLocalStatus(newDutyStatus);
    }
  }

  // 3. Lunch Toggle Logic
  async function handleToggleLunch() {
    if (!user || !currentShift) return;
    const isStartingLunch = currentShift.status !== 'lunch';
    
    // Safety check: Cannot start a lunch if already on break
    if (isStartingLunch && currentShift.status === 'break') return;

    const update = isStartingLunch 
      ? { status: 'lunch', lunch_start: new Date().toISOString() } 
      : { status: 'active', lunch_end: new Date().toISOString() };

    const { error } = await supabase.from('personnel_shifts').update(update).eq('shift_id', currentShift.shift_id);
    
    if (!error) {
      setCurrentShift({...currentShift, ...update});
      const newDutyStatus = isStartingLunch ? 'on_break' : 'on_duty';
      await supabase.from('caregivers').update({ duty_status: newDutyStatus }).eq('id', user.id);
      setLocalStatus(newDutyStatus);
    }
  }

  // 4. Clock Out with Handover Note
  async function handleClockOut() {
    if (!user || !currentShift) return;
    const note = prompt("9-HOUR OPERATIONAL LIMIT MET.\nMANDATORY: Enter Clinical Handover Note for the next shift:");
    if (!note) return;

    await supabase.from('personnel_shifts').update({
      end_time: new Date().toISOString(),
      status: 'completed',
      handover_note: note
    }).eq('shift_id', currentShift.shift_id);

    await supabase.from('caregivers').update({ duty_status: 'off_duty' }).eq('id', user.id);
    
    // Log for audit trail
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      user_type: 'caregiver',
      action: 'SHIFT_END',
      details: { 
        shift_id: currentShift.shift_id,
        duration_ms: elapsedMs,
        duration_formatted: elapsedTime,
        handover_note: note
      }
    });

    setLocalStatus('off_duty');
    setCurrentShift(null);
    setElapsedTime('00:00:00');
    setElapsedMs(0);
    alert("Shift Terminated. Handover transmitted to network.");
  }

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const caregiverName = userProfile?.full_name?.split(' ')[0] || 'Caregiver';

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 pb-12 px-4 md:px-0">
      
      {/* ── HEADER: PERSONAL NODE STATUS ── */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-8 rounded-[40px] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full ${localDutyStatus === 'on_duty' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : localDutyStatus === 'on_break' ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' : 'bg-slate-500'} animate-pulse`} />
             <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${localDutyStatus === 'on_duty' ? 'text-emerald-500' : localDutyStatus === 'on_break' ? 'text-amber-500' : 'text-slate-500'}`}>
               {localDutyStatus === 'on_duty' ? 'Node Active' : localDutyStatus === 'on_break' ? 'Node Paused' : 'Node Offline'}
             </span>
          </div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
            Welcome, {caregiverName}
          </h2>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Barangay Bantayan Health Network • Coordination Hub</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="hidden lg:block text-right pr-6 border-r border-white/10">
              <p className="text-white font-mono text-xl font-bold">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
           </div>
           <button 
             onClick={() => navigate('/dashboard/caregiver/onboarding')}
             className="px-8 py-4 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-sky-500/20 active:scale-95 flex items-center gap-3"
           >
             <UserPlus size={16} /> Register New Patient
           </button>
        </div>
      </div>

      {/* ── AUTOMATED OVERTIME BANNER ── */}
      {currentShift && isOvertime && (
        <div className="bg-rose-500/20 border border-rose-500/50 p-5 rounded-[28px] flex items-center gap-5 animate-pulse shadow-[0_0_20px_rgba(225,29,72,0.3)]">
          <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-500/20">
            <AlertTriangle size={22} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-rose-500 text-white text-[7px] font-black px-2 py-0.5 rounded tracking-widest">SHIFT OVERRUN</span>
              <h4 className="text-[11px] font-black text-rose-400 uppercase tracking-tighter">FATIGUE ALERT</h4>
            </div>
            <p className="text-xs text-white font-black italic">⚠️ SHIFT LIMIT REACHED: Please initialize handover protocol and synchronize final telemetry nodes.</p>
          </div>
        </div>
      )}

      {/* ── NETWORK BROADCAST BANNER ── */}
      {latestAnnouncement && (
        <div className="bg-sky-500/10 border border-sky-500/20 p-5 rounded-[28px] flex items-center gap-5 animate-in slide-in-from-top duration-700 shadow-lg shadow-sky-500/5">
          <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-sky-500/20 animate-pulse">
            <Bell size={22} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-sky-500 text-white text-[7px] font-black px-2 py-0.5 rounded tracking-widest">BROADCAST</span>
              <h4 className="text-[11px] font-black text-sky-400 uppercase tracking-tighter">{latestAnnouncement.title}</h4>
            </div>
            <p className="text-xs text-white font-medium italic">"{latestAnnouncement.message}"</p>
          </div>
          <div className="hidden sm:block text-right border-l border-white/10 pl-6">
             <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Received</p>
             <p className="text-[10px] font-mono text-slate-400">{new Date(latestAnnouncement.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
          </div>
        </div>
      )}

      {/* ── QUICK STATS HUD ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <StatCard label="Total Reports" value={recentLogs?.length || 0} icon={<ClipboardList size={20}/>} color="sky" />
        <StatCard label="Weekly Pulse" value={recentLogs?.length || 0} icon={<TrendingUp size={20}/>} color="emerald" />
        
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[32px] p-6 shadow-xl flex flex-col justify-center relative overflow-hidden group">
          {/* Status Glow Indicator */}
          <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity ${
            isOvertime ? 'bg-rose-500' :
            isWarningZone ? 'bg-amber-500' :
            currentShift?.status === 'active' ? 'bg-emerald-500' :
            currentShift?.status === 'break' || currentShift?.status === 'lunch' ? 'bg-amber-500' : 'bg-slate-500'
          }`} />

          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Operational Shift Protocol</h3>
            {currentShift && (
              <span className={`text-[9px] font-mono animate-pulse ${
                isOvertime ? 'text-rose-500' :
                isWarningZone ? 'text-amber-500' :
                currentShift.status === 'active' ? 'text-emerald-500' : 'text-amber-500'
              }`}>
                LIVE: {currentShift.shift_id.slice(0,8)}
              </span>
            )}
          </div>

          {!currentShift ? (
            <button onClick={handleClockIn} className="relative z-10 w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
              Initialize Shift
            </button>
          ) : (
            <div className="space-y-4 relative z-10">
              
              {/* SHIFT LIFECYCLE MONITOR */}
              <div className="p-5 bg-slate-950/60 rounded-2xl border border-white/5 flex flex-col shadow-inner gap-4">
                 <div className="flex items-center justify-between">
                   <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Shift Lifecycle Monitor</p>
                   <p className={`text-3xl font-mono font-black tracking-tight ${
                     isOvertime ? 'text-rose-500 drop-shadow-[0_0_12px_rgba(225,29,72,0.4)] animate-pulse' :
                     isWarningZone ? 'text-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]' :
                     currentShift.status === 'active' ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                   }`}>
                     {(() => {
                       const [h, m, s] = elapsedTime.split(':');
                       if (!h || !m || !s) return elapsedTime;
                       return (
                         <>
                           {h}<span className="animate-pulse opacity-50">:</span>{m}<span className="animate-pulse opacity-50">:</span>{s}
                         </>
                       );
                     })()}
                   </p>
                 </div>
                 
                 {/* Progress Bar */}
                 <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden shadow-inner">
                   <div 
                     className={`h-full transition-all duration-1000 rounded-full ${
                       isOvertime ? 'bg-rose-500 shadow-[0_0_10px_#e11d48] animate-pulse' :
                       isWarningZone ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' :
                       'bg-emerald-500 shadow-[0_0_10px_#10b981]'
                     }`}
                     style={{ width: `${shiftProgress}%` }}
                   />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button 
                  onClick={handleToggleBreak} 
                  disabled={currentShift.status === 'lunch'}
                  className={`py-3 rounded-xl font-black uppercase text-[9px] transition-colors active:scale-95 border ${
                    currentShift.status === 'break' 
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' 
                      : 'bg-amber-500/5 border-amber-500/10 text-amber-600 hover:bg-amber-500/10'
                  } ${currentShift.status === 'lunch' ? 'opacity-30 cursor-not-allowed hover:bg-amber-500/5' : ''}`}
                >
                  {currentShift.status === 'break' ? 'End Break' : 'Start Break'}
                </button>
                
                <button 
                  onClick={handleToggleLunch} 
                  disabled={currentShift.status === 'break'}
                  className={`py-3 rounded-xl font-black uppercase text-[9px] transition-colors active:scale-95 border ${
                    currentShift.status === 'lunch' 
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' 
                      : 'bg-amber-500/5 border-amber-500/10 text-amber-600 hover:bg-amber-500/10'
                  } ${currentShift.status === 'break' ? 'opacity-30 cursor-not-allowed hover:bg-amber-500/5' : ''}`}
                >
                  {currentShift.status === 'lunch' ? 'End Lunch' : 'Start Lunch'}
                </button>

                <button onClick={handleClockOut} className={`py-3 rounded-xl font-black uppercase text-[9px] transition-colors active:scale-95 border ${
                  isOvertime || isWarningZone ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)] animate-pulse' : 'bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20 text-rose-500'
                }`}>
                  Terminate Shift
                </button>
              </div>

              <div className="pt-4 border-t border-white/5">
                <h4 className="text-[8px] font-black uppercase text-slate-500 mb-3 tracking-widest">Shift Activity Ledger</h4>
                <div className="relative pl-3 space-y-3 border-l border-sky-500/20">
                  {/* Start Milestone */}
                  <div className="relative">
                    <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    <div className="flex justify-between items-center">
                       <p className="text-[8px] font-black uppercase text-slate-400">Ingress Sequence</p>
                       <p className="text-[10px] font-mono text-sky-400">{formatTime(currentShift.start_time)}</p>
                    </div>
                  </div>
                  
                  {/* Break Milestone */}
                  <div className="relative">
                    <div className={`absolute -left-[17px] top-1 w-2 h-2 rounded-full ${currentShift.break_start ? 'bg-amber-500' : 'bg-slate-700'}`} />
                    <div className="flex justify-between items-center">
                       <p className="text-[8px] font-black uppercase text-slate-400">Break Status</p>
                       <p className={`text-[10px] font-mono ${currentShift.break_start ? 'text-amber-400' : 'text-slate-600'}`}>
                         {formatTime(currentShift.break_start)} {currentShift.break_end ? `- ${formatTime(currentShift.break_end)}` : (currentShift.status === 'break' ? '- ACTIVE' : '')}
                       </p>
                    </div>
                  </div>

                  {/* Lunch Milestone */}
                  <div className="relative">
                    <div className={`absolute -left-[17px] top-1 w-2 h-2 rounded-full ${currentShift.lunch_start ? 'bg-amber-500' : 'bg-slate-700'}`} />
                    <div className="flex justify-between items-center">
                       <p className="text-[8px] font-black uppercase text-slate-400">Lunch Status</p>
                       <p className={`text-[10px] font-mono ${currentShift.lunch_start ? 'text-amber-400' : 'text-slate-600'}`}>
                         {formatTime(currentShift.lunch_start)} {currentShift.lunch_end ? `- ${formatTime(currentShift.lunch_end)}` : (currentShift.status === 'lunch' ? '- ACTIVE' : '')}
                       </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT GRID (2/3 vs 1/3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT: PATIENT ROSTER (Chunky Card) */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-sky-500 rounded-full" />
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Active Care Roster</h3>
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase">{assignedPatients?.length || 0} Patients Syncing</span>
          </div>

          <div className="grid gap-4">
            {assignedPatients?.map((p: any) => (
              <div 
                key={p.patient_id} 
                onClick={() => navigate('/dashboard/caregiver/report', { state: { patient: p } })}
                className="p-6 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-[32px] flex items-center justify-between group transition-all cursor-pointer hover:border-sky-500/30"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-500 border border-sky-500/20 group-hover:scale-110 transition-transform">
                    <User size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white uppercase tracking-tight">{p.first_name} {p.last_name}</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{p.address} • CASE #{p.patient_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="hidden md:block text-right">
                      <p className="text-[8px] font-black text-slate-600 uppercase">Monitoring Status</p>
                      <p className="text-[10px] font-black text-emerald-500 uppercase">Synchronized</p>
                   </div>
                   <ChevronRight size={20} className="text-slate-800 group-hover:text-sky-500 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: COORDINATION SIDEBAR */}
        <div className="space-y-6">
          {/* Doctors Widget */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Network Doctors</h3>
            <div className="space-y-4">
              {onlineDoctors.map(doc => (
                <div key={doc.prc_license || doc.id} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-[24px] border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <p className="text-xs font-black text-white uppercase">Dr. {doc.last_name}</p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase">Available</p>
                    </div>
                  </div>
                  <a href={`tel:${doc.phone_number}`} className="p-2 bg-sky-500/10 text-sky-500 rounded-lg hover:bg-sky-500 hover:text-white transition-all">
                    <Phone size={14} />
                  </a>
                </div>
              ))}
              {onlineDoctors.length === 0 && (
                <p className="text-center py-4 text-[10px] font-bold text-slate-700 uppercase italic">No doctors online</p>
              )}
            </div>
          </div>

          {/* Orders Widget */}
          <div className="bg-card border border-white/5 rounded-[40px] p-8 shadow-2xl">
            <h3 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
               <Bell size={14} /> Medical Orders
            </h3>
            
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="py-10 text-center opacity-20 flex flex-col items-center gap-3">
                   <ShieldCheck size={32} />
                   <p className="text-[10px] font-black uppercase tracking-widest">No Active Instructions</p>
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.instruction_id} className="p-4 bg-sky-500/5 border-l-2 border-sky-500 rounded-r-2xl">
                     {/* Added Patient Name for clarity */}
                     <p className="text-[9px] font-black text-sky-400 uppercase mb-1">
                       FOR: {order.patient?.first_name}
                     </p>
                     <p className="text-[11px] text-white italic mb-2">"{order.instruction_text}"</p>
                     <p className="text-[8px] font-black text-slate-500 uppercase">— DR. {order.doctor?.last_name}</p>
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

// --- REFINED STAT CARD COMPONENT ---
function StatCard({ label, value, icon, color, pulse, isMono }: any) {
  const colors: any = {
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    slate: 'text-slate-500 bg-slate-800/40 border-white/5'
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-6 rounded-[32px] flex flex-col justify-between h-32 shadow-xl hover:bg-slate-900/60 transition-all group">
      <div className="flex justify-between items-center">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
        <div className={`p-2 rounded-xl transition-transform group-hover:scale-110 ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className={`text-2xl font-black text-white ${isMono ? 'font-mono' : ''}`}>
          {value}
        </h3>
        {pulse && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />}
      </div>
    </div>
  );
}