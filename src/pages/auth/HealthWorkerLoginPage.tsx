import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, ArrowRight, Stethoscope, Heart,
  Shield, Activity, Radio, Fingerprint, ArrowLeft,
  Info, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2
} from 'lucide-react';
import {
  AuthBackground, BantayanLogo, AuthNodeFooter,
} from '../../components/auth/AuthComponents';
import { healthWorkerLogin, getCurrentSession } from '../../services/authService';
import { ensureUserProfile } from '../../services/profileService';

// Sub-component: RoleChip
const RoleChip = ({ icon: Icon, label, active }: { icon: any, label: string, active: boolean }) => (
  <motion.div
    initial={false}
    animate={{
      borderColor: active ? 'rgba(0, 209, 255, 0.6)' : 'rgba(0, 209, 255, 0.15)',
      backgroundColor: active ? 'rgba(0, 209, 255, 0.1)' : 'transparent',
      boxShadow: active ? '0 0 15px rgba(0, 209, 255, 0.1)' : 'none',
    }}
    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] tracking-wider uppercase transition-colors
      ${active ? 'text-cyan-400' : 'text-slate-500'}`}
  >
    <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
    {label}
  </motion.div>
);

// Sub-component: FooterBadge
const FooterBadge = ({ icon: Icon, label }: { icon: any, label: string }) => (
  <div className="flex items-center gap-1.5 text-[9px] tracking-wider text-slate-500 uppercase">
    <Icon className="w-3 h-3" strokeWidth={1.5} />
    {label}
  </div>
);

const HealthWorkerLoginPage = () => {
  const navigate = useNavigate();
  const [accessId, setAccessId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const [isHintExpanded, setIsHintExpanded] = useState(false);

  // Live Role Detection
  const isCaregiver = accessId.toUpperCase().startsWith('CG');
  const isPractitioner = accessId.toUpperCase().startsWith('MP');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!accessId.trim()) {
      setError('Please enter your Access ID.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    const idPattern = /^(CG|MP|ADMIN)-\d{3,4}$/i;
    if (!idPattern.test(accessId.trim().toUpperCase())) {
      setError('Invalid Access ID format. Expected: CG-XXXX or MP-XXXX');
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
      <div className="min-h-screen bg-[#000814] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#000814] overflow-hidden">
      <AuthBackground variant="default" />

      {/* TOP HEADER: BACK BUTTON & NODE STATUS */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <button
          onClick={() => navigate('/')}
          style={{ minHeight: '44px' }}
          className="group flex items-center gap-2 px-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl
                     text-[11px] tracking-wider text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
        >
          <motion.div
            animate={{ x: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="group-hover:mr-1 transition-all"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          </motion.div>
          <span className="hidden sm:inline">BACK</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
          <span className="text-[9px] tracking-[0.2em] text-emerald-400 uppercase font-light">
            Node Connected — Encrypted Channel
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* ===== MAIN LOGIN CARD ===== */}
        <div className="rounded-[2.5rem] border border-white/10 bg-[#000814]/80 backdrop-blur-xl shadow-2xl shadow-black/80 overflow-hidden">
          
          <div className="p-8 space-y-5">
            {/* Logo & Title */}
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <BantayanLogo size="small" /> {/* Logo should be 44px equivalent via size prop or style */}
                <div style={{ height: '44px' }} /> {/* Spacer to ensure logo area is compact */}
              </div>

              <div className="space-y-1">
                <h1 className="text-lg font-light tracking-[0.2em] text-white uppercase">
                  Health Worker Portal
                </h1>
                <p className="text-[10px] tracking-widest text-slate-500 uppercase font-light">
                  Barangay Bantayan Care Network
                </p>
              </div>

              {/* Role Indicators: Live Detection */}
              <div className="flex items-center justify-center gap-3 pt-1">
                <RoleChip icon={Stethoscope} label="Practitioner" active={isPractitioner} />
                <RoleChip icon={Heart} label="Caregiver" active={isCaregiver} />
              </div>
            </div>

            {/* Error Display: Animated Banner */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -20, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl text-red-400 text-[11px] font-light">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                    <p className="flex-1">{error}</p>
                    <button onClick={() => setError('')} className="hover:text-white transition-colors">
                      <ArrowRight className="w-4 h-4 rotate-45" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ACCESS ID */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] tracking-[0.2em] text-slate-400 uppercase font-light flex items-center gap-2">
                    <Fingerprint className="w-3.5 h-3.5 text-cyan-500" strokeWidth={1.5} />
                    Access ID
                  </label>
                  <button 
                    type="button"
                    onClick={() => setIsHintExpanded(!isHintExpanded)}
                    className="p-1 hover:text-cyan-400 text-slate-500 transition-colors"
                  >
                    <Info className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>
                
                <div className="relative group">
                  <input
                    type="text"
                    value={accessId}
                    onChange={(e) => setAccessId(e.target.value.toUpperCase())}
                    placeholder="CG-0001 or MP-0001"
                    disabled={loading}
                    autoComplete="off"
                    style={{ minHeight: '44px' }}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600
                               focus:outline-none focus:border-cyan-500/60 focus:bg-cyan-500/[0.02] transition-all font-light"
                  />
                </div>

                <AnimatePresence>
                  {isHintExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 mt-1 rounded-lg border border-cyan-500/10 bg-cyan-500/5 text-[10px] text-slate-400 font-light leading-relaxed">
                        <Shield className="w-3 h-3 text-cyan-500/50 inline mr-2 mb-0.5" strokeWidth={1.5} />
                        Your Access ID was assigned by the system administrator during enrollment. 
                        Format: <span className="text-cyan-400">CG-XXXX</span> for Caregivers, 
                        <span className="text-cyan-400"> MP-XXXX</span> for Practitioners.
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* EMAIL ADDRESS */}
              <div className="space-y-1.5">
                <label className="px-1 text-[10px] tracking-[0.2em] text-slate-400 uppercase font-light flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-cyan-500" strokeWidth={1.5} />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  disabled={loading}
                  autoComplete="email"
                  style={{ minHeight: '44px' }}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600
                             focus:outline-none focus:border-cyan-500/60 focus:bg-cyan-500/[0.02] transition-all font-light"
                />
              </div>

              {/* PASSWORD */}
              <div className="space-y-1.5">
                <label className="px-1 text-[10px] tracking-[0.2em] text-slate-400 uppercase font-light flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-cyan-500" strokeWidth={1.5} />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={loading}
                    autoComplete="current-password"
                    style={{ minHeight: '44px' }}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600
                               focus:outline-none focus:border-cyan-500/60 focus:bg-cyan-500/[0.02] transition-all font-light pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:text-cyan-400 text-slate-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ minHeight: '44px' }}
                className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 p-[1px] transition-all hover:shadow-[0_0_20px_rgba(0,209,255,0.3)] disabled:opacity-50"
              >
                <div className="w-full h-full bg-[#000814] rounded-[11px] flex items-center justify-center gap-3 text-[11px] tracking-[0.2em] text-white uppercase font-normal group-hover:bg-transparent transition-all">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In to Portal
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Support Text */}
            <div className="text-center py-2">
              <p className="text-[10px] text-slate-600 font-light tracking-wide">
                Secure node-to-node encryption active.
              </p>
            </div>
          </div>

          {/* Bottom Features Strip */}
          <div className="border-t border-white/5 bg-white/[0.02] px-8 py-3.5">
            <div className="flex items-center justify-between">
              <FooterBadge icon={CheckCircle2} label="ID Verified" />
              <div className="w-px h-3 bg-white/10" />
              <FooterBadge icon={Activity} label="Real-Time" />
              <div className="w-px h-3 bg-white/10" />
              <FooterBadge icon={Radio} label="Encrypted" />
            </div>
          </div>
        </div>

        {/* System Node Footer */}
        <div className="mt-8 opacity-40 hover:opacity-100 transition-opacity">
          <AuthNodeFooter variant="default" />
        </div>
      </motion.div>
    </div>
  );
};

export default HealthWorkerLoginPage;

