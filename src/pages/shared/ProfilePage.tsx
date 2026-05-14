import { User, ShieldCheck, Mail, IdCard, Activity } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function ProfilePage() {
  const { profile } = useAuth(); // Assuming this holds the user's DB data

  return (
    <div className="max-w-2xl mx-auto py-10 animate-in fade-in duration-700">
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[40px] p-10 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 p-10 opacity-5">
           <ShieldCheck size={200} />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Circular Avatar Placeholder */}
          <div className="w-32 h-32 bg-sky-500/10 rounded-full border-2 border-sky-500/20 flex items-center justify-center mb-6 shadow-2xl">
            <User size={64} className="text-sky-500" />
          </div>

          <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-1">{profile?.full_name}</h2>
          <p className="text-sky-500 font-bold uppercase text-[10px] tracking-[0.3em] mb-8">Authorized {profile?.role?.replace('_', ' ')}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <InfoBox icon={<Mail size={16}/>} label="Network Email" value={profile?.email} />
            <InfoBox icon={<IdCard size={16}/>} label="Personnel ID" value={profile?.unique_access_id} />
            <InfoBox icon={<ShieldCheck size={16}/>} label="Verified License" value={profile?.prc_license || profile?.bhw_id || 'REGISTERED'} />
            <InfoBox icon={<Activity size={16}/>} label="Node Status" value="Online & Synchronized" color="text-emerald-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ icon, label, value, color = "text-white" }: any) {
  return (
    <div className="bg-slate-950/50 p-5 rounded-3xl border border-white/5 text-left">
      <div className="flex items-center gap-2 text-slate-500 mb-1">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-sm font-bold truncate ${color}`}>{value}</p>
    </div>
  );
}
