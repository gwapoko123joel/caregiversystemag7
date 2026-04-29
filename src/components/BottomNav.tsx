import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Activity,
  Bell,
  Video,
  ClipboardList,
  User,
  PlusSquare,
  History
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../lib/supabaseClient';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

const NAV_MAP: Record<UserRole, NavItem[]> = {
  admin: [
    { icon: <LayoutDashboard size={22} />, label: 'Overview', path: '/dashboard/admin' },
    { icon: <Users size={22} />,           label: 'Users',    path: '/dashboard/admin/users' },
    { icon: <FileText size={22} />,        label: 'Logs',     path: '/dashboard/admin/logs' },
    { icon: <Activity size={22} />,        label: 'Health',   path: '/dashboard/admin/health' },
  ],
  medical_practitioner: [
    { icon: <LayoutDashboard size={22} />, label: 'Home',     path: '/dashboard/practitioner' },
    { icon: <Bell size={22} />,            label: 'Alerts',   path: '/dashboard/practitioner/alerts' },
    { icon: <Video size={22} />,           label: 'Video',    path: '/dashboard/practitioner/video' },
    { icon: <ClipboardList size={22} />,   label: 'Logs',     path: '/dashboard/practitioner/history' },
  ],
  practitioner: [
    { icon: <LayoutDashboard size={22} />, label: 'Home',     path: '/dashboard/practitioner' },
    { icon: <Bell size={22} />,            label: 'Alerts',   path: '/dashboard/practitioner/alerts' },
    { icon: <Video size={22} />,           label: 'Video',    path: '/dashboard/practitioner/video' },
    { icon: <ClipboardList size={22} />,   label: 'Logs',     path: '/dashboard/practitioner/history' },
  ],
  caregiver: [
    { icon: <LayoutDashboard size={22} />, label: 'Portal',   path: '/dashboard/caregiver' },
    { icon: <User size={22} />,            label: 'Patient',  path: '/dashboard/caregiver/patient' },
    { icon: <PlusSquare size={22} />,      label: 'Report',   path: '/dashboard/caregiver/report' },
    { icon: <History size={22} />,         label: 'History',  path: '/dashboard/caregiver/history' },
  ],
};

export default function BottomNav() {
  const { profile } = useAuth();
  const location = useLocation();

  const role = profile?.role ?? 'caregiver';
  const items = NAV_MAP[role] ?? NAV_MAP.caregiver;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#020617]/80 backdrop-blur-md border-t border-white/5 pb-safe transition-colors">
      <div className="flex items-center justify-around h-20 px-4">
        {items.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/dashboard/admin' && 
             item.path !== '/dashboard/practitioner' && 
             item.path !== '/dashboard/caregiver' && 
             location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center gap-1.5 flex-1 h-[80%] my-auto rounded-2xl transition-all duration-300 border ${
                isActive 
                  ? 'border-sky-500/50 bg-sky-500/10 text-sky-500 font-black scale-105 shadow-[0_0_20px_rgba(14,165,233,0.1)]' 
                  : 'border-transparent text-sidebar-text-muted font-bold'
              } active:scale-90`}
            >
              <div className={`transition-transform duration-300 ${isActive ? 'drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[10px] uppercase tracking-widest leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
