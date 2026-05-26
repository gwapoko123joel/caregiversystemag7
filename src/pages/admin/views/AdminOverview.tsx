import { useState, useEffect } from 'react'
import { Users, Activity, User, Clock, RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react'
import { useOutletContext, Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import type { AdminDashboardContextType } from '../AdminDashboard'
import { EmptyState } from '../../../components/ClinicalPolish'

export default function AdminOverview() {
  const { users, logs, performance, error, loadData } = useOutletContext<AdminDashboardContextType>()

  const [inspectingNode, setInspectingNode] = useState<any>(null);
  const [nodePatients, setNodePatients] = useState<any[]>([]);

  const [stats, setStats] = useState({
    authorizedNodes: 0,
    onDutyFleet: 0,
    dailyTelemetry: 0,
    criticalTriage: 0
  });

  const fetchAdminStats = async () => {
    // Authorized Nodes
    const { count: authorizedCount } = await supabase
      .from('caregivers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'authorized');

    // On-Duty Fleet
    const { count: onDutyCount } = await supabase
      .from('caregivers')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'caregiver')
      .eq('duty_status', 'on_duty');

    // Daily Telemetry
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: telemetryCount } = await supabase
      .from('patient_monitoring_logs')
      .select('*', { count: 'exact', head: true })
      .gte('recorded_at', yesterday);

    // Critical Triage
    const { count: criticalCount } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'critical');

    setStats({
      authorizedNodes: authorizedCount || 0,
      onDutyFleet: onDutyCount || 0,
      dailyTelemetry: telemetryCount || 0,
      criticalTriage: criticalCount || 0
    });
  };

  useEffect(() => {
    fetchAdminStats();

    const channel1 = supabase.channel('admin-overview-caregivers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'caregivers' }, () => {
        fetchAdminStats();
      })
      .subscribe();

    const channel2 = supabase.channel('admin-overview-logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patient_monitoring_logs' }, () => {
        fetchAdminStats();
      })
      .subscribe();

    const channel3 = supabase.channel('admin-overview-patients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
        fetchAdminStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
      supabase.removeChannel(channel3);
    };
  }, []);

  async function handleInspectNode(caregiver: any) {
    setInspectingNode(caregiver);

    // Fetch all patients assigned to THIS specific caregiver
    const { data, error } = await supabase
      .from('caregiver_patient_assignments')
      .select(`
        patient:patients (
          patient_id,
          first_name,
          last_name,
          address,
          status
        )
      `)
      .eq('caregiver_id', caregiver.caregiver_id);

    if (!error && data) {
      setNodePatients(data.map((item: any) => item.patient));
    }
  }

  const handleRetry = () => {
    loadData()
  }

  if (error) {
    return (
      <EmptyState
        title="Sync Pipeline Error"
        message={`The administrative node failed to synchronize clinical data: ${error}`}
        onRetry={handleRetry}
        icon={RefreshCw}
      />
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">

      {/* ── HEADER ── */}
      <div className="px-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shadow-[0_0_10px_#0ea5e9]" />
          <span className="text-[10px] font-semibold text-sky-500 uppercase tracking-[0.4em]">Node: Administrative Central</span>
        </div>
        <h2 className="text-4xl font-semibold text-slate-50 uppercase tracking-tighter leading-tight">
          System <span className="text-sky-500">Governance</span>
        </h2>
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-2 leading-relaxed">
          Barangay Bantayan Oversight • Security & Coordination Protocol
        </p>
      </div>

      {/* ── SECTION 1: GLOBAL HUD ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatItem
          label="Authorized Nodes"
          value={stats.authorizedNodes}
          sub="Verified Personnel"
          icon={<ShieldCheck size={18} />}
          color="sky"
        />
        <StatItem
          label="On-Duty Fleet"
          value={stats.onDutyFleet}
          sub="Active in Field"
          icon={<Users size={18} />}
          color="emerald"
          pulse={stats.onDutyFleet > 0}
        />
        <StatItem
          label="Daily Telemetry"
          value={stats.dailyTelemetry}
          sub="Logs (Last 24h)"
          icon={<Activity size={18} />}
          color="sky"
        />
        <StatItem
          label="Critical Triage"
          value={stats.criticalTriage}
          sub="Active Emergencies"
          icon={<AlertCircle size={18} />}
          color="rose"
          pulse={stats.criticalTriage > 0}
        />
      </div>

      {/* ── SECTION 2: PERSONNEL NODE PERFORMANCE (PRIORITIZED TOP) ── */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-sky-500 rounded-full" />
            <h3 className="text-sm font-semibold text-slate-50 uppercase tracking-tighter leading-tight">Personnel Node Performance</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest italic">Live Efficiency Matrix</span>
        </div>

        {/* 4-Column Grid for high-density overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {performance.map(staff => (
            <div
              key={staff.caregiver_id}
              onClick={() => handleInspectNode(staff)}
              className="p-5 bg-slate-950/40 border border-white/5 rounded-[32px] hover:border-sky-500/50 hover:bg-slate-900/60 transition-all group cursor-pointer relative overflow-hidden"
            >
              {/* Background Accent */}
              <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-10 transition-opacity">
                <Activity size={60} />
              </div>

              <div className="flex justify-between items-start mb-5">
                <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-slate-600 group-hover:text-sky-500 transition-colors">
                  <User size={18} />
                </div>
                <div className="bg-sky-500/10 text-sky-500 border border-sky-500/20 px-2.5 py-1 rounded-xl text-[9px] font-bold tracking-tighter">
                  {staff.total_reports} LOGS
                </div>
              </div>

              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-semibold text-slate-50 uppercase truncate leading-relaxed">{staff.full_name}</p>
                {staff.status === 'pending' && (
                  <span className="text-[7px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase tracking-widest">
                    Awaiting Auth
                  </span>
                )}
              </div>
              <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">{staff.unique_access_id}</p>

              <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock size={10} className={staff.duty_status === 'on_duty' ? 'text-emerald-500 animate-pulse' : 'text-slate-700'} />
                  {staff.duty_status === 'on_duty' ? (
                    <p className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest animate-pulse leading-relaxed">
                      Active Now
                    </p>
                  ) : (
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                      {staff.last_report_sent ? new Date(staff.last_report_sent).toLocaleDateString() : 'Inactive'}
                    </p>
                  )}
                </div>
                <div className={`w-1.5 h-1.5 rounded-full ${staff.duty_status === 'on_duty' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse' : 'bg-slate-800'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 3: THE LOWER HUB (60/40 Split) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">

        {/* LEFT: ENROLLMENT (6 Spans) */}
        <div className="lg:col-span-6 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
              <h3 className="text-sm font-semibold text-slate-50 uppercase tracking-tighter leading-tight">Recent Enrollments</h3>
            </div>
            <Link to="/dashboard/admin/users" className="text-[9px] font-semibold text-sky-500 uppercase tracking-[0.2em] hover:text-sky-400">Manage All →</Link>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
            {users.map(u => (
              <div key={u.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 border border-white/5 font-semibold uppercase">
                    {u.full_name?.[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-50 uppercase leading-relaxed">{u.full_name}</p>
                    <p className="text-[9px] text-slate-600 font-medium leading-relaxed">{u.email || 'Node Unregistered'}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase ${u.status === 'authorized' ? 'text-emerald-500' : 'text-amber-500'}`}>
                  <div className={`w-1 h-1 rounded-full ${u.status === 'authorized' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  {u.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: GLOBAL ACTIVITY (4 Spans) */}
        <div className="lg:col-span-4 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-8 shadow-2xl h-full">
          <h3 className="text-sm font-semibold text-slate-50 uppercase mb-8 tracking-tighter leading-tight">Global Activity</h3>
          <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2">
            {logs.map((log) => (
              <div key={log.log_id} className="relative pl-6 pb-6 border-l border-white/5 last:border-l-0">
                <div className="absolute -left-[4.5px] top-0 w-2 h-2 rounded-full bg-slate-800 border border-sky-500/50" />
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-semibold text-slate-50 uppercase tracking-tight leading-relaxed">{log.action.replace('_', ' ')}</p>
                    <p className="text-[7px] font-bold text-slate-600 font-mono leading-relaxed">{new Date(log.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <p className="text-[8px] text-slate-500 mt-1 uppercase tracking-tighter truncate opacity-70 leading-relaxed">
                    Audit ID: {log.user_id?.slice(-6)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PERSONNEL INTELLIGENCE OVERLAY ── */}
      {inspectingNode && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-[#020617]/90 backdrop-blur-lg animate-in fade-in duration-300">
          <div className="max-w-2xl w-full bg-slate-900 border border-white/10 rounded-[40px] p-10 shadow-2xl relative overflow-hidden">

            {/* Header */}
            <div className="flex items-center gap-6 mb-10">
              <div className="w-20 h-20 bg-sky-500/10 rounded-[2rem] flex items-center justify-center text-sky-500 border border-sky-500/20">
                <User size={40} />
              </div>
              <div>
                <h3 className="text-3xl font-semibold text-slate-50 uppercase tracking-tighter leading-tight">{inspectingNode.full_name}</h3>
                <p className="text-sky-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1 leading-relaxed">
                  Active Field Node • {inspectingNode.unique_access_id}
                </p>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                <p className="text-[8px] font-semibold text-slate-500 uppercase mb-1 leading-relaxed">Total Impact</p>
                <p className="text-xl font-bold text-slate-50 leading-relaxed">{inspectingNode.total_reports} Reports Sent</p>
              </div>
              <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                <p className="text-[8px] font-semibold text-slate-500 uppercase mb-1 leading-relaxed">Node Vitality</p>
                <p className="text-xl font-semibold text-emerald-500 uppercase leading-relaxed">Optimal</p>
              </div>
            </div>

            {/* Assigned Subjects List */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-2">Assigned Subject Registry</h4>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                {nodePatients.length === 0 ? (
                  <p className="text-xs text-slate-600 italic p-4 text-center border border-dashed border-white/5 rounded-2xl leading-relaxed">No patients currently assigned to this node.</p>
                ) : (
                  nodePatients.map(p => (
                    <div key={p.patient_id} className="p-4 bg-white/5 rounded-2xl flex items-center justify-between border border-white/5">
                      <span className="text-xs font-bold text-slate-50 uppercase">{p.first_name} {p.last_name}</span>
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${p.status === 'critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                        }`}>
                        {p.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => setInspectingNode(null)}
              className="mt-10 w-full py-4 bg-white/5 hover:bg-white/10 text-slate-50 rounded-2xl text-[10px] font-semibold uppercase tracking-widest transition-all"
            >
              Close Intelligence Node
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- HELPER COMPONENT: STAT ITEM ---
function StatItem({ label, value, sub, icon, color, pulse = false }: any) {
  const colors: any = {
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  };

  const pulseBorderColors: any = {
    sky: 'border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.3)]',
    emerald: 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    rose: 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
  };

  const bgPulse = pulse ? 'animate-pulse' : '';

  return (
    <div className={`bg-slate-900/40 backdrop-blur-md border border-white/5 p-6 rounded-[32px] flex flex-col justify-between h-36 shadow-xl hover:bg-slate-900/60 transition-all group ${pulse ? pulseBorderColors[color] : ''} ${bgPulse}`}>
      <div className="flex justify-between items-center">
        <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest leading-relaxed">{label}</p>
        <div className={`p-2 rounded-xl ${colors[color]} relative overflow-hidden`}>
          {pulse && <div className={`absolute inset-0 ${color === 'rose' ? 'bg-rose-500' : 'bg-emerald-500'} opacity-20 animate-ping rounded-xl`} />}
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-slate-50 tracking-tighter leading-tight">{value}</h3>
        <p className="text-[8px] font-semibold text-slate-600 uppercase mt-1 leading-relaxed">{sub}</p>
      </div>
    </div>
  );
}
