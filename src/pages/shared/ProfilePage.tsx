import { useState, useRef } from 'react';
import { 
  User, ShieldCheck, Mail, IdCard, 
  Activity, Camera, Loader2, CheckCircle2, 
  Globe
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- LOGIC: HANDLE IMAGE UPLOAD ---
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}-${Math.random()}.${fileExt}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Update the Caregivers table
      const { error: updateError } = await supabase
        .from('caregivers')
        .update({ profile_picture_url: filePath })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      alert("Profile Node Updated.");
      if(refreshProfile) await refreshProfile(); // Refresh global auth state

    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  }

  const avatarUrl = profile?.profile_picture_url 
    ? supabase.storage.from('avatars').getPublicUrl(profile.profile_picture_url).data.publicUrl 
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4 md:px-0">
      
      {/* ── HEADER ── */}
      <div className="px-2">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-3">
          Operator <span className="text-sky-500">Profile Node</span>
        </h2>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">
          Barangay Monitoring Network — Identity Verification
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: AVATAR & PRIMARY IDENTITY */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[40px] p-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
            {/* Background Shield Glow */}
            <ShieldCheck size={200} className="absolute -right-20 -top-20 opacity-5 text-sky-500" />
            
            {/* PROFILE IMAGE NODE */}
            <div className="relative mb-8">
              <div className="w-40 h-40 rounded-full border-4 border-slate-950 shadow-2xl overflow-hidden bg-slate-900 flex items-center justify-center ring-4 ring-sky-500/20 group-hover:ring-sky-500/40 transition-all">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    className="w-full h-full object-cover"
                    alt="Profile"
                  />
                ) : (
                  <User size={64} className="text-slate-700" />
                )}
                
                {/* UPLOAD OVERLAY */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2"
                >
                  {uploading ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white" />}
                  <span className="text-[8px] font-black text-white uppercase tracking-widest">Update Photo</span>
                </button>
              </div>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} accept="image/*" />
            </div>

            <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-tight mb-2">
              {profile?.full_name}
            </h3>
            <div className="px-4 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-full">
               <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest">
                 {profile?.role?.replace('_', ' ')}
               </p>
            </div>

            <div className="w-full mt-10 pt-8 border-t border-white/5 space-y-4">
               <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <span>Node Latency</span>
                  <span className="text-emerald-500">92ms (Optimal)</span>
               </div>
               <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-emerald-500 animate-pulse" />
               </div>
            </div>
          </div>
        </div>

        {/* RIGHT: DATA BENTO GRID */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailCard 
            icon={<Mail size={18} />} 
            label="Network Interface" 
            value={profile?.email?.toLowerCase()} 
            sub="Cloud Synchronized"
          />
          <DetailCard 
            icon={<IdCard size={18} />} 
            label="Personnel Identity" 
            value={profile?.unique_access_id} 
            sub="Immutable Access Key"
            color="text-sky-400"
          />
          <DetailCard 
            label={profile?.role === 'medical_practitioner' ? "PRC License Number" : "Barangay Health ID"} 
            value={profile?.role === 'medical_practitioner' ? profile?.prc_license_number : profile?.bhw_id_number} 
            sub="Verified Clinical Credential"
            color="text-emerald-400" 
          />
          <DetailCard 
            icon={<Globe size={18} />} 
            label="Operational Zone" 
            value="Barangay Bantayan" 
            sub="Dumaguete Hub X-01"
          />
          
          <div className="md:col-span-2 bg-emerald-500/5 border border-emerald-500/10 rounded-[32px] p-8 flex items-center justify-between shadow-lg">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                   <Activity size={24} />
                </div>
                <div>
                   <h4 className="text-sm font-black text-white uppercase tracking-wider">Node System Status</h4>
                   <p className="text-[10px] text-emerald-500/60 font-bold uppercase mt-1 tracking-widest">Active & Authorized via Governance Protocol</p>
                </div>
             </div>
             <div className="hidden md:block">
                <CheckCircle2 size={32} className="text-emerald-500/20" />
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- HELPER COMPONENT ---
function DetailCard({ icon, label, value, sub, color = "text-white" }: any) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-6 rounded-[32px] flex flex-col justify-between hover:bg-slate-900/60 transition-all shadow-xl group min-h-[160px]">
      {/* Icon Node */}
      <div className="p-3 bg-white/5 rounded-2xl w-fit text-slate-500 group-hover:text-sky-500 group-hover:scale-110 transition-all duration-300">
        {icon}
      </div>

      {/* Data Content */}
      <div className="mt-4">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5 opacity-70">
          {label}
        </p>
        
        {/* FIX: Removed 'uppercase' and 'truncate'. Added 'break-all' and adjusted size */}
        <p className={`text-[13px] font-bold leading-tight break-all ${color} tracking-tight`}>
          {value}
        </p>
        
        <div className="flex items-center gap-1.5 mt-2">
           <div className="w-1 h-1 rounded-full bg-sky-500/40" />
           <p className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">{sub}</p>
        </div>
      </div>
    </div>
  );
}

// --- SHARED UI COMPONENT: FORM FIELD ---
export function FormField({ label, icon: Icon, value, onChange, placeholder, type = "text" }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-500 transition-colors">
          <Icon size={16} />
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-700"
        />
      </div>
    </div>
  );
}
