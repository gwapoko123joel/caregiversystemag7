import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X, AlertTriangle, ShieldCheck } from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-[#020617]/90 backdrop-blur-md animate-in fade-in duration-300">
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="max-w-md w-full bg-slate-900 border border-white/10 rounded-[40px] p-10 text-center shadow-2xl relative overflow-hidden"
          >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
               <LogOut size={160} />
            </div>

            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-all"
            >
              <X size={20} />
            </button>

            {/* Icon Node */}
            <div className="w-20 h-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-rose-500/20 relative shadow-[0_0_30px_rgba(244,63,94,0.1)]">
               <div className="absolute inset-0 rounded-[2rem] bg-rose-500 animate-ping opacity-10" />
               <LogOut size={32} className="text-rose-500" />
            </div>

            {/* Typography */}
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-3">
              Terminate <span className="text-rose-500">Session?</span>
            </h2>
            
            <p className="text-rose-400 font-bold uppercase text-[9px] tracking-[0.3em] mb-6">
              Protocol: System Exit
            </p>

            <div className="bg-slate-950/50 rounded-3xl p-6 border border-white/5 mb-10 space-y-4">
               <div className="flex items-start gap-3 text-left">
                  <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Are you sure you want to end this secure session? Any <span className="text-white font-bold">unsaved clinical data</span> will be purged from this local node.
                  </p>
               </div>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={onClose}
                className="py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
              >
                Cancel
              </button>
              <button 
                onClick={onConfirm}
                className="py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-rose-900/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <ShieldCheck size={14} /> Confirm Exit
              </button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 opacity-30">
               <div className="w-1 h-1 rounded-full bg-slate-500" />
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Encrypted Handoff Secure</p>
               <div className="w-1 h-1 rounded-full bg-slate-500" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
