import { Heart, LogOut, Sun, Moon, Menu } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../hooks/useAuth'
import { useSidebar } from '../contexts/SidebarContext'
import AvailabilityToggle from './AvailabilityToggle'

interface MobileHeaderProps {
  onLogoutClick: () => void
}

/**
 * Mobile-responsive header for security actions and branding.
 * Visible only on screens < md.
 */
export default function MobileHeader({ onLogoutClick }: MobileHeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const { userProfile, profile } = useAuth()
  const { toggleMobile } = useSidebar()
  const role = userProfile?.role || profile?.role

  const isPractitioner = (role as string) === 'medical_practitioner'

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="md:hidden sticky top-0 z-[60] flex items-center justify-between px-6 py-4 backdrop-blur-md bg-[#020617]/80 border-b border-white/5 transition-colors"
    >
      {/* Left: Branding & Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobile}
          className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-50 hover:bg-slate-800/50 transition-colors active:scale-95 lg:hidden"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Heart size={16} className="text-slate-50 fill-white" />
          </div>
          <span className="text-sm font-light tracking-[0.2em] text-slate-50 uppercase hidden sm:inline-block">BantayanCare</span>
        </div>
      </div>

      {/* Right: Security Cluster */}
      <div className="flex items-center gap-4">
        {isPractitioner && <AvailabilityToggle />}
        
        {/* Simple Theme Toggle for Mobile Header */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-50 transition-colors active:scale-95"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* 44x44px target for mobile accessibility */}
        <button
          onClick={onLogoutClick}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 active:scale-95 active:bg-sky-500/20 active:border-sky-500/50 active:text-sky-400 transition-all"
          aria-label="Terminate Session"
        >
          <LogOut size={20} />
        </button>
      </div>
    </motion.header>
  )
}
