import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  FileText,
  Bell,
  Video,
  ClipboardList,
  Users,
  Activity,
  ShieldCheck,
  Cpu,
  LogOut,
  Heart,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import type { UserRole } from '../lib/supabaseClient';

interface SidebarProps {
  alertCount?: number;
  onLogoutClick: () => void;
}

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  badge?: number;
}

const NAV: Record<UserRole, NavItem[]> = {
  caregiver: [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard',     path: '/dashboard/caregiver' },
    { icon: <User size={20} />,           label: 'My Patient',     path: '/dashboard/caregiver/patient' },
    { icon: <FileText size={20} />,       label: 'Submit Report',  path: '/dashboard/caregiver/report' },
    { icon: <ClipboardList size={20} />,  label: 'History',        path: '/dashboard/caregiver/history' },
    { icon: <Video size={20} />,          label: 'Emergency Call', path: '/dashboard/caregiver/call' },
  ],
  medical_practitioner: [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard',    path: '/dashboard/practitioner' },
    { icon: <Activity size={20} />,        label: 'Patient Feed', path: '/dashboard/practitioner/feed' },
    { icon: <Bell size={20} />,            label: 'Alert Center', path: '/dashboard/practitioner/alerts' },
    { icon: <Video size={20} />,           label: 'Video Console',path: '/dashboard/practitioner/video' },
    { icon: <ClipboardList size={20} />,   label: 'History Logs', path: '/dashboard/practitioner/history' },
  ],
  admin: [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard',      path: '/dashboard/admin' },
    { icon: <Users size={20} />,           label: 'User Management',path: '/dashboard/admin/users' },
    { icon: <ClipboardList size={20} />,   label: 'Activity Log',   path: '/dashboard/admin/logs' },
    { icon: <Cpu size={20} />,             label: 'System Health',  path: '/dashboard/admin/health' },
    { icon: <ShieldCheck size={20} />,     label: 'Security',       path: '/dashboard/admin/security' },
  ],
};

const ROLE_LABELS: Record<UserRole, string> = {
  caregiver: 'Caregiver',
  medical_practitioner: 'Practitioner',
  admin: 'System Admin',
};

export default function Sidebar({ alertCount = 0, onLogoutClick }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const role = profile?.role ?? 'caregiver';
  const navItems = NAV[role] ?? NAV.caregiver;

  const initials = (profile?.full_name ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();



  return (
    <aside className="hidden md:flex w-64 lg:w-72 h-screen !bg-sidebar border-r border-sidebar-border flex-col sticky top-0 z-40 transition-colors duration-300">
      
      <div className="p-8 pb-12 flex items-center justify-between">
        <div className="flex items-center gap-3 group/logo select-none">
          <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.3)] group-hover/logo:shadow-[0_0_20px_rgba(14,165,233,0.5)] transition-all">
            <Heart size={20} className="text-white fill-white" />
          </div>
          <span className="text-lg font-black tracking-tighter text-sidebar-text uppercase italic">BantayanCare</span>
        </div>
        
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-card text-sidebar-text-muted transition-all border border-sidebar-border hover:border-sky-500"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-hide">
        <div className="px-4 mb-4 text-[10px] font-black text-sidebar-text-muted uppercase tracking-[0.2em]">Management</div>
        
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard/caregiver' &&
             item.path !== '/dashboard/practitioner' &&
             item.path !== '/dashboard/admin' &&
             location.pathname.startsWith(item.path));

          const badgeCount = item.label === 'Alert Center' ? alertCount : (item.badge ?? 0);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group relative flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-300 border ${
                isActive 
                  ? 'border-sky-500 bg-sky-500/10 text-sky-500 font-black shadow-[0_0_15px_rgba(14,165,233,0.15)]' 
                  : 'border-transparent text-sidebar-text hover:border-card-border hover:bg-card'
              } shadow-sm`}
            >
              <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </div>
              <span className="text-sm tracking-tight flex-1">{item.label}</span>
              
              {badgeCount > 0 && (
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-white text-sky-500' : 'node-urgent shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                }`}>
                  {badgeCount > 99 ? '99+' : badgeCount}
                </div>
              )}
              
              {isActive && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                   <ChevronRight size={14} />
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 mt-auto">
        <div className="p-4 rounded-3xl bg-card border border-card-border group transition-colors hover:border-sky-500/30 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center text-white font-black text-xs shadow-lg">
                {initials}
             </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-xs font-black text-sidebar-text truncate uppercase tracking-tight">{profile?.full_name ?? '—'}</div>
                <div className="text-[10px] font-bold text-sky-500 uppercase tracking-wider">{ROLE_LABELS[role]}</div>
              </div>
          </div>
          
          <button 
            onClick={onLogoutClick}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black text-sidebar-text-muted hover:text-text-main hover:bg-card transition-all uppercase tracking-widest border border-card-border"
          >
            <LogOut size={12} />
            SIGN OUT FROM PORTAL
          </button>
        </div>
        
        <div className="mt-4 flex items-center justify-center gap-2 text-[9px] font-bold text-gray-700 tracking-tighter uppercase whitespace-nowrap">
           <ShieldCheck size={10} className="text-brand-accent-cyan/40" />
           ENCRYPTED NODE: DUMAGUETE-X01
        </div>
      </div>
    </aside>
  );
}
