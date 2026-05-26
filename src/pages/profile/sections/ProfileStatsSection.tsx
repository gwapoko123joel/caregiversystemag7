import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, FileText, TrendingUp, Phone,
  PhoneCall, AlertTriangle, Timer,
  UserCheck, ClipboardCheck, Activity,
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import type { 
  CaregiverProfileStats, 
  PractitionerProfileStats, 
  AdminProfileStats,
  UserRole,
} from '../../../types/database';

interface Props {
  userId: string;
  role: UserRole;
}

interface StatCard {
  label: string;
  value: string | number;
  icon: any;
  accent: 'cyan' | 'emerald' | 'amber' | 'violet';
}

export function ProfileStatsSection({ userId, role }: Props) {
  const [stats, setStats] = useState<StatCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (role === 'caregiver') {
          const { data } = await supabase
            .from('caregiver_profile_stats')
            .select('*')
            .eq('caregiver_id', userId)
            .maybeSingle();
          
          if (data) {
            setStats(buildCaregiverStats(data));
          }
        } else if (role === 'medical_practitioner') {
          const { data } = await supabase
            .from('practitioner_profile_stats')
            .select('*')
            .eq('caregiver_id', userId)
            .maybeSingle();
          
          if (data) {
            setStats(buildPractitionerStats(data));
          }
        } else if (role === 'admin') {
          const { data } = await supabase
            .from('admin_profile_stats')
            .select('*')
            .eq('caregiver_id', userId)
            .maybeSingle();
          
          if (data) {
            setStats(buildAdminStats(data));
          }
        }
      } catch (error) {
        console.error('[ProfileStats] Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId, role]);

  const sectionTitle = {
    caregiver: 'Caregiver Activity',
    medical_practitioner: 'Consultation Statistics',
    admin: 'System Overview',
  }[role];

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-cyan-500/15 rounded-2xl p-8">
        <div className="h-6 w-48 bg-white/5 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (stats.length === 0) {
    return null;
  }

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-cyan-500/15 rounded-2xl p-8">
      <h3 className="text-sm font-light tracking-[0.2em] uppercase text-cyan-300 mb-6 
                     flex items-center gap-2">
        <Activity className="w-4 h-4" strokeWidth={1.5} />
        {sectionTitle}
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <StatCardComponent stat={stat} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function StatCardComponent({ stat }: { stat: StatCard }) {
  const accentMap = {
    cyan: { 
      bg: 'bg-cyan-500/10', 
      border: 'border-cyan-500/20', 
      icon: 'text-cyan-300',
      iconBg: 'bg-cyan-500/15',
    },
    emerald: { 
      bg: 'bg-emerald-500/10', 
      border: 'border-emerald-500/20', 
      icon: 'text-emerald-300',
      iconBg: 'bg-emerald-500/15',
    },
    amber: { 
      bg: 'bg-amber-500/10', 
      border: 'border-amber-500/20', 
      icon: 'text-amber-300',
      iconBg: 'bg-amber-500/15',
    },
    violet: { 
      bg: 'bg-violet-500/10', 
      border: 'border-violet-500/20', 
      icon: 'text-violet-300',
      iconBg: 'bg-violet-500/15',
    },
  };

  const colors = accentMap[stat.accent];
  const Icon = stat.icon;

  return (
    <div className={`p-4 rounded-xl ${colors.bg} ${colors.border} border
                   hover:scale-[1.02] transition-transform cursor-default`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg ${colors.iconBg} 
                       flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${colors.icon}`} strokeWidth={1.5} />
        </div>
      </div>
      <p className="text-2xl font-light text-slate-50 mb-1 leading-relaxed">{stat.value}</p>
      <p className="text-[10px] font-light tracking-[0.15em] uppercase text-slate-50/50 leading-relaxed">
        {stat.label}
      </p>
    </div>
  );
}

// Stat builders for each role
function buildCaregiverStats(data: CaregiverProfileStats): StatCard[] {
  return [
    {
      label: 'Assigned Patients',
      value: data.total_assigned_patients || 0,
      icon: Users,
      accent: 'cyan',
    },
    {
      label: 'Total Reports',
      value: data.total_reports_submitted || 0,
      icon: FileText,
      accent: 'emerald',
    },
    {
      label: 'Reports This Week',
      value: data.reports_this_week || 0,
      icon: TrendingUp,
      accent: 'amber',
    },
    {
      label: 'Consultations',
      value: data.total_consultations_initiated || 0,
      icon: Phone,
      accent: 'violet',
    },
  ];
}

function buildPractitionerStats(data: PractitionerProfileStats): StatCard[] {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  };

  return [
    {
      label: 'Consultations',
      value: data.total_consultations_received || 0,
      icon: PhoneCall,
      accent: 'cyan',
    },
    {
      label: 'This Week',
      value: data.consultations_this_week || 0,
      icon: TrendingUp,
      accent: 'emerald',
    },
    {
      label: 'Critical Cases',
      value: data.critical_consultations_handled || 0,
      icon: AlertTriangle,
      accent: 'amber',
    },
    {
      label: 'Avg Call Time',
      value: formatDuration(data.avg_call_duration_seconds),
      icon: Timer,
      accent: 'violet',
    },
  ];
}

function buildAdminStats(data: AdminProfileStats): StatCard[] {
  return [
    {
      label: 'Authorized Users',
      value: data.total_users_authorized || 0,
      icon: UserCheck,
      accent: 'cyan',
    },
    {
      label: 'Active Patients',
      value: data.total_active_patients || 0,
      icon: Users,
      accent: 'emerald',
    },
    {
      label: 'Pending Approvals',
      value: data.pending_approvals || 0,
      icon: ClipboardCheck,
      accent: 'amber',
    },
    {
      label: 'Admin Actions',
      value: data.total_admin_actions || 0,
      icon: Activity,
      accent: 'violet',
    },
  ];
}
