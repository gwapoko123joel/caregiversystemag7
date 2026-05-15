import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, ArrowRight, Clock } from 'lucide-react';

interface HandshakeProps {
  title: string;
  message: string;
  subtext?: string;
  onComplete: () => void;
  actionLabel?: string;
}

export default function ClinicalHandshake({ title, message, subtext, onComplete, actionLabel = "Return to Dashboard" }: HandshakeProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#020617]/90 backdrop-blur-md animate-in fade-in duration-500">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-900 border border-emerald-500/30 rounded-[40px] p-10 text-center shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5 text-emerald-500">
           <ShieldCheck size={160} />
        </div>

        <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>

        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{title}</h2>
        <p className="text-emerald-400 font-bold uppercase text-[9px] tracking-[0.3em] mb-6">Status: Synchronized</p>
        
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          {message}
          {subtext && <span className="block mt-2 text-white font-bold uppercase text-[10px]">{subtext}</span>}
        </p>

        <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5 mb-8 flex items-center justify-between text-[9px] font-mono text-slate-500">
           <div className="flex items-center gap-2">
              <Clock size={12} />
              <span>{new Date().toLocaleTimeString()}</span>
           </div>
           <span>NODE_AUTH_OK</span>
        </div>

        <button
          onClick={onComplete}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
        >
          {actionLabel} <ArrowRight size={14} />
        </button>
      </motion.div>
    </div>
  );
}
