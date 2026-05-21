import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail, Lock, Heart,
  Shield, Activity, Fingerprint, ArrowLeft,
  Eye, EyeOff, Loader2, UserPlus, ShieldCheck, User, Stethoscope
} from 'lucide-react';
import { healthWorkerLogin, getCurrentSession } from '../../services/authService';
import { ensureUserProfile } from '../../services/profileService';

type Role = 'caregiver' | 'medical_practitioner';

const HealthWorkerLoginPage = () => {
  const navigate = useNavigate();
  const [accessId, setAccessId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const [userType, setUserType] = useState<Role>('caregiver');

  useEffect(() => {
    const checkSession = async () => {
      const session = await getCurrentSession();
      if (session && session.role) {
        if (session.role === 'caregiver') navigate('/dashboard/caregiver');
        else if (session.role === 'medical_practitioner') navigate('/dashboard/practitioner');
        else if (session.role === 'admin') navigate('/dashboard/admin');
      }
      setCheckingSession(false);
    };
    checkSession();
  }, [navigate]);

  // ── SMART LOGIC: AUTO-HIGHLIGHT ROLE ──
  const handleAccessIdChange = (val: string) => {
    const upperVal = val.toUpperCase();
    setAccessId(upperVal);
    
    if (upperVal.startsWith('CG')) {
      setUserType('caregiver');
    } else if (upperVal.startsWith('MP')) {
      setUserType('medical_practitioner');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!accessId.trim() || !email.trim() || !password) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);
    const result = await healthWorkerLogin(accessId, email, password);

    if (result.success) {
      await ensureUserProfile(result.user, result.role);
      navigate(result.redirectTo || '/');
    } else {
      setError(result.error || 'Authentication failure.');
    }
    setLoading(false);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Abort Button */}
      <button 
        onClick={() => navigate('/')} 
        className="absolute top-6 left-6 flex items-center gap-2 p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all group z-50 cursor-pointer"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-widest">Abort</span>
      </button>

      {/* High-Fidelity Terminal Container */}
      <div className="max-w-lg w-full bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[48px] p-10 md:p-12 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500 shadow-[0_0_50px_-12px_rgba(14,165,233,0.1)]">
        
        {/* Branding */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20 mb-4">
             <Heart size={32} fill="white" className="text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">
            Bantayan<span className="text-sky-500">Care</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Authorization Node</p>
        </div>

        {/* Role Switcher */}
        <div className="flex p-1 bg-slate-950/50 rounded-2xl border border-white/5 mb-8">
          <button 
            type="button" 
            onClick={() => setUserType('medical_practitioner')} 
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              userType === 'medical_practitioner' 
                ? 'bg-sky-500 !text-slate-950 shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Stethoscope size={12} /> Practitioner
          </button>
          <button 
            type="button" 
            onClick={() => setUserType('caregiver')} 
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              userType === 'caregiver' 
                ? 'bg-sky-500 !text-slate-950 shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User size={12} /> Caregiver
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-xs font-bold uppercase">
             <Activity size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Access ID */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-500/70 ml-1">Unique Access ID</label>
            <div className="relative group">
              <Fingerprint size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
              <input 
                required
                value={accessId}
                onChange={(e) => handleAccessIdChange(e.target.value)}
                placeholder="e.g. CG-0001"
                className="w-full bg-slate-950/60 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-base text-white placeholder-slate-600 outline-none focus:border-sky-500/50 transition-all font-mono"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-500/70 ml-1">Network Email</label>
            <div className="relative group">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
              <input 
                type="email" required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@bantayancare.node"
                className="w-full bg-slate-950/60 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-base text-white placeholder-slate-600 outline-none focus:border-sky-500/50 transition-all"
              />
            </div>
          </div>

          {/* Password with Eye Icon */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-500/70 ml-1">Passkey</label>
            <div className="relative group">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
              <input 
                type={showPassword ? 'text' : 'password'} required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/60 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-base text-white placeholder-slate-600 outline-none focus:border-sky-500/50 transition-all"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500 transition-colors cursor-pointer"
              >
                {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full py-4.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 !text-slate-950 font-black uppercase text-xs tracking-[0.3em] rounded-2xl transition-all shadow-lg shadow-sky-500/20 active:scale-95 flex items-center justify-center gap-2 mt-8 cursor-pointer"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <><ShieldCheck size={16} /> Initialize Session</>}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <Link to="/register" className="inline-flex items-center gap-2 text-[10px] font-black text-sky-400 hover:text-white uppercase tracking-[0.2em] transition-all">
            <UserPlus size={14} />
            Initialize account with Access Key
          </Link>
        </div>

        {/* System Footer Metadata */}
        <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between opacity-60 text-slate-400">
           <div className="flex items-center gap-2">
              <ShieldCheck size={12} className="text-sky-500" />
              <span className="text-[8px] font-black uppercase tracking-widest">ID Verified</span>
           </div>
           <div className="flex items-center gap-2">
              <Activity size={12} className="text-sky-500" />
              <span className="text-[8px] font-black uppercase tracking-widest">Real-time Node</span>
           </div>
           <div className="flex items-center gap-2">
              <Lock size={12} className="text-sky-500" />
              <span className="text-[8px] font-black uppercase tracking-widest">Encrypted</span>
           </div>
        </div>
      </div>

      {/* ── ROOT LEVEL METADATA & ADMIN GATEWAY ── */}
      <div className="mt-12 flex flex-col items-center gap-4 opacity-60 hover:opacity-100 transition-opacity duration-500 pb-10">
        
        {/* The Subtle Governance Link */}
        <Link 
          to="/governance" 
          className="flex items-center gap-2 px-4 py-2 bg-slate-950/20 border border-white/10 hover:border-sky-500/30 rounded-full transition-all group"
        >
          <Shield size={12} className="text-slate-400 group-hover:text-sky-500" />
          <span className="text-[9px] font-black text-slate-400 group-hover:text-white uppercase tracking-[0.3em]">
            Access Governance Node
          </span>
        </Link>

        {/* Environment Info */}
        <div className="text-center space-y-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
            © Secured Connection — Barangay Bantayan Network
          </p>
          <p className="text-[8px] font-mono text-slate-500 uppercase">
            Encrypted Node: DUMAGUETE-X01
          </p>
        </div>
      </div>
    </div>
  );
};

export default HealthWorkerLoginPage;
