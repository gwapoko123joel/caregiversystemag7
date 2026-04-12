import { useState, useEffect } from 'react'
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MessageSquare,
  Maximize2,
  User,
  X,
  ShieldCheck,
  Zap,
  Save,
  Check
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'

interface VideoCallModalProps {
  patientName?: string
  caregiverName?: string
  onClose: () => void
}

export default function VideoCallModal({
  patientName = 'Patient',
  caregiverName = 'Caregiver',
  onClose,
}: VideoCallModalProps) {
  const { user } = useAuth()
  const [muted, setMuted] = useState(false)
  const [camOff, setCamOff] = useState(false)
  const [status, setStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting')
  const [notes, setNotes] = useState('')
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  useEffect(() => {
    const t = setTimeout(() => setStatus('connected'), 3000)
    return () => clearTimeout(t)
  }, [])

  async function saveNotes() {
     if (!notes.trim() || !user) return;
     setSavingStatus('saving');
     const { error } = await supabase.from('activity_logs').insert({
        user_id: user.id,
        user_type: 'medical_practitioner',
        action: 'CONSULTATION_NOTE',
        details: { patient: patientName, caregiver: caregiverName, note: notes }
     });
     if (!error) {
        setSavingStatus('saved');
        setTimeout(() => setSavingStatus('idle'), 3000);
     } else {
        setSavingStatus('idle');
        alert("Failed to save clinical notes.");
     }
  }

  function handleEnd() {
    setStatus('ended')
    setTimeout(onClose, 1200)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 bg-brand-dark/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-7xl bg-[#1A1B3B] border border-white/10 rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex h-[85vh] divide-x divide-white/5">
        
        {/* Left Side: Video Architecture */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Call Header */}
        <div className="px-8 py-5 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
           <div className="flex items-center gap-4">
              <div className="relative">
                 <Video size={20} className="text-brand-accent-green" />
                 {status === 'connected' && <div className="absolute -top-1 -right-1 w-2 h-2 bg-brand-neon-green rounded-full animate-ping" />}
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight leading-none italic">Encrypted Video Handshake</h3>
                <div className="flex items-center gap-2 mt-1">
                   <div className={`w-1.5 h-1.5 rounded-full ${status === 'connected' ? 'bg-brand-neon-green shadow-[0_0_8px_brand-neon-green]' : 'bg-amber-500 animate-pulse'}`} />
                   <span className={`text-[10px] font-black uppercase tracking-widest ${status === 'connected' ? 'text-brand-neon-green' : 'text-amber-500'}`}>
                      {status === 'connecting' ? 'Establishing Pipeline...' : status === 'connected' ? 'Live Telemetry Active' : 'Session Terminated'}
                   </span>
                </div>
              </div>
           </div>
           <button 
             onClick={onClose}
             className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all"
           >
              <X size={20} />
           </button>
        </div>

        {/* Main Viewport */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
           
           {/* Scanlines / HUD overlay */}
           <div className="absolute inset-0 pointer-events-none z-20 opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

           {status === 'connecting' && (
             <div className="relative z-30 flex flex-col items-center gap-8 text-center animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 rounded-full border-2 border-brand-accent-green/20 flex items-center justify-center relative">
                   <div className="absolute inset-0 border-t-2 border-brand-accent-green rounded-full animate-spin" />
                   <Phone size={32} className="text-brand-accent-green animate-pulse" />
                </div>
                <div className="space-y-2">
                   <h2 className="text-2xl font-black text-white tracking-tight uppercase">Connecting to Peer</h2>
                   <p className="text-xs font-bold text-gray-500 uppercase tracking-widest italic">Syncing with {caregiverName} via Dumaguete-Node...</p>
                </div>
             </div>
           )}

           {status === 'connected' && (
             <>
                {/* Remote Participant Placeholder */}
                <div className="flex flex-col items-center gap-6 animate-in fade-in duration-1000">
                   <div className="relative">
                      <div className="w-32 h-32 bg-white/5 border border-white/10 rounded-full flex items-center justify-center shadow-2xl overflow-hidden group">
                         <User size={64} className="text-gray-700 group-hover:text-brand-neon-green transition-colors duration-700" />
                      </div>
                      <div className="absolute -inset-4 bg-brand-neon-green/5 blur-3xl rounded-full animate-pulse" />
                   </div>
                   <div className="text-center space-y-2">
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Remote Node Identity</div>
                      <h4 className="text-xl font-black text-white uppercase italic">{caregiverName}</h4>
                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-brand-accent-green uppercase">
                         <Zap size={12} className="fill-brand-accent-green" /> 0.04ms Latency
                      </div>
                   </div>
                </div>

                {/* Patient Context HUD */}
                <div className="absolute top-6 left-8 z-30 p-4 bg-brand-dark/40 border border-white/5 backdrop-blur-md rounded-2xl">
                   <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Subject Context</div>
                   <div className="text-sm font-black text-white uppercase">{patientName}</div>
                </div>

                {/* Self View (Picture-in-Picture) */}
                <div className="absolute bottom-6 right-8 w-48 aspect-video bg-brand-dark rounded-2xl border-2 border-white/10 overflow-hidden shadow-2xl z-30 group hover:border-brand-neon-green/40 transition-all">
                   {camOff ? (
                     <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gray-900/50">
                        <VideoOff size={24} className="text-gray-700" />
                        <span className="text-[9px] font-black text-gray-700 uppercase">Input Muted</span>
                     </div>
                   ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-white/[0.02]">
                        <User size={24} className="text-gray-600 group-hover:text-brand-neon-green transition-colors" />
                        <span className="text-[9px] font-black text-gray-600 uppercase group-hover:text-white transition-colors tracking-widest">You</span>
                     </div>
                   )}
                </div>

                {/* Floating HUD Elements */}
                <div className="absolute bottom-6 left-8 z-30">
                   <button className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-gray-500 hover:text-white transition-all">
                      <Maximize2 size={16} />
                   </button>
                </div>
             </>
           )}

           {status === 'ended' && (
             <div className="flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500">
                   <PhoneOff size={32} />
                </div>
                <h3 className="text-2xl font-black text-red-500 uppercase tracking-tighter italic">Call Terminated</h3>
             </div>
           )}
        </div>

        {/* Controls Bar */}
        <div className="px-8 py-8 bg-brand-dark flex items-center justify-center gap-8 relative z-30">
           <button 
             onClick={() => setMuted(!muted)}
             className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all ${
               muted ? 'bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
             }`}
           >
              {muted ? <MicOff size={24} /> : <Mic size={24} />}
           </button>

           <button 
             onClick={() => setCamOff(!camOff)}
             className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all ${
               camOff ? 'bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
             }`}
           >
              {camOff ? <VideoOff size={24} /> : <Video size={24} />}
           </button>

           <button 
             onClick={handleEnd}
             className="w-16 h-16 bg-red-600 hover:bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-red-900/40 hover:scale-110 active:scale-95 transition-all outline outline-offset-4 outline-red-500/0 hover:outline-red-500/20"
           >
              <PhoneOff size={28} className="fill-white" />
           </button>

           <button className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-gray-400 hover:text-white transition-all">
              <MessageSquare size={24} />
           </button>
        </div>

        {/* Info Strip */}
        <div className="px-8 py-3 bg-brand-dark/50 border-t border-white/5 flex items-center justify-between text-[9px] font-black text-gray-600 uppercase tracking-widest italic">
           <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-brand-accent-green/40" /> End-to-End P2P Encrypted</span>
              <span className="flex items-center gap-1.5"><Zap size={12} className="text-brand-neon-green/40" /> Edge Gateway: DUM-CENTER</span>
           </div>
           <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC+8</span>
        </div>
        </div>
        
        {/* Right Side: Clinical Notes Panel */}
        <div className="w-[400px] bg-brand-dark flex flex-col">
           <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
              <div>
                 <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={16} className="text-brand-neon-green" /> Clinical Notes
                 </h4>
                 <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Real-Time Field Observations</div>
              </div>
           </div>
           
           <div className="flex-1 p-6 flex flex-col">
              <textarea 
                 value={notes}
                 onChange={e => setNotes(e.target.value)}
                 placeholder="Begin logging observations..."
                 className="flex-1 w-full bg-white/[0.02] border border-white/10 rounded-2xl p-4 text-xs font-medium text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-neon-green/40 resize-none mb-4"
              />
              
              <button 
                 onClick={saveNotes}
                 disabled={savingStatus === 'saving' || !notes.trim()}
                 className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${
                    savingStatus === 'saved' ? 'bg-brand-neon-green text-brand-dark' : 
                    !notes.trim() ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 
                    'bg-white/10 hover:bg-brand-accent-green hover:text-brand-dark text-white shadow-xl'
                 }`}
              >
                 {savingStatus === 'saving' ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 ) : savingStatus === 'saved' ? (
                    <><Check size={16} /> Saved to Registry</>
                 ) : (
                    <><Save size={16} /> Commit Observation</>
                 )}
              </button>
           </div>
        </div>

      </div>
    </div>
  )
}
