import { 
  Video, 
  ShieldCheck, 
  Zap, 
  Phone, 
  Globe,
  Radio
} from 'lucide-react'

interface VideoConsoleProps {
  initiateCall: (caregiverName?: string, patientName?: string) => void
}

export default function VideoConsole({ initiateCall }: VideoConsoleProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-right-4">
      <div className="bg-card border border-card-border rounded-[40px] p-12 overflow-hidden relative shadow-sm dark:shadow-none transition-colors">
        <div className="absolute top-0 right-0 w-full h-full bg-sky-500/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-8">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center">
                 <Video size={24} className="text-sky-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-text-main uppercase tracking-tighter italic leading-none transition-colors">Tele-Health Console</h3>
                <p className="text-[10px] font-bold text-sidebar-text-muted uppercase tracking-widest mt-2 transition-colors">Secure Encrypted Consultation Pipeline</p>
              </div>
           </div>

           <div className="space-y-6">
              <h2 className="text-5xl font-black text-text-main uppercase italic tracking-tighter leading-tight transition-colors">Sync with Field Nodes for Instant Intervention</h2>
              <p className="text-sm font-medium text-sidebar-text-muted leading-relaxed max-w-lg transition-colors">
                 Establish high-bandwidth clinical handshakes with Barangay caregivers. Review live telemetry while conducting visual assessments through our HIPAA-compliant edge network.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                 {[
                   { label: 'Network Latency', val: '0.04ms', icon: Zap },
                   { label: 'Encryption Standard', val: 'AES-256', icon: ShieldCheck },
                   { label: 'Global Gateway', val: 'DUM-CENTER', icon: Globe },
                   { label: 'Signal Quality', val: 'OPTIMAL', icon: Radio },
                 ].map((mod, i) => (
                    <div key={i} className="p-5 bg-slate-50 dark:bg-slate-900/50 border border-card-border rounded-2xl flex items-center gap-4 transition-colors shadow-sm dark:shadow-none">
                       <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center text-sky-500 transition-colors">
                          <mod.icon size={18} />
                       </div>
                       <div>
                          <div className="text-[9px] font-black text-sidebar-text-muted uppercase tracking-widest mb-0.5 transition-colors">{mod.label}</div>
                          <div className="text-xs font-black text-text-main tracking-widest transition-colors">{mod.val}</div>
                       </div>
                    </div>
                 ))}
              </div>

              <div className="pt-8">
                 <button 
                   onClick={() => initiateCall('Field Caregiver', 'Active Subject')}
                   className="px-10 py-5 node-urgent font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-[var(--shadow-harmonized)] hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
                 >
                    <Phone size={20} className="fill-current text-current" /> Launch Emergency Console
                 </button>
              </div>
           </div>
        </div>

        <div className="absolute bottom-0 right-0 p-12 opacity-5 dark:opacity-10 transition-opacity">
           <Video size={300} className="text-sky-500 stroke-[0.5] transition-colors" />
        </div>
      </div>
    </div>
  )
}
