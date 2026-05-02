import { 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  Zap, 
  Globe,
  Radio,
  Clock,
  ArrowRight
} from 'lucide-react'


interface ContactConsoleProps {
  onInitiateCall: () => void;
  onInitiateSMS: () => void;
}

export default function ContactConsole({ onInitiateCall, onInitiateSMS }: ContactConsoleProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-right-4">
      <div className="bg-card border border-card-border rounded-[40px] p-10 overflow-hidden relative shadow-sm dark:shadow-none transition-colors">
        <div className="absolute top-0 right-0 w-full h-full bg-brand-cyan/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-8">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-cyan/10 rounded-2xl flex items-center justify-center">
                 <Radio size={24} className="text-brand-cyan" />
              </div>
              <div>
                <h3 className="text-2xl font-light text-text-main uppercase tracking-widest leading-none transition-colors">Direct Consultation Console</h3>
                <p className="text-[10px] font-bold text-sidebar-text-muted uppercase tracking-widest mt-2 transition-colors">Secure Cellular Intervention Pipeline</p>
              </div>
           </div>

           <div className="space-y-6">
              <h2 className="text-5xl font-light text-text-main uppercase tracking-tighter leading-tight transition-colors">Instant intervention through stable cellular networks</h2>
              <p className="text-sm font-light text-sidebar-text-muted leading-relaxed max-w-lg transition-colors">
                 Rural health coordination prioritized through low-bandwidth, high-reliability clinical handshakes. Monitor live telemetry while conducting voice assessments with field caregivers.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                 {[
                   { label: 'Network Reliability', val: '99.9% GSM', icon: Zap },
                   { label: 'Privacy Standard', val: 'RA 10173', icon: ShieldCheck },
                   { label: 'Local Gateway', val: 'BANTAYAN-NODE', icon: Globe },
                   { label: 'Sync Status', val: 'REAL-TIME', icon: Clock },
                 ].map((mod, i) => (
                    <div key={i} className="p-5 bg-brand-cyan/5 border border-card-border rounded-2xl flex items-center gap-4 transition-colors shadow-sm dark:shadow-none">
                       <div className="w-10 h-10 bg-brand-cyan/10 rounded-xl flex items-center justify-center text-brand-cyan transition-colors">
                          <mod.icon size={18} />
                       </div>
                       <div>
                          <div className="text-[9px] font-bold text-sidebar-text-muted uppercase tracking-widest mb-0.5 transition-colors">{mod.label}</div>
                          <div className="text-sm font-bold text-text-main tracking-widest transition-colors">{mod.val}</div>
                       </div>
                    </div>
                 ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                 <button 
                   onClick={onInitiateCall}
                   className="flex-1 px-8 py-5 bg-brand-cyan text-slate-950 font-bold uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-lg shadow-brand-cyan/10 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4"
                 >
                    <Phone size={20} className="fill-current" /> Voice Consultation
                 </button>
                 <button 
                   onClick={onInitiateSMS}
                   className="flex-1 px-8 py-5 bg-slate-950 border border-white/5 text-white font-bold uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-lg hover:border-brand-cyan/30 active:scale-95 transition-all flex items-center justify-center gap-4"
                 >
                    <MessageSquare size={20} /> SMS Inquiry
                 </button>
              </div>
           </div>
        </div>

        <div className="absolute bottom-0 right-0 p-12 opacity-5 dark:opacity-10 transition-opacity">
           <Phone size={300} className="text-brand-cyan stroke-[0.5] transition-colors" />
        </div>
      </div>

      {/* Availability Hint */}
      <div className="soft-card bg-brand-cyan/5 border border-brand-cyan/20 p-6 flex items-center justify-between group">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-cyan/10 rounded-2xl flex items-center justify-center text-brand-cyan">
               <ShieldCheck size={24} />
            </div>
            <div>
               <p className="text-[10px] font-bold text-white uppercase tracking-widest">Operator Availability System</p>
               <p className="text-[8px] text-slate-500 uppercase tracking-widest">Flag your status in the top bar to notify field caregivers.</p>
            </div>
         </div>
         <div className="flex items-center gap-2 text-brand-cyan">
            <span className="text-[8px] font-bold uppercase tracking-widest">Update Status</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
         </div>
      </div>
    </div>
  )
}
