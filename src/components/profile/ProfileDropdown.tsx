import { useState, useRef, useEffect } from 'react';
const formatName = (name: string) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User as UserIcon, LogOut, ChevronUp,
  Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProfileAvatar } from './ProfileAvatar';
import type { Caregiver } from '../../types/database';
import { supabase } from '../../lib/supabaseClient';

interface ProfileDropdownProps {
  user: Caregiver;
  isCollapsed: boolean;
  onSignOut: () => void;
}

export function ProfileDropdown({ user, isCollapsed, onSignOut }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Role-aware menu items
  const getDashboardPath = (subPath: string) => {
    const roleBase = user.role === 'medical_practitioner' ? 'practitioner' : user.role;
    return `/dashboard/${roleBase}/${subPath}`;
  };

  const menuItems = [
    { 
      label: 'View Profile', 
      icon: UserIcon, 
      path: getDashboardPath('profile') 
    },
    { 
      label: 'My Activity', 
      icon: Activity, 
      path: user.role === 'admin' ? getDashboardPath('logs') : getDashboardPath('history') 
    },
  ];

  const formatRole = (role: string) => 
    role.replace('_', ' ').toUpperCase();

  // Render collapsed state
  if (isCollapsed) {
    return (
      <div ref={dropdownRef} className="relative flex flex-col items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative group"
          aria-label="Profile menu"
        >
          <ProfileAvatar 
            src={user.profile_picture_url} 
            fullName={user.full_name || `${user.first_name} ${user.last_name}`} size="md"
          />
          {!isOpen && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 
                          px-3 py-2 rounded-lg bg-[#0a1628]/95 backdrop-blur-xl 
                          border border-cyan-500/20 text-xs font-light tracking-wider 
                          text-slate-50 opacity-0 group-hover:opacity-100 
                          pointer-events-none whitespace-nowrap z-[100]">
              {formatName(user.full_name || `${user.first_name} ${user.last_name}`)}
              <div className="text-[10px] tracking-wider uppercase text-cyan-300/80">
                {formatRole(user.role)}
              </div>
            </div>
          )}
        </button>

        <button
          onClick={onSignOut}
          className="w-11 h-11 rounded-xl border border-white/10
                   hover:bg-red-500/10 hover:border-red-500/30
                   flex items-center justify-center transition-colors group"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4 text-slate-50/70 group-hover:text-red-300" 
                  strokeWidth={1.5} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-full ml-3 bottom-0 w-72
                       backdrop-blur-xl bg-[#0a1628]/95 border border-cyan-500/20 
                       rounded-2xl shadow-2xl shadow-cyan-500/10 z-[100] overflow-hidden"
            >
              <UserHeader user={user} />
              <MenuItems items={menuItems} onNavigate={(path) => {
                navigate(path); setIsOpen(false);
              }} />
              <SignOutButton onSignOut={onSignOut} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Render expanded state
  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-3 bg-slate-950/30 border border-white/5 rounded-2xl flex items-center gap-3 hover:bg-slate-950/50 transition-all duration-300 cursor-pointer"
      >
        <div className="w-11 h-11 relative flex-shrink-0 border border-sky-500/20 rounded-full">
          <div className="absolute inset-[3px] rounded-full overflow-hidden bg-slate-900 border border-slate-950">
            {user.profile_picture_url ? (
              <img 
                src={user.profile_picture_url.startsWith('http') || user.profile_picture_url.startsWith('data:') 
                  ? user.profile_picture_url 
                  : supabase.storage.from('avatars').getPublicUrl(user.profile_picture_url).data.publicUrl}
                alt={user.full_name || ''}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-cyan-100 font-light text-xs bg-gradient-to-br from-cyan-500/30 to-violet-500/30">
                {(user.full_name || `${user.first_name} ${user.last_name}`).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#020617] rounded-full flex items-center justify-center">
            <div className={`w-2.5 h-2.5 rounded-full ${(user as any).duty_status === 'on_duty' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-slate-50 tracking-tight truncate leading-relaxed">
            {formatName(user.full_name || `${user.first_name} ${user.last_name}`)}
          </p>
          <p className="text-[9px] font-semibold text-sky-500/80 uppercase tracking-[0.2em] mt-1 leading-relaxed">
            {user.role === 'medical_practitioner' ? 'MD NODE' : 'FIELD NODE'}
          </p>
        </div>

        <ChevronUp className={`w-4 h-4 text-sky-500/60 flex-shrink-0 
                            transition-transform duration-200
                            ${isOpen ? '' : 'rotate-180'}`} 
                   strokeWidth={1.5} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-0 right-0
                     backdrop-blur-xl bg-[#0a1628]/95 border border-cyan-500/20 
                     rounded-xl shadow-2xl shadow-cyan-500/10 z-50 overflow-hidden"
          >
            <MenuItems items={menuItems} onNavigate={(path) => {
              navigate(path); setIsOpen(false);
            }} />
            <SignOutButton onSignOut={onSignOut} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UserHeader({ user }: { user: Caregiver }) {
  return (
    <div className="p-4 border-b border-white/5 flex items-center gap-3">
      <ProfileAvatar src={user.profile_picture_url} fullName={user.full_name || `${user.first_name} ${user.last_name}`} size="md" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-50 truncate leading-relaxed">{formatName(user.full_name || `${user.first_name} ${user.last_name}`)}</p>
        <p className="text-xs font-bold tracking-wider uppercase text-sky-500/80 truncate leading-relaxed">
          {user.role.replace('_', ' ')}
        </p>
      </div>
    </div>
  );
}

function MenuItems({ items, onNavigate }: { items: any[]; onNavigate: (path: string) => void }) {
  return (
    <div className="py-2">
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => onNavigate(item.path)}
          className="w-full px-4 py-2.5 flex items-center gap-3
                   hover:bg-cyan-500/10 transition-colors
                   text-sm font-light text-slate-50 text-left"
        >
          <item.icon className="w-4 h-4 text-cyan-300" strokeWidth={1.5} />
          {item.label}
        </button>
      ))}
    </div>
  );
}

function SignOutButton({ onSignOut }: { onSignOut: () => void }) {
  return (
    <>
      <div className="border-t border-white/5" />
      <button
        onClick={onSignOut}
        className="w-full px-4 py-3 flex items-center gap-3
                 hover:bg-red-500/10 transition-colors
                 text-sm font-light text-red-300 text-left"
      >
        <LogOut className="w-4 h-4" strokeWidth={1.5} />
        Sign Out
      </button>
    </>
  );
}
