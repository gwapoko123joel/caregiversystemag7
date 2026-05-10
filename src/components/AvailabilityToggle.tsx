import { useState, useEffect, useId } from 'react';
import { 
  CheckCircle2, 
  Coffee, 
  MinusCircle, 
  LogOut, 
  Stethoscope, 
  AlertTriangle,
  ChevronDown,
  Clock,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_OPTIONS = [
  { id: 'available', label: 'Available', icon: CheckCircle2, color: 'emerald', description: 'Ready for calls' },
  { id: 'on_break', label: 'On Break', icon: Coffee, color: 'amber', description: 'Briefly away' },
  { id: 'busy', label: 'Busy', icon: MinusCircle, color: 'red', description: 'Urgent calls only' },
  { id: 'in_consultation', label: 'In Consultation', icon: Stethoscope, color: 'brand-cyan', description: 'Currently with patient' },
  { id: 'emergency_only', label: 'Emergency Only', icon: AlertTriangle, color: 'orange', description: 'Critical interventions' },
  { id: 'off_duty', label: 'Off Duty', icon: LogOut, color: 'slate', description: 'Unavailable' },
];

export default function AvailabilityToggle() {
  const { user } = useAuth();
  const instanceId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<string>('off_duty');
  const [statusMessage, setStatusMessage] = useState('');
  const [busyUntil, setBusyUntil] = useState('');
  const [loading, setLoading] = useState(false);

  const [availability, setAvailability] = useState<any>(null);

  useEffect(() => {
    // Guard: don't subscribe if user isn't loaded yet
    if (!user?.id) return;

    const fetchAvailability = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('practitioner_availability')
        .select('*')
        .eq('caregiver_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[AvailabilityToggle] Fetch error:', error);
        setLoading(false);
        return;
      }

      if (!data) {
        // Create default row if missing
        const { data: newRow, error: insertError } = await supabase
          .from('practitioner_availability')
          .insert({ caregiver_id: user.id, status: 'off_duty' })
          .select()
          .single();

        if (insertError) {
          console.error('[AvailabilityToggle] Insert error:', insertError);
        } else {
          setAvailability(newRow);
          setStatus(newRow.status);
          setStatusMessage(newRow.status_message || '');
        }
      } else {
        setAvailability(data);
        setStatus(data.status);
        setStatusMessage(data.status_message || '');
        if (data.busy_until) {
          const d = new Date(data.busy_until);
          const hh = String(d.getHours()).padStart(2, '0');
          const mm = String(d.getMinutes()).padStart(2, '0');
          setBusyUntil(`${hh}:${mm}`);
        }
      }
      setLoading(false);
    };

    fetchAvailability();

    // Sanitize instanceId for channel name (replace colons which useId sometimes adds)
    const safeInstanceId = instanceId.replace(/:/g, '');
    const channelName = `availability-${user.id}-${safeInstanceId}`;

    // Defensive cleanup of any existing channel with same name
    const existingChannel = supabase.getChannels().find(c => c.topic === channelName);
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    // Build channel with listener registered BEFORE subscribe
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'practitioner_availability',
          filter: `caregiver_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            setAvailability(payload.new as any);
            const newData = payload.new as any;
            setStatus(newData.status);
            setStatusMessage(newData.status_message || '');
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[AvailabilityToggle] Realtime connected: ${channelName}`);
        }
      });

    const heartbeat = setInterval(() => {
      supabase.from('practitioner_availability')
        .update({ last_active_at: new Date().toISOString() })
        .eq('caregiver_id', user.id)
        .then();
    }, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(heartbeat);
    };
  }, [user?.id, instanceId]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!user) return;
    setLoading(true);

    try {
      const updates: any = {
        status: newStatus,
        status_message: statusMessage,
        last_status_change: new Date().toISOString(),
      };

      if (busyUntil && (newStatus === 'busy' || newStatus === 'on_break')) {
        const now = new Date();
        const [hours, minutes] = busyUntil.split(':');
        const busyDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(hours), parseInt(minutes));
        if (!isNaN(busyDate.getTime()) && busyDate > now) {
          updates.busy_until = busyDate.toISOString();
        } else if (!isNaN(busyDate.getTime())) {
          busyDate.setDate(busyDate.getDate() + 1);
          updates.busy_until = busyDate.toISOString();
        }
      } else {
        updates.busy_until = null;
      }

      const { error } = await supabase
        .from('practitioner_availability')
        .update(updates)
        .eq('caregiver_id', user.id);

      if (!error) {
        // SYNC: Also update the duty_status in the caregivers table for the real-time directory
        await supabase
          .from('caregivers')
          .update({ duty_status: newStatus })
          .eq('id', user.id);

        await supabase.from('activity_logs').insert({
          user_id: user.id,
          user_type: 'medical_practitioner',
          action: 'practitioner_status_changed',
          details: { status: newStatus, message: statusMessage }
        });
        setIsOpen(false);
      }
    } catch (err) {
      console.error('[AvailabilityToggle] Error updating status:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentOption = STATUS_OPTIONS.find(opt => opt.id === status) || STATUS_OPTIONS[5];
  const colorClass = currentOption.color === 'brand-cyan' ? 'text-brand-cyan' : `text-${currentOption.color}-500`;
  const bgClass = currentOption.color === 'brand-cyan' ? 'bg-brand-cyan/10' : `bg-${currentOption.color}-500/10`;

  if (!availability) {
    return (
      <div className="h-12 w-40 animate-pulse bg-white/5 rounded-full border border-white/5" />
    );
  }

  return (
    <div className="relative z-[100]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-4 py-2 rounded-full border border-white/5 backdrop-blur-xl shadow-lg transition-all hover:scale-105 active:scale-95 ${bgClass}`}
      >
        <div className={`w-2 h-2 rounded-full animate-pulse ${colorClass.replace('text-', 'bg-')}`} />
        <span className={`text-[10px] font-bold uppercase tracking-widest ${colorClass}`}>
          {currentOption.label} {busyUntil && status === 'busy' ? `UNTIL ${busyUntil}` : ''}
        </span>
        <ChevronDown size={14} className={colorClass} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute top-12 left-0 w-[300px] soft-card bg-slate-900 border border-white/10 p-4 space-y-4"
            >
              <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                <Clock size={16} className="text-brand-cyan" />
                <h4 className="text-[10px] font-light text-white uppercase tracking-widest">Update Availability</h4>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleUpdateStatus(opt.id)}
                    disabled={loading}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5 group ${status === opt.id ? 'bg-white/5 ring-1 ring-white/10' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${status === opt.id ? (opt.color === 'brand-cyan' ? 'bg-brand-cyan/20 text-brand-cyan' : `bg-${opt.color}-500/20 text-${opt.color}-500`) : 'bg-slate-950 text-slate-500 group-hover:text-white'}`}>
                      <opt.icon size={18} />
                    </div>
                    <div className="text-left">
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${status === opt.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                        {opt.label}
                      </p>
                      <p className="text-[8px] text-slate-600 uppercase tracking-tighter">{opt.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="space-y-3 pt-2 border-t border-white/5">
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest px-1">Custom Message</label>
                  <div className="relative">
                    <MessageSquare size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input
                      type="text"
                      value={statusMessage}
                      onChange={(e) => setStatusMessage(e.target.value)}
                      placeholder="e.g. In surgery until 3pm"
                      className="w-full bg-slate-950 border border-white/5 rounded-lg py-2 pl-8 pr-3 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-brand-cyan/30"
                    />
                  </div>
                </div>

                {(status === 'busy' || status === 'on_break') && (
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest px-1">Busy Until</label>
                    <div className="relative">
                      <Clock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                      <input
                        type="time"
                        value={busyUntil}
                        onChange={(e) => setBusyUntil(e.target.value)}
                        className="w-full bg-slate-950 border border-white/5 rounded-lg py-2 pl-8 pr-3 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-brand-cyan/30"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleUpdateStatus(status)}
                  className="w-full py-2 bg-brand-cyan text-slate-950 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Apply Status Update
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
