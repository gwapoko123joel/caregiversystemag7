import { 
  Users, 
  Zap, 
  TrendingUp, 
  ShieldAlert, 
  Phone, 
  Activity, 
  ChevronRight,
  User,
  ShieldCheck,
  XCircle,
  Clock,
  MessageSquare
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from '../../../hooks/useAuth'

import type { AlertItem } from '../types'

interface PractitionerOverviewProps {
  patientsCount: number
  alertCount: number
  totalAlerts: number
  criticalAlerts: AlertItem[]
  initiateCall: (caregiverName?: string, patientName?: string) => void
}

export default function PractitionerOverview({
  patientsCount,
  alertCount,
  totalAlerts,
  criticalAlerts,
  initiateCall
}: PractitionerOverviewProps) {
  const { user } = useAuth();
  const [activeBHWs, setActiveBHWs] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const [currentShift, setCurrentShift] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [previousHandover, setPreviousHandover] = useState<any>(null);

  useEffect(() => {
    const fetchActiveBHWs = async () => {
      const { data } = await supabase
        .from('caregivers')
        .select('id, full_name, unique_access_id, duty_status, phone_number')
        .eq('role', 'caregiver')
        .eq('duty_status', 'on_duty');
      setActiveBHWs(data || []);
    };

    fetchActiveBHWs();
    
    // Real-time listener for shift changes
    const channel = supabase.channel('bhw-presence')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'caregivers' }, fetchActiveBHWs)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchSessionData = async () => {
    if (!user) return;
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

    // Fetch previous handover
    const { data: prev } = await supabase
      .from('personnel_shifts')
      .select('handover_note, end_time, caregivers!inner(full_name, role)')
      .eq('status', 'completed')
      .eq('caregivers.role', 'medical_practitioner')
      .not('handover_note', 'is', null)
      .order('end_time', { ascending: false })
      .limit(1)
      .single();
    if (prev) setPreviousHandover(prev);
  };

  useEffect(() => {
    fetchSessionData();
  }, [user]);

  // Live Chronograph Logic
  useEffect(() => {
    let interval: any;
    if (currentShift && currentShift.start_time) {
      const updateTimer = () => {
        const start = new Date(currentShift.start_time).getTime();
        const now = new Date().getTime();
        const diff = Math.max(0, now - start);
        
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

  // Session Management Functions
  async function handleSessionStart() {
    if (!user) return;
    const { data, error } = await supabase
      .from('personnel_shifts')
      .insert({ user_id: user.id, status: 'active' })
      .select().single();
      
    if (!error) {
      setCurrentShift(data);
      await supabase.from('caregivers').update({ duty_status: 'available' }).eq('id', user.id);
    }
  }

  async function handleBreak(type: 'break' | 'lunch') {
    if (!user || !currentShift) return;
    const isStarting = currentShift.status !== type;
    
    // Safety check: Cannot start a break if already on lunch, etc.
    if (isStarting && (currentShift.status === 'break' || currentShift.status === 'lunch')) return;

    const update: any = { status: isStarting ? type : 'active' };
    if (type === 'break') {
       update[isStarting ? 'break_start' : 'break_end'] = new Date().toISOString();
    } else {
       update[isStarting ? 'lunch_start' : 'lunch_end'] = new Date().toISOString();
    }

    const { error } = await supabase.from('personnel_shifts').update(update).eq('shift_id', currentShift.shift_id);
    
    if (!error) {
      setCurrentShift({...currentShift, ...update});
      await supabase.from('caregivers').update({ duty_status: isStarting ? 'busy' : 'available' }).eq('id', user.id);
    }
  }

  async function handleSessionEnd() {
    if (!user || !currentShift) return;
    const note = prompt("MANDATORY: Enter Clinical Handover Memo for the next practitioner:");
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
      user_type: 'medical_practitioner',
      action: 'SESSION_END',
      details: { 
        shift_id: currentShift.shift_id,
        duration_formatted: elapsedTime,
        handover_note: note
      }
    });

    setCurrentShift(null);
    setElapsedTime('00:00:00');
    fetchSessionData();
    alert("Session Terminated. Handover Memo transmitted to network.");
  }

  const stats = {
    totalPatients: patientsCount,
    pendingAlerts: alertCount,
    totalLogs: totalAlerts
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* ── CLINICAL SESSION HUD ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Session Handover Box */}
         <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-6 rounded-[32px] shadow-2xl flex flex-col justify-center">
            <h3 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
               <MessageSquare size={14} /> Session Handover
            </h3>
            {previousHandover ? (
               <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                     Handover from Practitioner Node: {previousHandover.caregivers?.full_name}
                  </p>
                  <div className="p-4 bg-sky-500/5 border-l-2 border-sky-500 rounded-r-2xl">
                     <p className="text-[11px] text-white italic">"{previousHandover.handover_note}"</p>
                  </div>
                  <p className="text-[8px] font-mono text-slate-600 uppercase mt-2">
                     Terminated: {new Date(previousHandover.end_time).toLocaleTimeString()}
                  </p>
               </div>
            ) : (
               <div className="py-6 text-center opacity-20 flex flex-col items-center gap-3">
                   <ShieldCheck size={24} />
                   <p className="text-[9px] font-black uppercase tracking-widest">No Previous Handover Found</p>
               </div>
            )}
         </div>

         {/* Clinical Session Control Panel */}
         <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[32px] p-6 shadow-xl relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-20 transition-opacity ${
            currentShift?.status === 'active' ? 'bg-emerald-500' :
            currentShift?.status === 'break' || currentShift?.status === 'lunch' ? 'bg-amber-500' : 'bg-slate-500'
          }`} />

          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
               <Clock size={14} /> Clinical Session Management
            </h3>
            {currentShift && (
              <span className={`text-[9px] font-mono animate-pulse ${
                currentShift.status === 'active' ? 'text-emerald-500' : 'text-amber-500'
              }`}>
                LIVE: {currentShift.shift_id.slice(0,8)}
              </span>
            )}
          </div>

          {!currentShift ? (
            <button onClick={handleSessionStart} className="relative z-10 w-full py-5 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-sky-500/20 active:scale-95">
              Initialize Clinical Session
            </button>
          ) : (
            <div className="space-y-4 relative z-10">
              <div className="p-5 bg-slate-950/60 rounded-2xl border border-white/5 flex items-center justify-between shadow-inner">
                 <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Session Duration</p>
                 <p className={`text-3xl font-mono font-black tracking-tight ${
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button 
                  onClick={() => handleBreak('break')} 
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
                  onClick={() => handleBreak('lunch')} 
                  disabled={currentShift.status === 'break'}
                  className={`py-3 rounded-xl font-black uppercase text-[9px] transition-colors active:scale-95 border ${
                    currentShift.status === 'lunch' 
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' 
                      : 'bg-amber-500/5 border-amber-500/10 text-amber-600 hover:bg-amber-500/10'
                  } ${currentShift.status === 'break' ? 'opacity-30 cursor-not-allowed hover:bg-amber-500/5' : ''}`}
                >
                  {currentShift.status === 'lunch' ? 'End Lunch' : 'Start Lunch'}
                </button>

                <button onClick={handleSessionEnd} className="py-3 rounded-xl font-black uppercase text-[9px] transition-colors active:scale-95 border bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20 text-rose-500">
                  Terminate Session
                </button>
              </div>

              <div className="pt-4 border-t border-white/5 mt-4">
                <h4 className="text-[8px] font-black uppercase text-slate-500 mb-3 tracking-widest">Session Activity Ledger</h4>
                <div className="relative pl-3 space-y-3 border-l border-sky-500/20">
                  {/* Start Milestone */}
                  <div className="relative">
                    <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    <div className="flex justify-between items-center">
                       <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Node Initialization</p>
                       <p className="text-[10px] font-mono text-sky-400">{formatTime(currentShift.start_time)}</p>
                    </div>
                  </div>
                  
                  {/* Break Milestone */}
                  <div className="relative">
                    <div className={`absolute -left-[17px] top-1 w-2 h-2 rounded-full ${currentShift.break_start ? 'bg-amber-500' : 'bg-slate-700'}`} />
                    <div className="flex justify-between items-center">
                       <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Clinical Break</p>
                       <p className={`text-[10px] font-mono ${currentShift.break_start ? 'text-amber-400' : 'text-slate-600'}`}>
                         {formatTime(currentShift.break_start)} {currentShift.break_end ? `- ${formatTime(currentShift.break_end)}` : (currentShift.status === 'break' ? '- ACTIVE' : '')}
                       </p>
                    </div>
                  </div>

                  {/* Lunch Milestone */}
                  <div className="relative">
                    <div className={`absolute -left-[17px] top-1 w-2 h-2 rounded-full ${currentShift.lunch_start ? 'bg-amber-500' : 'bg-slate-700'}`} />
                    <div className="flex justify-between items-center">
                       <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Meal Intermission</p>
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

      {/* ── TOP LEVEL: LIVE PERSONNEL NODES ── */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_#10b981]" />
          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Live Personnel Nodes</h3>
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            {activeBHWs.length} Online
          </span>
        </div>

        {/* Responsive Grid for Nodes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {activeBHWs.length === 0 ? (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-[32px] bg-slate-900/20">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Scanning for active field signals...</p>
            </div>
          ) : (
            activeBHWs.map((bhw) => (
              <button 
                key={bhw.id} 
                onClick={() => setSelectedNode(bhw)}
                className="group relative bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[28px] p-5 flex flex-col items-start gap-4 hover:border-sky-500/50 hover:bg-slate-900/80 transition-all text-left shadow-2xl active:scale-95"
              >
                {/* Status Indicator */}
                <div className="absolute top-5 right-5">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                </div>

                <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-500 border border-sky-500/20 group-hover:bg-sky-500 group-hover:text-white transition-all">
                  <User size={24} />
                </div>

                <div>
                  <p className="text-sm font-black text-white uppercase tracking-tight leading-none group-hover:text-sky-400 transition-colors">
                    {bhw.full_name}
                  </p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase mt-2 tracking-widest">
                    Node: {bhw.unique_access_id}
                  </p>
                </div>

                <div className="w-full pt-4 border-t border-white/5 flex items-center justify-between">
                   <span className="text-[8px] font-black text-slate-600 uppercase">Field Operations</span>
                   <ChevronRight size={14} className="text-slate-700 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
      {/* ── EMERGENCY BANNER ── */}
      {criticalAlerts.length > 0 && (
        <div className="relative p-1 bg-gradient-to-r from-sky-500/50 to-slate-900/50 rounded-[32px] overflow-hidden group shadow-[0_0_40px_rgba(0,229,255,0.2)] animate-pulse">
           <div className="bg-slate-900/90 backdrop-blur-md rounded-[28px] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8 border border-white/5">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-sky-500/20 rounded-full flex items-center justify-center text-sky-500 animate-bounce">
                 <ShieldAlert size={24} className="md:w-8 md:h-8" />
              </div>
              <div className="flex-1 space-y-4 w-full">
                 <div className="text-center md:text-left">
                    <h3 className="text-lg md:text-2xl font-light text-sky-500 uppercase tracking-[0.1em] leading-none">Critical Emergency Detected</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{criticalAlerts.length} nodes reporting breaches</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {criticalAlerts.slice(0, 4).map(a => (
                      <div key={a.id} className="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-white/5 group/alert hover:border-sky-500/30 transition-all shadow-sm">
                         <div>
                            <div className="text-xs font-light text-white uppercase">{a.patient_name}</div>
                            <div className="text-[10px] font-bold text-sky-500/60 uppercase tracking-tighter mt-1">{a.vitals}</div>
                         </div>
                         <button 
                           onClick={() => initiateCall(undefined, a.patient_name)} 
                           className="p-3 md:p-2.5 bg-sky-500 rounded-xl text-white active:scale-95 transition-all shadow-lg"
                         >
                            <Phone size={14} className="fill-white" />
                         </button>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* ── SECTION 1: GLOBAL TELEMETRY HUD ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/dashboard/practitioner/feed" className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-8 shadow-2xl group transition-all hover:border-sky-500/30">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Network Roster</p>
            <Users className="text-sky-500 group-hover:scale-110 transition-transform" size={20} />
          </div>
          <h3 className="text-4xl font-black text-white">{stats.totalPatients}</h3>
          <p className="text-[9px] text-slate-500 font-bold uppercase mt-2">Active Synchronized Nodes</p>
        </Link>

        <Link to="/dashboard/practitioner/alerts" className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-8 shadow-2xl group transition-all hover:border-amber-500/30">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Pending Response</p>
            <Zap className="text-amber-500 group-hover:animate-pulse" size={20} />
          </div>
          <h3 className="text-4xl font-black text-white">{stats.pendingAlerts}</h3>
          <p className="text-[9px] text-amber-500/70 font-bold uppercase mt-2">Awaiting Practitioner Action</p>
        </Link>

        <Link to="/dashboard/practitioner/history" className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-8 shadow-2xl group transition-all hover:border-emerald-500/30">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Telemetry Flow</p>
            <TrendingUp className="text-emerald-500" size={20} />
          </div>
          <h3 className="text-4xl font-black text-white">{stats.totalLogs}</h3>
          <p className="text-[9px] text-emerald-500/70 font-bold uppercase mt-2">Total System Handshakes</p>
        </Link>
      </div>

      {/* ── SECTION 2: OPERATIONAL HUB ── */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[40px] p-12 relative overflow-hidden shadow-2xl">
        {/* Background Graphic */}
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none hidden lg:block">
          <Activity size={240} strokeWidth={1} className="text-sky-500" />
        </div>
        
        <div className="max-w-2xl relative z-10">
          <p className="text-sky-500 font-black text-[10px] uppercase tracking-[0.4em] mb-4">Operational Readiness</p>
          <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-6">
            Barangay Bantayan <br /> Monitoring Hub
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-10 max-w-lg">
            The regional network is currently processing synchronized telemetry from all deployed caregiver nodes. 
            Ensure all breaches are verified via secure consultation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/dashboard/practitioner/feed" className="px-10 py-5 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-sky-500/20 active:scale-95 text-center">
              Access Live Feed
            </Link>
            <Link to="/dashboard/practitioner/alerts" className="px-10 py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 text-center">
              Open Alert Center
            </Link>
          </div>
        </div>
      </div>

      {/* ── PERSONNEL INTEL OVERLAY ── */}
      <AnimatePresence>
        {selectedNode && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedNode(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            {/* Modal */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#020617] border border-white/10 rounded-[40px] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <ShieldCheck size={160} />
              </div>

              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 bg-sky-500/10 rounded-[2rem] flex items-center justify-center text-sky-500 border border-sky-500/20">
                  <User size={40} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">{selectedNode.full_name}</h3>
                  <p className="text-sky-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Authorized Field Node • {selectedNode.unique_access_id}</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Current Assignment</p>
                    <p className="text-sm text-white font-medium">Monitoring Barangay Bantayan - Sector A</p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <a href={`tel:${selectedNode.phone_number}`} className="p-4 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl flex flex-col items-center gap-2 transition-all group">
                       <Phone size={20} className="group-hover:rotate-12 transition-transform" />
                       <span className="text-[9px] font-black uppercase">Voice Consultation</span>
                    </a>
                    <button onClick={() => setSelectedNode(null)} className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl flex flex-col items-center gap-2 transition-all">
                       <XCircle size={20} />
                       <span className="text-[9px] font-black uppercase">Close Intel</span>
                    </button>
                 </div>
              </div>

              <p className="text-[8px] text-center text-slate-600 font-bold uppercase tracking-widest">
                Node Identity Verified via BantayanCare Security Protocol
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
