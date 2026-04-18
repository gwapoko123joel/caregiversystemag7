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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-card/90 backdrop-blur-xl border-t border-card-border pb-safe transition-colors">
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
              className={`flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all duration-300 ${
                isActive 
                  ? 'text-sky-500 dark:text-sky-400 font-black scale-105' 
                  : 'text-sidebar-text-muted font-bold'
              } active:scale-90`}
            >
              <div className={`transition-transform duration-300 ${isActive ? 'drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[10px] uppercase tracking-widest">{item.label}</span>
              
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-sky-500 rounded-b-full shadow-[0_4px_10px_rgba(14,165,233,0.4)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
