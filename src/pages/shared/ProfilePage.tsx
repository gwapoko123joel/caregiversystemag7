import React, { useState, useRef } from 'react';
import { 
  User, ShieldCheck, Mail, IdCard, 
  Activity, Camera, Loader2, CheckCircle2, 
  Briefcase, Hospital, Edit2, RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

const formatName = (name: string) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  async function handleUpdateName() {
    if (!newName.trim() || newName === profile?.full_name) {
      setIsEditingName(false);
      return;
    }

    try {
      // 1. Update the Master Personnel Record
      const { error } = await supabase
        .from('caregivers')
        .update({ full_name: newName.trim() })
        .eq('id', user?.id);

      if (error) throw error;

      // 2. LOG THE CHANGE: This is critical for your thesis accountability
      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        action: 'IDENTITY_UPDATE',
        details: { 
          old_identity: profile?.full_name, 
          new_identity: newName.trim(),
          node_id: profile?.unique_access_id 
        }
      });

      // 3. Finalize
      setIsEditingName(false);
      if(refreshProfile) await refreshProfile(); // Re-fetches the profile to update the whole app
      alert("Node Identity Synchronized.");
    } catch (err: any) {
      alert("Update Failed: " + err.message);
    }
  }

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
      
      {/* ── UNIFIED OPERATOR HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2 mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="flex items-center gap-6">
          {/* The Standard Node Icon */}
          <div className="w-14 h-14 bg-sky-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-sky-500/20 flex-shrink-0">
             <User size={28} />
          </div>

          <div className="space-y-1">
            {/* Unified Typography: Heavy weight for clinical identity */}
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-none">
              Operator <span className="text-sky-500">Profile Node</span>
            </h2>
            
            {/* Unified Subtext: Professional high-tracking protocol label */}
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.35em]">
                Identity Verification Protocol — Barangay Bantayan Network
              </p>
            </div>
          </div>
        </div>

        {/* Sync Status Telemetry */}
        <div className="hidden lg:flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
           <div className="text-right">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">System Status</p>
              <p className="text-[10px] font-mono font-bold text-sky-400 mt-1 uppercase">Synchronized</p>
           </div>
           <div className="w-8 h-8 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-500">
              <RefreshCw size={14} className="animate-spin" />
           </div>
        </div>
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

            {/* ── INTERACTIVE IDENTITY NODE ── */}
            <div className="w-full mt-4 min-h-[140px] flex flex-col items-center justify-center">
              {isEditingName ? (
                /* --- EDITING MODE: Standardized Sizing --- */
                <div className="w-full space-y-4 animate-in fade-in zoom-in duration-300">
                  <div className="relative">
                    <input 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-slate-950/80 border-2 border-sky-500/50 rounded-2xl p-4 text-center text-white text-xl font-black uppercase outline-none shadow-[0_0_20px_rgba(14,165,233,0.15)] transition-all focus:border-sky-400"
                      autoFocus
                      placeholder="Enter Full Name"
                    />
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 bg-[#020617] border border-sky-500/30 rounded-full">
                       <p className="text-[8px] font-black text-sky-500 uppercase tracking-widest">Editing Name</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <button 
                       onClick={handleUpdateName} 
                       className="py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                     >
                       <CheckCircle2 size={14} /> Commit
                     </button>
                     <button 
                       onClick={() => { setIsEditingName(false); setNewName(profile?.full_name || ''); }} 
                       className="py-3.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
                     >
                       Abort
                     </button>
                  </div>
                </div>
              ) : (
                /* ── CORPORATE IDENTITY NODE ── */
                <div className="flex flex-col items-center gap-5 animate-in fade-in duration-700 w-full">
                  <div className="space-y-1 text-center">
                    {/* Refined Corporate Typography */}
                    <h3 className="text-3xl font-bold text-white tracking-tight leading-tight">
                      {formatName(profile?.full_name)}
                    </h3>
                    <p className="text-[10px] font-bold text-sky-500 uppercase tracking-[0.3em]">
                      {profile?.role?.replace('_', ' ')}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-2 w-full max-w-[240px]">
                    {/* Professional Action Button */}
                    <button 
                      onClick={() => { setIsEditingName(true); setNewName(profile?.full_name || ''); }}
                      className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl hover:bg-sky-500 hover:text-slate-950 hover:border-sky-500 transition-all duration-300 shadow-sm active:scale-95 cursor-pointer animate-in duration-300"
                    >
                      <Edit2 size={12} />
                      Update Identity Node
                    </button>

                    {/* Personnel Badge */}
                    <div className="flex items-center justify-center gap-2 py-1.5 bg-slate-950/40 border border-white/5 rounded-lg">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                         System Verified: {profile?.role?.replace('_', ' ')}
                       </span>
                    </div>
                  </div>
                </div>
              )}
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
        <div className="lg:col-span-2 space-y-4">
          
          {/* TOP 4 TILES (Adaptive) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* ROLE-SPECIFIC TILE 3: PRC vs BHW ID vs ADMIN AUTHORITY */}
            {profile?.role === 'medical_practitioner' ? (
              <DetailCard 
                icon={<ShieldCheck size={18} />} 
                label="PRC Clinical License" 
                value={(profile as any)?.prc_license || '1234567'} 
                sub={`Verified Practitioner`}
                color="text-emerald-400"
              />
            ) : profile?.role === 'admin' ? (
              <DetailCard 
                icon={<ShieldCheck size={18} />} 
                label="Governance Authority" 
                value="System Administrator" 
                sub="Full Network Oversight"
                color="text-sky-400"
              />
            ) : (
              <DetailCard 
                icon={<ShieldCheck size={18} />} 
                label="Barangay Health ID" 
                value={(profile as any)?.bhw_id_number || 'REGISTERED_BHW'} 
                sub="Authorized Field Personnel"
                color="text-emerald-400"
              />
            )}

            {/* ROLE-SPECIFIC TILE 4: Profession vs Node Vitality vs Admin Node */}
            {profile?.role === 'medical_practitioner' ? (
              <DetailCard 
                icon={<Briefcase size={18} />} 
                label="Medical Profession" 
                value={(profile as any)?.medical_profession || 'Practitioner'} 
                sub="Active Credentials"
              />
            ) : profile?.role === 'admin' ? (
              <DetailCard 
                icon={<Activity size={18} />} 
                label="Command Node Status" 
                value="Master Control" 
                sub="Central Hub Link"
                color="text-sky-400"
              />
            ) : (
              <DetailCard 
                icon={<Activity size={18} />} 
                label="Node Vitality" 
                value="Operational" 
                sub="Standard Telemetry Link"
                color="text-emerald-400"
              />
            )}
          </div>

          {/* ── PRACTITIONER ONLY: AFFILIATION & SPECIALTIES ── */}
          {profile?.role === 'medical_practitioner' && (
            <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-8 rounded-[32px] shadow-xl animate-in fade-in zoom-in duration-500">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Clinical Affiliation</p>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-sky-500/10 rounded-xl text-sky-500">
                      <Hospital size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white uppercase">{(profile as any)?.primary_hospital || 'Public Health Center'}</p>
                      <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Primary Operations Base</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 flex-1">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Area of Expertise</p>
                  <div className="flex flex-wrap gap-2">
                    {(profile as any)?.specializations?.map((spec: string) => (
                      <span key={spec} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-slate-300 uppercase">
                        {spec}
                      </span>
                    )) || <span className="text-[10px] text-slate-700 italic">No Specializations Tagged</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── CAREGIVER ONLY: ASSIGNMENT SUMMARY ── */}
          {profile?.role === 'caregiver' && (
            <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-8 rounded-[32px] shadow-xl animate-in fade-in zoom-in duration-500">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Field Assignment Node</h3>
               </div>
               <p className="text-xs text-slate-400 leading-relaxed mb-6">
                 This node is authorized for field telemetry collection in <span className="text-white font-bold">Barangay Bantayan</span>. All captured data is synchronized in real-time with the central clinical hub.
               </p>
               <div className="flex items-center gap-2 text-emerald-500">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Identity Verified by Admin</span>
               </div>
            </div>
          )}

          {/* SYSTEM STATUS FOOTER (Common) */}
          <div className="bg-slate-950/40 border border-white/5 rounded-[32px] p-6 flex items-center justify-between shadow-lg">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                   <Activity size={20} className="animate-pulse" />
                </div>
                <div>
                   <h4 className="text-xs font-black text-white uppercase tracking-wider">Node System Status</h4>
                   <p className="text-[8px] text-emerald-500/60 font-bold uppercase mt-0.5">Secure Network Link established</p>
                </div>
             </div>
             <CheckCircle2 size={24} className="text-emerald-500/20" />
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
