import { useState, useEffect } from 'react';
import { 
  User, TrendingUp, ChevronRight, 
  ClipboardList, Activity, Shield, 
  Phone, Bell, UserPlus
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
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch logic (Preserving essential real-time dashboard data)
  const fetchData = async () => {
    const { data: d } = await supabase
      .from('caregivers')
      .select('*')
      .eq('role', 'medical_practitioner')
      .neq('duty_status', 'off_duty');
    setOnlineDoctors(d || []);

    const { data: o } = await supabase
      .from('clinical_instructions')
      .select('*, doctor:caregivers!doctor_id(last_name), patient:patients!patient_id(first_name)')
      .order('created_at', { ascending: false })
      .limit(3);
    setOrders(o || []);

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

  async function toggleDutyStatus() {
    const newStatus = localDutyStatus === 'on_duty' ? 'off_duty' : 'on_duty';
    const { error } = await supabase.from('caregivers').update({ duty_status: newStatus }).eq('id', user?.id);
    if (!error) {
      setLocalStatus(newStatus);
      // Log shift change for audit trail
      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        user_type: 'caregiver',
        action: newStatus === 'on_duty' ? 'SHIFT_START' : 'SHIFT_END',
        details: { status: newStatus }
      });
    }
  }

  const caregiverName = userProfile?.full_name?.split(' ')[0] || 'Caregiver';

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 pb-12 px-4 md:px-0">
      
      {/* ── HEADER: PERSONAL NODE STATUS ── */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-8 rounded-[40px] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shadow-[0_0_10px_#0ea5e9]" />
             <span className="text-[10px] font-black text-sky-500 uppercase tracking-[0.4em]">Node Active</span>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Reports" value={recentLogs?.length || 0} icon={<ClipboardList size={20}/>} color="sky" />
        <StatCard label="Weekly Pulse" value={recentLogs?.length || 0} icon={<TrendingUp size={20}/>} color="emerald" />
        <StatCard label="Session ID" value={user?.id.slice(0, 5)} icon={<Activity size={20}/>} color="purple" isMono />
        <div onClick={toggleDutyStatus} className="cursor-pointer group">
          <StatCard 
            label="Shift Protocol" 
            value={localDutyStatus === 'on_duty' ? 'ON DUTY' : 'OFF DUTY'} 
            icon={<Shield size={20}/>} 
            color={localDutyStatus === 'on_duty' ? 'emerald' : 'slate'}
            pulse={localDutyStatus === 'on_duty'}
          />
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
          <div className="bg-slate-900/60 backdrop-blur-md border border-sky-500/20 rounded-[40px] p-8 shadow-2xl ring-1 ring-sky-500/10">
            <h3 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
               <Bell size={14} /> Medical Orders
            </h3>
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.instruction_id} className="p-4 bg-sky-500/5 border-l-2 border-sky-500 rounded-r-2xl">
                   <p className="text-[11px] text-white leading-relaxed italic mb-2">"{order.instruction_text}"</p>
                   <p className="text-[8px] font-black text-slate-500 uppercase">— DR. {order.doctor?.last_name}</p>
                </div>
              ))}
              {orders.length === 0 && (
                <p className="text-center py-4 text-[10px] font-bold text-slate-700 uppercase italic">Clear protocol</p>
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