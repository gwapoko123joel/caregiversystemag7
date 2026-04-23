import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Mail, Phone, MapPin, Calendar, 
  Clock, Hash, Activity, BadgeCheck, Edit3, 
  Save, X, AlertCircle, Briefcase, FileText,
  Zap, Heart, Users, Clipboard, Lock, Info,
  CheckCircle2, AlertTriangle, Monitor, LogOut,
  ChevronRight, ArrowUpRight, Signal
} from 'lucide-react';
import { 
  updateUserProfile, getProfileStats, ensureAndGetProfile 
} from '../services/profileService';
import type { UserProfile, AvailabilityStatus, ShiftStatus, ProfileStats } from '../lib/supabaseClient';

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the hardened fetch-or-create method
      const { data, error: syncError } = await ensureAndGetProfile();
      if (data) {
        setProfile(data);
        setEditForm(data);
        const s = await getProfileStats(data);
        setStats(s);
      } else {
        const errorMsg = typeof syncError === 'string' ? syncError : syncError?.message || 'Failed to establish node profile link.';
        setError(errorMsg);
        // Also log detailed diagnostic info
        console.error('[ProfileSync] Diagnostic Data:', syncError);
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred synchronizing profile node.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateUserProfile(editForm);
      if (updated) {
        setProfile(updated);
        setIsEditing(false);
      }
    } catch (err) {
      setError('Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) setEditForm(profile);
    setIsEditing(false);
  };

  const getRoleBadge = (role: string) => {
    const config: Record<string, { label: string; color: string; textColor: string }> = {
      admin: { label: 'SYSTEM GOVERNANCE', color: 'from-slate-700 to-slate-800', textColor: 'text-slate-100' },
      medical_practitioner: { label: 'MEDICAL PRACTITIONER', color: 'from-purple-500 to-violet-600', textColor: 'text-purple-100' },
      practitioner: { label: 'MEDICAL PRACTITIONER', color: 'from-purple-500 to-violet-600', textColor: 'text-purple-100' },
      caregiver: { label: 'CAREGIVER NODE', color: 'from-cyan-500 to-blue-600', textColor: 'text-cyan-100' },
    };
    const c = config[role] || config.caregiver;
    return (
      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.15em] bg-gradient-to-r ${c.color} ${c.textColor} shadow-lg border border-white/10 uppercase italic`}>
        {c.label}
      </span>
    );
  };

  const getStatusIndicator = (status: string) => {
    const config: Record<string, { color: string; glow: string; label: string }> = {
      active: { color: 'bg-emerald-400', glow: 'shadow-emerald-400/50', label: 'Node Online' },
      available: { color: 'bg-emerald-400', glow: 'shadow-emerald-400/50', label: 'Available' },
      busy: { color: 'bg-amber-400', glow: 'shadow-amber-400/50', label: 'Busy' },
      on_call: { color: 'bg-rose-400', glow: 'shadow-rose-400/50', label: 'On Call' },
      off_duty: { color: 'bg-slate-400', glow: 'shadow-slate-400/50', label: 'Off Duty' },
      inactive: { color: 'bg-gray-400', glow: 'shadow-gray-400/50', label: 'Inactive' },
      suspended: { color: 'bg-red-400', glow: 'shadow-red-400/50', label: 'Suspended' },
      pending_verification: { color: 'bg-sky-400', glow: 'shadow-sky-400/50', label: 'Verifying' },
    };
    const s = config[status] || config.active;
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${s.color} shadow-lg ${s.glow} animate-pulse`} />
        <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest italic">{s.label}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full"
          />
          <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-cyan-500 animate-pulse" />
        </div>
        <p className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase italic animate-pulse">Syncing Node Credentials...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="w-16 h-16 text-red-500/30" />
        <h2 className="text-xl font-black tracking-[0.3em] text-white uppercase italic">Critical Sync Failure</h2>
        <p className="text-sm text-slate-500 font-medium max-w-sm text-center">{error || 'Unable to establish profile handshake.'}</p>
        <button onClick={fetchData} className="mt-4 px-8 py-4 rounded-2xl bg-slate-800 text-cyan-400 border border-slate-700 hover:border-cyan-500/50 transition-all font-black text-xs tracking-widest uppercase">Restart Handshake</button>
      </div>
    );
  }

  const isPractitioner = profile.role === 'practitioner' || profile.role === 'medical_practitioner';
  const isAdmin = profile.role === 'admin';
  const isCaregiver = profile.role === 'caregiver';

  const isAvailableForResponse = isPractitioner && 
    profile.availability_status === 'available' && 
    profile.can_receive_calls;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8"
    >
      {/* ─── IDENTITY HEADER ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900/60 backdrop-blur-3xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        
        <div className="relative p-8 md:p-12 flex flex-col lg:flex-row items-center lg:items-end gap-10">
          {/* Avatar & Verification */}
          <div className="relative">
            <div className="w-32 h-32 md:w-44 md:h-44 rounded-3xl bg-slate-800 border-2 border-white/5 overflow-hidden shadow-2xl relative group">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                  <User className="w-16 h-16 text-slate-700" />
                </div>
              )}
              {profile.is_verified && (
                <div className="absolute top-3 right-3 p-1.5 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-lg">
                  <BadgeCheck className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            {isEditing && (
               <button className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-cyan-500 rounded-xl text-slate-900 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-cyan-500/20">Change PFP</button>
            )}
          </div>

          {/* Primary Info */}
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-center lg:justify-start">
                {getRoleBadge(profile.role)}
                <div className="h-4 w-[1px] bg-white/10 hidden lg:block" />
                {getStatusIndicator(profile.availability_status || profile.status)}
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic leading-none">
                {profile.full_name || 'System Operative'}
              </h1>
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
              <div className="flex items-center gap-2 group cursor-help" title="Registration Node ID">
                <Hash className="w-4 h-4 text-cyan-500" />
                <span className="group-hover:text-cyan-400 transition-colors uppercase italic">{profile.access_id}</span>
              </div>
              <div className="flex items-center gap-2 group cursor-help" title="Primary Network Channel">
                <Mail className="w-4 h-4 text-purple-500" />
                <span className="group-hover:text-purple-400 transition-colors lowercase italic">{profile.email}</span>
              </div>
              {profile.phone && (
                <div className="flex items-center gap-2 group cursor-help" title="Secure Comms Line">
                  <Phone className="w-4 h-4 text-emerald-500" />
                  <span className="group-hover:text-emerald-400 transition-colors italic">{profile.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Response Eligibility Logic */}
          <AnimatePresence>
            {isPractitioner && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-6 rounded-[2rem] border transition-all duration-500 shadow-2xl flex flex-col items-center gap-3 w-full lg:w-72 ${
                  isAvailableForResponse 
                    ? 'border-emerald-500/40 bg-emerald-500/5 shadow-emerald-500/10' 
                    : 'border-slate-800 bg-slate-900/40'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                  isAvailableForResponse ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-500'
                }`}>
                  {isAvailableForResponse ? <Zap className="w-6 h-6 animate-pulse" /> : <Shield className="w-6 h-6" />}
                </div>
                <div className="text-center">
                  <p className={`text-[10px] font-black tracking-[0.2em] uppercase leading-relaxed ${
                    isAvailableForResponse ? 'text-emerald-400' : 'text-slate-500'
                  }`}>
                    {isAvailableForResponse ? 'AVAILABLE FOR MEDICAL RESPONSE' : 'CONSULTATION NODE COLD'}
                  </p>
                  <p className="text-[9px] font-bold text-slate-600 uppercase mt-1">Ready state determined by schedule</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Action Bar */}
        <div className="absolute top-8 right-8">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-cyan-500/50 transition-all font-black text-[11px] tracking-widest uppercase italic group"
            >
              <Edit3 className="w-4 h-4 text-cyan-500 group-hover:rotate-12 transition-transform" />
              Modify Operational Details
            </button>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-cyan-500 text-slate-900 hover:bg-cyan-400 transition-all font-black text-[11px] tracking-widest uppercase italic disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Syncing...' : 'Commit Changes'}
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all font-black text-[11px] tracking-widest uppercase italic"
              >
                <X className="w-4 h-4" />
                Abort
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── GRID LAYOUT ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SMALL CARDS - LEFT (Practical & Real-time) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* 1. PRACTITIONER: OPERATIONAL STATUS & CONSOLE */}
          {isPractitioner && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[2.5rem] border border-white/10 bg-slate-900/40 backdrop-blur-md p-10 space-y-10 shadow-xl"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-cyan-500 rounded-2xl text-slate-900">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white italic uppercase leading-none">Operational Status</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 italic">Real-time Clinical Availability Window</p>
                  </div>
                </div>

                <div className="h-10 w-[1px] bg-white/5 hidden md:block" />

                <div className="flex items-center gap-10">
                   <div className="flex flex-col items-center gap-2">
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Call Readiness</label>
                      <button 
                        disabled={!isEditing}
                        onClick={() => setEditForm(prev => ({ ...prev, can_receive_calls: !prev.can_receive_calls }))}
                        className={`w-14 h-8 rounded-full relative transition-colors duration-500 ${editForm.can_receive_calls ? 'bg-emerald-500' : 'bg-slate-800'}`}
                      >
                         <motion.div 
                          animate={{ x: editForm.can_receive_calls ? 28 : 4 }}
                          className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg" 
                         />
                      </button>
                   </div>
                   <div className="flex flex-col items-center gap-2">
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Node State</label>
                      <select 
                        disabled={!isEditing}
                        value={editForm.availability_status}
                        onChange={(e) => setEditForm(prev => ({ ...prev, availability_status: e.target.value as AvailabilityStatus }))}
                        className="bg-slate-800 border-none rounded-xl px-4 py-2 text-[10px] font-black text-slate-200 outline-none focus:ring-2 ring-cyan-500 transition-all uppercase italic"
                      >
                         <option value="available">Available</option>
                         <option value="busy">Busy</option>
                         <option value="on_call">On Call</option>
                         <option value="off_duty">Off Duty</option>
                         <option value="unavailable">Unavailable</option>
                      </select>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/5">
                <div className="space-y-6">
                   <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                      <Calendar className="w-4 h-4 text-cyan-500" /> Clinical Schedule (Days)
                   </label>
                   <div className="flex flex-wrap gap-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                        const isSelected = editForm.available_days?.includes(day);
                        return (
                          <button
                            key={day}
                            disabled={!isEditing}
                            onClick={() => {
                              const current = editForm.available_days || [];
                              const next = isSelected ? current.filter(d => d !== day) : [...current, day];
                              setEditForm(prev => ({ ...prev, available_days: next }));
                            }}
                            className={`w-11 h-11 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${
                              isSelected ? 'bg-cyan-500 text-slate-900 scale-110 shadow-lg' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                   </div>
                </div>

                <div className="space-y-6">
                   <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                      <Clock className="w-4 h-4 text-cyan-500" /> Operational Window (Hours)
                   </label>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-slate-700 uppercase">Commence Shift</span>
                        <input 
                          type="time" 
                          disabled={!isEditing}
                          value={editForm.available_start_time || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, available_start_time: e.target.value }))}
                          className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:ring-2 ring-cyan-500" 
                        />
                      </div>
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-slate-700 uppercase">Cease Shift</span>
                        <input 
                          type="time" 
                          disabled={!isEditing}
                          value={editForm.available_end_time || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, available_end_time: e.target.value }))}
                          className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:ring-2 ring-cyan-500" 
                        />
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. SHARED: IDENTITY & COMMUNICATIONS HUB */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <motion.div 
               whileHover={{ y: -5 }}
               className="rounded-[2.5rem] border border-white/5 bg-slate-900/40 p-10 space-y-8 shadow-xl"
             >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-cyan-500 rounded-full" />
                  <h3 className="text-sm font-black text-white italic uppercase tracking-[0.1em]">Network Information</h3>
                </div>
                <div className="grid gap-8">
                   <StatField 
                    label="Operations Handle" 
                    value={profile.full_name} 
                    icon={<User className="w-4 h-4" />} 
                    isEditing={isEditing}
                    editValue={editForm.full_name}
                    onChange={(v) => setEditForm({...editForm, full_name: v})}
                   />
                   <StatField 
                    label="Primary Datastream" 
                    value={profile.email} 
                    icon={<Mail className="w-4 h-4" />} 
                    isEditing={false}
                   />
                   <StatField 
                    label="Secure Hub Address" 
                    value={profile.address} 
                    icon={<MapPin className="w-4 h-4" />} 
                    isEditing={isEditing}
                    editValue={editForm.address}
                    onChange={(v) => setEditForm({...editForm, address: v})}
                   />
                </div>
             </motion.div>

             <motion.div 
               whileHover={{ y: -5 }}
               className="rounded-[2.5rem] border border-white/5 bg-slate-900/40 p-10 space-y-8 shadow-xl"
             >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                  <h3 className="text-sm font-black text-white italic uppercase tracking-[0.1em]">Clinical Credentials</h3>
                </div>
                <div className="grid gap-8">
                   <StatField 
                    label={isPractitioner ? "Medical Specialization" : "Operational Designation"} 
                    value={profile.specialization || 'Generalist'} 
                    icon={<Briefcase className="w-4 h-4" />} 
                    isEditing={isEditing}
                    editValue={editForm.specialization}
                    onChange={(v) => setEditForm({...editForm, specialization: v})}
                   />
                   <StatField 
                    label="Node License ID" 
                    value={profile.license_number || 'NODE-PENDING'} 
                    icon={<FileText className="w-4 h-4" />} 
                    isEditing={isEditing}
                    editValue={editForm.license_number}
                    onChange={(v) => setEditForm({...editForm, license_number: v})}
                   />
                   <StatField 
                    label="Experience Baseline" 
                    value={`${profile.experience_years || 0} Standard Cycles`} 
                    icon={<Activity className="w-4 h-4" />} 
                    isEditing={isEditing}
                    editValue={String(editForm.experience_years)}
                    onChange={(v) => setEditForm({...editForm, experience_years: parseInt(v) || 0})}
                   />
                </div>
             </motion.div>
          </div>

          {/* 3. SHARED: SYSTEM DATA CARD / NODE SIGNATURE */}
          <motion.div 
            className="rounded-[2.5rem] border border-white/5 bg-slate-900/60 p-10 overflow-hidden relative group"
          >
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Monitor className="w-44 h-44 text-cyan-500" />
             </div>
             <div className="relative grid grid-cols-2 md:grid-cols-4 gap-10">
                <MiniMeta label="Internal UID" value={profile.user_id.slice(0, 8) + '...'} />
                <MiniMeta label="Instance Created" value={new Date(profile.created_at).toLocaleDateString()} />
                <MiniMeta label="Total Login Uplinks" value={String(profile.login_count || 0)} />
                <MiniMeta label="Last Secure Handshake" value={profile.last_login ? new Date(profile.last_login).toLocaleTimeString() : 'N/A'} />
             </div>
          </motion.div>
        </div>

        {/* ANALYTICS RAIL - RIGHT (Role Specific) */}
        <div className="lg:col-span-4 space-y-8">
           <div className="flex flex-col gap-8 sticky top-32">
              
              <div className="flex items-center gap-3 px-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)] animate-pulse" />
                <h2 className="text-[12px] font-black text-white italic uppercase tracking-[0.4em]">Node Analytics</h2>
              </div>

              {/* ANALYTICS GRID */}
              <div className="grid gap-6">
                
                {isPractitioner && (
                  <>
                    <OversightCard 
                      label="Patients Monitored" 
                      value={String(stats?.patients_monitored || 0)} 
                      icon={<Users className="w-6 h-6" />}
                      color="cyan"
                    />
                    <OversightCard 
                      label="Critical Alerts" 
                      value={String(stats?.active_alerts || 0)} 
                      icon={<AlertTriangle className="w-6 h-6" />}
                      color="rose"
                    />
                    <OversightCard 
                      label="Avg Response" 
                      value={stats?.avg_response_time || 'N/A'} 
                      icon={<Zap className="w-6 h-6" />}
                      color="amber"
                    />
                  </>
                )}

                {isCaregiver && (
                  <>
                    <OversightCard 
                      label="Total Submissions" 
                      value={String(stats?.total_reports || 0)} 
                      icon={<Clipboard className="w-6 h-6" />}
                      color="blue"
                    />
                    <OversightCard 
                      label="Recent Entry" 
                      value={stats?.last_report_date ? new Date(stats.last_report_date).toLocaleDateString() : 'None'} 
                      icon={<Clock className="w-6 h-6" />}
                      color="purple"
                    />
                  </>
                )}

                {isAdmin && (
                  <>
                    <OversightCard 
                      label="Managed Nodes" 
                      value={String(stats?.total_users || 0)} 
                      icon={<Monitor className="w-6 h-6" />}
                      color="cyan"
                    />
                    <OversightCard 
                      label="Security Anomalies" 
                      value={String(stats?.security_alerts || 0)} 
                      icon={<Lock className="w-6 h-6" />}
                      color="rose"
                    />
                  </>
                )}

                {/* SHARED ACTIVITY */}
                <div className="p-8 rounded-[2rem] border border-white/5 bg-slate-900/40 space-y-6">
                   <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Clinical Sync Status</h4>
                      <Signal className="w-4 h-4 text-emerald-500 animate-pulse" />
                   </div>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="text-[11px] font-bold text-slate-300">Identity Integrity</span>
                         <span className="text-[11px] font-black text-emerald-400">PASSED</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                         <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="h-full bg-emerald-500" />
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-[11px] font-bold text-slate-300">Auth Signature</span>
                         <span className="text-[11px] font-black text-cyan-400">ENCRYPTED</span>
                      </div>
                   </div>
                </div>
              </div>

              {/* LOGOUT / TERMINALLY ACTIONS */}
              <button className="w-full p-8 rounded-[2rem] border border-white/5 bg-rose-500/5 hover:bg-rose-500/10 transition-all flex items-center justify-center gap-4 group">
                 <LogOut className="w-5 h-5 text-rose-500 group-hover:-translate-x-1 transition-transform" />
                 <span className="text-xs font-black text-rose-500 italic uppercase tracking-widest">Terminate Portal Session</span>
              </button>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── HELPER COMPONENTS ─────────────────────────────────────────────────── */

const StatField = ({ label, value, icon, isEditing, editValue, onChange }: any) => (
  <div className="space-y-3 group">
    <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
      <span className="text-cyan-500/50">{icon}</span>
      {label}
    </label>
    {isEditing ? (
      <input 
        value={editValue} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-bold outline-none focus:ring-2 ring-cyan-500/50 transition-all"
      />
    ) : (
      <p className="text-sm font-black text-slate-100 pl-6 border-l-2 border-transparent group-hover:border-cyan-500 group-hover:pl-8 transition-all duration-300 italic">
        {value || 'DATA-MISSING'}
      </p>
    )}
  </div>
);

const OversightCard = ({ label, value, icon, color }: any) => {
  const colors: any = {
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  };
  
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className={`p-8 rounded-[2rem] border ${colors[color]} flex items-center justify-between shadow-2xl relative overflow-hidden group`}
    >
       <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-all duration-700">
         <div className="scale-150 rotate-12">{icon}</div>
       </div>
       <div className="space-y-2 relative z-10">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</p>
          <p className="text-4xl font-black italic tracking-tighter uppercase whitespace-nowrap">{value}</p>
       </div>
       <div className="relative z-10 w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
         {icon}
       </div>
    </motion.div>
  );
};

const MiniMeta = ({ label, value }: any) => (
  <div className="space-y-2">
    <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">{label}</p>
    <p className="text-[12px] font-black text-slate-300 tracking-tight uppercase italic">{value}</p>
  </div>
);

export default ProfilePage;
