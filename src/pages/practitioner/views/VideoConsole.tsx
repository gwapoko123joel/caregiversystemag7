
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
      <div className="bg-white/5 border border-white/5 rounded-[40px] p-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-full h-full bg-brand-neon-green/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-8">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-neon-green/10 rounded-2xl flex items-center justify-center">
                 <Video size={24} className="text-brand-neon-green" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Tele-Health Console</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Secure Encrypted Consultation Pipeline</p>
              </div>
           </div>

           <div className="space-y-6">
              <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-tight">Sync with Field Nodes for Instant Intervention</h2>
              <p className="text-sm font-medium text-gray-400 leading-relaxed max-w-lg">
                 Establish high-bandwidth clinical handshakes with Barangay caregivers. Review live telemetry while conducting visual assessments through our HIPAA-compliant edge network.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                 {[
                   { label: 'Network Latency', val: '0.04ms', icon: Zap },
                   { label: 'Encryption Standard', val: 'AES-256', icon: ShieldCheck },
                   { label: 'Global Gateway', val: 'DUM-CENTER', icon: Globe },
                   { label: 'Signal Quality', val: 'OPTIMAL', icon: Radio },
                 ].map((mod, i) => (
                    <div key={i} className="p-5 bg-brand-dark/50 border border-white/5 rounded-2xl flex items-center gap-4">
                       <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-brand-neon-green">
                          <mod.icon size={18} />
                       </div>
                       <div>
                          <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-0.5">{mod.label}</div>
                          <div className="text-xs font-black text-white tracking-widest">{mod.val}</div>
                       </div>
                    </div>
                 ))}
              </div>

              <div className="pt-8">
                 <button 
                   onClick={() => initiateCall('Field Caregiver', 'Active Subject')}
                   className="px-10 py-5 bg-brand-neon-green text-brand-dark font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-[0_0_40px_rgba(57,255,20,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
                 >
                    <Phone size={20} className="fill-brand-dark" /> Launch Emergency Console
                 </button>
              </div>
           </div>
        </div>

        <div className="absolute bottom-0 right-0 p-12 opacity-10">
           <Video size={300} className="text-brand-neon-green stroke-[0.5]" />
        </div>
      </div>
    </div>
  )
}
