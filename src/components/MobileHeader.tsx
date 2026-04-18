import { Heart, LogOut, Sun, Moon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'

interface MobileHeaderProps {
  onLogoutClick: () => void
}

/**
 * Mobile-responsive header for security actions and branding.
 * Visible only on screens < md.
 */
export default function MobileHeader({ onLogoutClick }: MobileHeaderProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="md:hidden sticky top-0 z-[60] flex items-center justify-between px-6 py-4 backdrop-blur-md bg-[#020617]/80 border-b border-white/5 transition-colors"
    >
      {/* Left: Branding */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center shadow-lg shadow-sky-500/20">
          <Heart size={16} className="text-white fill-white" />
        </div>
        <span className="text-sm font-black tracking-tighter text-white uppercase italic">BantayanCare</span>
      </div>

      {/* Right: Security Cluster */}
      <div className="flex items-center gap-4">
        {/* Simple Theme Toggle for Mobile Header */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-400 hover:text-white transition-colors active:scale-95"
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
