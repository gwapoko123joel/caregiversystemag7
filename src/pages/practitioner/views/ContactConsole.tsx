import { useState, useEffect } from 'react'
import { 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  Globe,
  Radio,
  Send,
  Signal,
  RefreshCw,
  UserCheck
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from '../../../hooks/useAuth'

interface ContactConsoleProps {
  onInitiateCall: () => void;
  onInitiateSMS: () => void;
}

export default function ContactConsole({ onInitiateCall, onInitiateSMS }: ContactConsoleProps) {
  const { user } = useAuth()
  const [dutyStatus, setDutyStatus] = useState('off_duty')
  const [customMessage, setCustomMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isTransmitting, setIsTransmitting] = useState(false)

  // 1. Fetch current status & listen for real-time changes
  useEffect(() => {
    if (user) {
      fetchStatus()

      const channel = supabase
        .channel(`contact-console-${user.id}`)
        .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'caregivers', filter: `id=eq.${user.id}` }, 
          (payload: any) => {
             if (payload.new) {
               if (payload.new.duty_status) setDutyStatus(payload.new.duty_status);
               if (payload.new.status_message !== undefined) setCustomMessage(payload.new.status_message || '');
             }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user])

  async function fetchStatus() {
    const { data } = await supabase
      .from('caregivers')
      .select('duty_status, status_message')
      .eq('id', user?.id)
      .single()
    
    if (data?.duty_status) setDutyStatus(data.duty_status)
    if (data?.status_message) setCustomMessage(data.status_message)
  }

  // 2. Update status function
  async function handleStatusUpdate(newStatus: string) {
    setIsSaving(true);
    const { error } = await supabase
      .from('caregivers')
      .update({ 
        duty_status: newStatus,
        status_message: customMessage 
      })
      .eq('id', user?.id);

    if (!error) {
      setDutyStatus(newStatus);

      // SYNC: Update practitioner_availability so the top header toggle stays in sync
      await supabase
        .from('practitioner_availability')
        .update({ 
          status: newStatus,
          status_message: customMessage,
          last_status_change: new Date().toISOString()
        })
        .eq('caregiver_id', user?.id);

      // Optional: Audit log
      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        user_type: 'medical_practitioner',
        action: 'STATUS_CHANGE',
        details: { status: newStatus, message: customMessage }
      });
      alert(`Node Status Updated: ${newStatus.toUpperCase()}`);
    }
    setIsSaving(false);
  }

  // 3. Broadcast function
  async function sendBroadcast() {
    const title = (document.getElementById('broadcast-title') as HTMLInputElement).value;
    const msg = (document.getElementById('broadcast-msg') as HTMLTextAreaElement).value;
    
    if (!user || !msg) return
    setIsTransmitting(true)

    try {
      const { error } = await supabase.from('system_announcements').insert({
        author_id: user.id,
        title: title || 'System Update',
        message: msg
      });

      if (!error) {
        alert("Broadcast Transmitted.");
        (document.getElementById('broadcast-title') as HTMLInputElement).value = '';
        (document.getElementById('broadcast-msg') as HTMLTextAreaElement).value = '';
      } else {
        throw error
      }
    } catch (err) {
      console.error(err)
      alert("Transmission failed.")
    } finally {
      setIsTransmitting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 px-4 md:px-0">
      
      {/* ── HEADER SECTION ── */}
      <div className="px-2">
        <h2 className="text-4xl font-semibold text-slate-50 uppercase tracking-tighter mb-3 leading-tight">
          Command & <span className="text-sky-500">Consult</span>
        </h2>
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.3em] leading-relaxed">
          Barangay Monitoring Network — Secure Intervention Pipeline
        </p>
      </div>

      {/* ── ROW 1: TELEMETRY & SYSTEM STATUS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatusMiniCard label="Network Reliability" value="99.9% GSM" icon={<Signal size={14} />} />
        <StatusMiniCard label="Privacy Standard" value="RA 10173" icon={<ShieldCheck size={14} />} />
        <StatusMiniCard label="Local Gateway" value="Bantayan-Node" icon={<Globe size={14} />} />
        <StatusMiniCard label="Sync Status" value="Real-Time" icon={<RefreshCw size={14} />} color="text-emerald-500" />
      </div>

      {/* ── ROW 2: OPERATOR AVAILABILITY ── */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-10 items-start lg:items-center">
          
          {/* Left Side: Status Info */}
          <div className="flex items-center gap-6 flex-1">
            <div className="w-16 h-16 bg-sky-500/10 rounded-[2rem] flex items-center justify-center text-sky-500 border border-sky-500/20 shadow-inner">
              <UserCheck size={32} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-50 uppercase tracking-tighter leading-tight">Operator Availability System</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1 leading-relaxed">Broadcast clinical presence to field nodes</p>
            </div>
          </div>

          {/* Right Side: Interactive Controls */}
          <div className="w-full lg:w-auto space-y-6">
            {/* The Toggle Switchboard */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-950/60 rounded-2xl border border-white/5">
              {[
                { id: 'available', label: 'Available', color: 'emerald' },
                { id: 'in_consultation', label: 'In Consult', color: 'sky' },
                { id: 'busy', label: 'Busy', color: 'rose' },
                { id: 'off_duty', label: 'Off Duty', color: 'slate' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => handleStatusUpdate(btn.id)}
                  disabled={isSaving}
                  className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                    dutyStatus === btn.id 
                      ? btn.color === 'emerald' ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg'
                        : btn.color === 'sky' ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-lg'
                        : btn.color === 'rose' ? 'bg-rose-500 text-slate-950 border-rose-400 shadow-lg'
                        : 'bg-slate-500 text-slate-950 border-slate-400 shadow-lg'
                      : 'bg-transparent border-transparent text-slate-500 hover:text-slate-50'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Custom Message Input */}
            <div className="relative group flex gap-3">
               <div className="relative flex-1">
                 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-500 transition-colors">
                    <MessageSquare size={14} />
                 </div>
                 <input 
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStatusUpdate(dutyStatus)}
                    placeholder="Set custom status message (e.g. In surgery until 3 PM)"
                    className="w-full lg:w-96 bg-slate-950/40 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-xs text-slate-50 outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-700 italic"
                 />
               </div>
               <button 
                  onClick={() => handleStatusUpdate(dutyStatus)}
                  disabled={isSaving}
                  className="px-6 py-3 bg-white/5 hover:bg-sky-500 hover:text-slate-50 text-slate-400 text-[10px] font-semibold uppercase tracking-widest rounded-xl transition-all border border-white/5 hover:border-sky-400 whitespace-nowrap disabled:opacity-50"
               >
                 {isSaving ? 'Saving...' : 'Save'}
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 3: CONSULTATION TRIGGERS ── */}
      <div className="bg-card border border-card-border rounded-[40px] p-10 overflow-hidden relative shadow-sm dark:shadow-none transition-colors">
        <div className="absolute top-0 right-0 w-full h-full bg-brand-cyan/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-6">
           <h2 className="text-3xl font-light text-text-main uppercase tracking-tighter leading-tight transition-colors">Instant intervention through stable cellular networks</h2>
           <p className="text-sm font-light text-sidebar-text-muted leading-relaxed max-w-lg transition-colors">
              Rural health coordination prioritized through low-bandwidth GSM clinical handshakes. Monitor live telemetry while conducting voice assessments.
           </p>
           
           <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={onInitiateCall}
                className="flex-1 px-8 py-5 bg-sky-500 text-slate-50 font-semibold uppercase text-[11px] tracking-[0.2em] rounded-2xl shadow-lg shadow-sky-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4"
              >
                 <Phone size={20} className="fill-current" /> Voice Consultation
              </button>
              <button 
                onClick={onInitiateSMS}
                className="flex-1 px-8 py-5 bg-slate-950 border border-white/5 text-slate-50 font-bold uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-lg hover:border-brand-cyan/30 active:scale-95 transition-all flex items-center justify-center gap-4"
              >
                 <MessageSquare size={20} /> SMS Inquiry
              </button>
           </div>
        </div>

        <div className="absolute bottom-0 right-0 p-12 opacity-5 dark:opacity-10 transition-opacity pointer-events-none">
           <Phone size={250} className="text-brand-cyan stroke-[0.5]" />
        </div>
      </div>

      {/* ── ROW 4: BROADCAST HUB ── */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-sky-500/20 rounded-[40px] p-10 shadow-2xl relative overflow-hidden ring-1 ring-sky-500/10">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <Radio size={200} />
        </div>

        <div className="max-w-2xl relative z-10">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 bg-sky-500 rounded-2xl flex items-center justify-center text-slate-50 shadow-lg">
                <Radio size={20} className="animate-pulse" />
             </div>
             <h3 className="text-xl font-semibold text-slate-50 uppercase tracking-tighter leading-tight">Network Broadcast Hub</h3>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <input 
                id="broadcast-title"
                placeholder="Subject (e.g. Dengue Alert, Weather Warning)"
                className="w-full bg-slate-950/80 border border-white/10 rounded-2xl p-5 text-sm text-slate-50 outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-600"
              />
            </div>
            
            <div className="relative group">
              <textarea 
                id="broadcast-msg"
                placeholder="Type instructions for the BHW fleet..."
                className="w-full bg-slate-950/80 border border-white/10 rounded-2xl p-5 text-sm text-slate-50 outline-none focus:border-sky-500/50 min-h-[140px] resize-none transition-all placeholder:text-slate-600"
              />
            </div>

            <button 
              onClick={sendBroadcast}
              disabled={isTransmitting}
              className="w-full py-5 bg-sky-500 hover:bg-sky-400 text-slate-50 rounded-3xl text-[11px] font-semibold uppercase tracking-[0.3em] transition-all shadow-xl shadow-sky-500/20 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isTransmitting ? 'Transmitting...' : <><Send size={18} /> Transmit Announcement</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── HELPER COMPONENTS ──

function StatusMiniCard({ label, value, icon, color = "text-slate-400" }: any) {
  return (
    <div className="bg-slate-900/40 border border-white/5 p-5 rounded-[24px] flex flex-col justify-between h-28 shadow-lg">
      <div className={`p-2 w-fit bg-white/5 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-[8px] font-semibold text-slate-500 uppercase tracking-widest leading-relaxed">{label}</p>
        <p className="text-sm font-bold text-slate-50 mt-1 leading-relaxed">{value}</p>
      </div>
    </div>
  );
}

