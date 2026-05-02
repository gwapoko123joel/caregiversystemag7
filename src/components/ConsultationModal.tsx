import { useState, useEffect } from 'react';
import { 
  Phone, 
  ShieldCheck, 
  PhoneOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  practitionerName: string;
  patientName: string;
  onEndCall: () => void;
}

export default function ConsultationModal({ 
  isOpen, 
  onClose, 
  practitionerName, 
  patientName,
  onEndCall
}: ConsultationModalProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isOpen) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isOpen]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             onClick={onClose}
             className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
           />
           
           <motion.div
             initial={{ scale: 0.9, opacity: 0, y: 20 }}
             animate={{ scale: 1, opacity: 1, y: 0 }}
             exit={{ scale: 0.9, opacity: 0, y: 20 }}
             className="relative w-full max-w-lg soft-card bg-slate-900 border border-brand-cyan/20 p-10 space-y-10 text-center shadow-2xl shadow-brand-cyan/5 overflow-hidden"
           >
              <div className="absolute top-0 left-0 w-full h-1 bg-brand-cyan/20 overflow-hidden">
                 <motion.div 
                   className="h-full bg-brand-cyan"
                   animate={{ x: ['-100%', '100%'] }}
                   transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                 />
              </div>

              <div className="space-y-6">
                 <div className="w-24 h-24 bg-brand-cyan/10 rounded-[3rem] flex items-center justify-center text-brand-cyan mx-auto relative">
                    <div className="absolute inset-0 bg-brand-cyan/20 rounded-[3rem] animate-ping" />
                    <Phone size={40} className="relative z-10 fill-current" />
                 </div>
                 
                 <div className="space-y-2">
                    <h3 className="text-3xl font-light text-white uppercase tracking-widest">Active Consultation</h3>
                    <p className="text-[10px] font-bold text-brand-cyan uppercase tracking-[0.3em]">Secure Cellular Node: GSM-STABLE</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-8 py-8 border-y border-white/5">
                 <div className="text-left space-y-1">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Practitioner</p>
                    <p className="text-sm font-bold text-white uppercase ">{practitionerName}</p>
                 </div>
                 <div className="text-right space-y-1">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Subject</p>
                    <p className="text-sm font-bold text-white uppercase ">{patientName}</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
                    <span className="text-4xl font-light text-white tracking-[0.2em] font-mono">{formatTime(seconds)}</span>
                 </div>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Session duration (Live Audit Active)</p>
              </div>

              <button 
                onClick={() => {
                  onEndCall();
                  onClose();
                }}
                className="w-full py-5 bg-red-500 text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                 <PhoneOff size={20} /> Terminate Secure Line
              </button>

              <div className="flex items-center justify-center gap-4 text-[8px] font-bold text-slate-700 uppercase tracking-widest">
                 <ShieldCheck size={12} />
                 RA 10173 Compliant Recording
              </div>
           </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
