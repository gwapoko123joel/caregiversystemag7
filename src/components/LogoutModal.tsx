import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, X } from 'lucide-react'

interface LogoutModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

/**
 * Professional Logout Confirmation Modal.
 * Features Navy Glassmorphism and Luminous Azure branding.
 */
export default function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="w-full max-w-md bg-[#0B1120]/95 backdrop-blur-2xl border border-[#0EA5E9]/30 rounded-[32px] p-8 shadow-[0_0_50px_rgba(14,165,233,0.15)] pointer-events-auto relative overflow-hidden group"
            >
              {/* Subtle Luminous Background Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-sky-500/10 blur-[80px] rounded-full pointer-events-none" />
              
              {/* Close Button */}
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-all transition-colors"
              >
                <X size={20} />
              </button>

              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Security Icon */}
                <div className="w-20 h-20 rounded-3xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(14,165,233,0.2)] group-hover:scale-110 transition-transform duration-500">
                  <LogOut size={32} className="text-sky-400" />
                </div>

                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3">Terminate Secure Session?</h3>
                <p className="text-slate-400 font-medium leading-relaxed mb-10 max-w-[280px]">
                  Are you sure you want to log out? Any unsaved clinical reports or data may be lost in this action.
                </p>

                <div className="w-full grid grid-cols-2 gap-4">
                  <button
                    onClick={onClose}
                    className="py-4 px-6 rounded-2xl border border-slate-700 hover:border-white text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirm}
                    className="py-4 px-6 rounded-2xl bg-[#0EA5E9] hover:bg-sky-400 text-white text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(14,165,233,0.4)] active:scale-95"
                  >
                    Confirm Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
