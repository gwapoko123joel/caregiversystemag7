import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import {
  LayoutDashboard,
  FileText,
  Bell,
  Phone,
  ClipboardList,
  Users,
  Activity,
  ShieldCheck,
  Cpu,
  LogOut,
  Heart,
  ChevronRight,
  UserPlus,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Map
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useSidebar } from '../contexts/SidebarContext';
import { ProfileDropdown } from './profile/ProfileDropdown';
import type { UserRole } from '../types/database';

interface SidebarProps {
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
    { icon: <LayoutDashboard size={20} strokeWidth={1.5} />, label: 'Dashboard',     path: '/dashboard/caregiver' },
    { icon: <UserPlus size={20} strokeWidth={1.5} />,        label: 'Register Patient', path: '/dashboard/caregiver/onboarding' },
    { icon: <FileText size={20} strokeWidth={1.5} />,       label: 'Submit Report',  path: '/dashboard/caregiver/report' },
    { icon: <ClipboardList size={20} strokeWidth={1.5} />,  label: 'History',        path: '/dashboard/caregiver/history' },
    { icon: <Activity size={20} strokeWidth={1.5} />,       label: 'Doctors Dir.',   path: '/dashboard/caregiver/doctors' },
    { icon: <Phone size={20} strokeWidth={1.5} />,          label: 'Emergency Support', path: '/dashboard/caregiver/call' },
  ],
  medical_practitioner: [
    { icon: <LayoutDashboard size={20} strokeWidth={1.5} />, label: 'Dashboard',    path: '/dashboard/practitioner' },
    { icon: <UserPlus size={20} strokeWidth={1.5} />,        label: 'Clinical Referral', path: '/dashboard/practitioner/referral' },
    { icon: <Activity size={20} strokeWidth={1.5} />,        label: 'Patient Feed', path: '/dashboard/practitioner/feed' },
    { icon: <Bell size={20} strokeWidth={1.5} />,            label: 'Alert Center', path: '/dashboard/practitioner/alerts' },
    { icon: <Phone size={20} strokeWidth={1.5} />,           label: 'Contact Console',path: '/dashboard/practitioner/contact' },
    { icon: <ShieldCheck size={20} strokeWidth={1.5} />,     label: 'Node Onboarding',path: '/dashboard/practitioner/onboarding' },
    { icon: <ClipboardList size={20} strokeWidth={1.5} />,   label: 'History Logs', path: '/dashboard/practitioner/history' },
  ],
  practitioner: [
    { icon: <LayoutDashboard size={20} strokeWidth={1.5} />, label: 'Dashboard',    path: '/dashboard/practitioner' },
    { icon: <UserPlus size={20} strokeWidth={1.5} />,        label: 'Clinical Referral', path: '/dashboard/practitioner/referral' },
    { icon: <Activity size={20} strokeWidth={1.5} />,        label: 'Patient Feed', path: '/dashboard/practitioner/feed' },
    { icon: <Bell size={20} strokeWidth={1.5} />,            label: 'Alert Center', path: '/dashboard/practitioner/alerts' },
    { icon: <Phone size={20} strokeWidth={1.5} />,           label: 'Contact Console',path: '/dashboard/practitioner/contact' },
    { icon: <ShieldCheck size={20} strokeWidth={1.5} />,     label: 'Node Onboarding',path: '/dashboard/practitioner/onboarding' },
    { icon: <ClipboardList size={20} strokeWidth={1.5} />,   label: 'History Logs', path: '/dashboard/practitioner/history' },
  ],
  admin: [
    { icon: <LayoutDashboard size={20} strokeWidth={1.5} />, label: 'Overview',      path: '/dashboard/admin' },
    { icon: <Users size={20} strokeWidth={1.5} />,           label: 'User Manager',  path: '/dashboard/admin/users' },
    { icon: <ShieldCheck size={20} strokeWidth={1.5} />,     label: 'Field Verifications', path: '/dashboard/admin/patients/verification' },
    { icon: <ClipboardList size={20} strokeWidth={1.5} />,   label: 'Patient Roster', path: '/dashboard/admin/patients/roster' },
    { icon: <ShieldCheck size={20} strokeWidth={1.5} />,     label: 'System Access',  path: '/dashboard/admin/verification' },
    { icon: <Activity size={20} strokeWidth={1.5} />,        label: 'System Audit',   path: '/dashboard/admin/logs' },
    { icon: <Cpu size={20} strokeWidth={1.5} />,             label: 'Health Console', path: '/dashboard/admin/health' },
    { icon: <Map size={20} strokeWidth={1.5} />,             label: 'Health Profile', path: '/dashboard/admin/analytics' },
  ],
};

const ROLE_LABELS: Record<UserRole, string> = {
  caregiver: 'Caregiver',
  medical_practitioner: 'Practitioner',
  practitioner: 'Practitioner',
  admin: 'System Admin',
};

export default function Sidebar({ onLogoutClick }: SidebarProps) {
  const { profile, userProfile } = useAuth();
  const location = useLocation();
  const { isCollapsed, isMobileHidden, isDesktop, toggleCollapse, setMobileHidden } = useSidebar();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const getUnresolvedCount = async () => {
      const { count, error } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('is_resolved', false);

      if (!error) setAlertCount(count || 0);
    };

    getUnresolvedCount();

    // Listen for real-time changes
    const channel = supabase.channel('sidebar-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => {
        getUnresolvedCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const role = userProfile?.role || profile?.role || 'caregiver';
  const navItems = NAV[role as UserRole] ?? NAV.caregiver;

  const displayName = userProfile?.full_name || profile?.full_name || 'U';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {!isDesktop && !isMobileHidden && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileHidden(true)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[90] lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        animate={{
          width: isDesktop ? (isCollapsed ? 80 : 280) : 280,
          x: isDesktop ? 0 : (isMobileHidden ? '-100%' : '0%')
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed lg:sticky top-0 left-0 z-[100] h-screen !bg-sidebar border-r border-sidebar-border flex flex-col transition-colors duration-300 shadow-2xl lg:shadow-none overflow-hidden"
      >
        <div className={`p-6 pb-4 flex flex-col gap-4 ${isCollapsed && isDesktop ? 'items-center' : ''}`}>
          <div className={`flex items-center justify-between ${isCollapsed && isDesktop ? 'flex-col gap-4' : 'w-full'}`}>
            <div className="flex items-center gap-3 group/logo select-none overflow-hidden">
              <div className="min-w-[40px] w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.3)] group-hover/logo:shadow-[0_0_20px_rgba(14,165,233,0.5)] transition-all flex-shrink-0">
                <Heart size={20} className="text-white fill-white" />
              </div>
              {!(isCollapsed && isDesktop) && (
                <motion.span 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  className="text-lg font-light tracking-[0.2em] text-sidebar-text uppercase whitespace-nowrap"
                >
                  BantayanCare
                </motion.span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Desktop Collapse Toggle */}
              {isDesktop && (
                <button
                  onClick={toggleCollapse}
                  className="p-1.5 rounded-lg bg-card text-sidebar-text-muted transition-all border border-sidebar-border hover:border-sky-500 hover:text-sky-500 flex-shrink-0"
                  title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                  {isCollapsed ? <PanelLeftOpen size={16} strokeWidth={1.5} /> : <PanelLeftClose size={16} strokeWidth={1.5} />}
                </button>
              )}

              {/* Mobile Close Button */}
              {!isDesktop && (
                <button
                  onClick={() => setMobileHidden(true)}
                  className="p-1.5 rounded-lg bg-card text-sidebar-text-muted transition-all border border-sidebar-border hover:border-sky-500 hover:text-sky-500 flex-shrink-0"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>
          {isCollapsed && isDesktop && <div className="w-8 h-px bg-sidebar-border mx-auto" />}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-hide py-4">
          {!(isCollapsed && isDesktop) && (
            <div className="px-4 mb-4 text-[10px] font-light text-sidebar-text-muted uppercase tracking-[0.2em] whitespace-nowrap">Management</div>
          )}
        
        {navItems.map((item) => {
          const isBaseDashboard = item.path.endsWith('dashboard/practitioner') || 
                                 item.path.endsWith('dashboard/caregiver') || 
                                 item.path.endsWith('dashboard/admin');

          const isActive = isBaseDashboard
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path) || 
              (item.label === 'Patient Feed' && location.pathname.includes('/patient/'));

          const badgeCount = item.label === 'Alert Center' ? alertCount : (item.badge ?? 0);

          return (
            <Link
              key={item.path}
              to={item.path}
              title={isCollapsed && isDesktop ? item.label : undefined}
              className={`group relative flex items-center ${isCollapsed && isDesktop ? 'justify-center p-3 mx-2 rounded-xl' : 'gap-3 px-6 py-4 rounded-xl mx-4'} transition-all duration-300 border ${
                isActive 
                  ? (isCollapsed && isDesktop 
                      ? 'bg-sky-500/10 text-sky-500 border-l-2 border-l-sky-500 border-y-transparent border-r-transparent rounded-l-none'
                      : 'border-sky-500 bg-sky-500/10 text-sky-500 font-light shadow-[0_0_15px_rgba(14,165,233,0.15)]') 
                  : 'border-transparent text-sidebar-text hover:border-card-border hover:bg-card'
              } overflow-hidden`}
            >
              <div className={`transition-transform duration-300 flex-shrink-0 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </div>
              
              {!(isCollapsed && isDesktop) && (
                <span className="text-sm tracking-tight flex-1 whitespace-nowrap">{item.label}</span>
              )}
              
              {badgeCount > 0 && (
                <div className={`absolute ${isCollapsed && isDesktop ? 'top-2 right-2' : 'relative'} px-2 py-0.5 rounded-full text-[10px] font-light ${
                  isActive ? 'bg-sky-500 text-white' : 'node-urgent shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                }`}>
                  {badgeCount > 99 ? '99+' : badgeCount}
                </div>
              )}
              
              {isActive && !(isCollapsed && isDesktop) && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                   <ChevronRight size={14} />
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className={`p-4 mt-auto border-t border-sidebar-border ${isCollapsed && isDesktop ? 'flex flex-col items-center gap-4' : ''}`}>
        {(userProfile || profile) && (
          <ProfileDropdown 
            user={(userProfile || profile) as any} 
            isCollapsed={isCollapsed && isDesktop} 
            onSignOut={onLogoutClick} 
          />
        )}
        
        {!(isCollapsed && isDesktop) && (
          <div className="mt-4 flex items-center justify-center gap-2 text-[9px] font-bold text-gray-700 tracking-tighter uppercase whitespace-nowrap overflow-hidden">
             <ShieldCheck size={10} className="text-brand-accent-cyan/40 flex-shrink-0" />
             <span className="truncate">ENCRYPTED NODE: DUMAGUETE-X01</span>
          </div>
        )}
      </div>
    </motion.aside>
    </>
  );
}
