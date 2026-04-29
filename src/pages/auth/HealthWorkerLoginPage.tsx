import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail, Lock, ArrowRight, Stethoscope, Heart,
  Shield, Activity, Radio, Fingerprint,
} from 'lucide-react';
import {
  AuthBackground, BantayanLogo, AuthInput,
  AuthButton, AuthError, AuthNodeFooter,
} from '../../components/auth/AuthComponents';
import { healthWorkerLogin, getCurrentSession } from '../../services/authService';
import { ensureUserProfile } from '../../services/profileService';

const HealthWorkerLoginPage = () => {
  const navigate = useNavigate();
  const [accessId, setAccessId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);

  // Check if already logged in
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

    // Validation
    if (!accessId.trim()) {
      setError('Please enter your Access ID (e.g., CG-0001 or MP-0001).');
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

    // Basic Access ID format check
    const idPattern = /^(CG|MP|ADMIN)-\d{3,4}$/i;
    if (!idPattern.test(accessId.trim().toUpperCase())) {
      setError('Invalid Access ID format. Expected: CG-XXXX or MP-XXXX');
      return;
    }

    setLoading(true);

    const result = await healthWorkerLogin(accessId, email, password);

    if (result.success) {
      // Ensure profile is created/updated
      await ensureUserProfile(result.user, result.role);

      // Redirect based on role
      navigate(result.redirectTo);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <AuthBackground variant="default" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* ===== MAIN LOGIN CARD ===== */}
        <div className="rounded-3xl border border-slate-700/50 bg-slate-900/70 
                        backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden">

          {/* Top accent line */}
          <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

          <div className="p-8 space-y-7">
            {/* Logo & Title */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <BantayanLogo size="large" />
              </div>

              <div className="space-y-2">
                <h1 className="text-xl font-black tracking-tight text-white">
                  Health Worker Portal
                </h1>
                <p className="text-xs tracking-[0.2em] text-slate-400 uppercase">
                  Barangay Bantayan Care Network
                </p>
              </div>

              {/* Role Indicators */}
              <div className="flex items-center justify-center gap-4 pt-1">
                <div className="flex items-center gap-1.5 text-[10px] tracking-wider text-cyan-400/70 uppercase">
                  <Stethoscope className="w-3 h-3" />
                  Practitioner
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-600" />
                <div className="flex items-center gap-1.5 text-[10px] tracking-wider text-cyan-400/70 uppercase">
                  <Heart className="w-3 h-3" />
                  Caregiver
                </div>
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse" />
              <span className="text-[10px] tracking-[0.2em] text-emerald-400/70 uppercase font-medium">
                Node Connected — Encrypted Channel
              </span>
            </div>

            {/* Error Display */}
            <AuthError message={error} onDismiss={() => setError('')} />

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* ACCESS ID — NEW FIELD */}
              <AuthInput
                icon={<Fingerprint className="w-3.5 h-3.5 text-cyan-500" />}
                label="Access ID"
                type="text"
                value={accessId}
                onChange={(e: any) => setAccessId(e.target.value.toUpperCase())}
                placeholder="CG-0001 or MP-0001"
                disabled={loading}
                autoComplete="off"
              />

              {/* Access ID Help Text */}
              <div className="flex items-start gap-2 px-1 -mt-3">
                <Shield className="w-3 h-3 text-slate-500 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Your Access ID was assigned by the system administrator during enrollment. 
                  Format: <span className="text-cyan-400/60 font-mono">CG-XXXX</span> for Caregivers, 
                  <span className="text-cyan-400/60 font-mono"> MP-XXXX</span> for Practitioners.
                </p>
              </div>

              {/* Subtle divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-700/50" />
                <span className="text-[9px] tracking-[0.3em] text-slate-600 uppercase">
                  Credentials
                </span>
                <div className="flex-1 h-px bg-slate-700/50" />
              </div>

              <AuthInput
                icon={<Mail className="w-3.5 h-3.5 text-cyan-500" />}
                label="Email Address"
                type="email"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                disabled={loading}
                autoComplete="email"
              />

              <AuthInput
                icon={<Lock className="w-3.5 h-3.5 text-cyan-500" />}
                label="Password"
                type="password"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
                autoComplete="current-password"
                showPasswordToggle
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
              />

              <AuthButton loading={loading}>
                Sign In to Portal
                <ArrowRight className="w-4 h-4" />
              </AuthButton>
            </form>

            {/* Info Text */}
            <div className="text-center space-y-1.5">
              <p className="text-[11px] text-slate-500">
                Your role is automatically detected from your Access ID.
              </p>
              <p className="text-[11px] text-slate-500">
                Contact your administrator if you don't have an Access ID.
              </p>
            </div>
          </div>

          {/* Bottom Features Bar */}
          <div className="border-t border-slate-700/50 bg-slate-900/40 px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[9px] tracking-wider text-slate-500 uppercase">
                <Fingerprint className="w-3 h-3" />
                ID Verified
              </div>
              <div className="flex items-center gap-1.5 text-[9px] tracking-wider text-slate-500 uppercase">
                <Activity className="w-3 h-3" />
                Real-Time Sync
              </div>
              <div className="flex items-center gap-1.5 text-[9px] tracking-wider text-slate-500 uppercase">
                <Radio className="w-3 h-3" />
                Encrypted
              </div>
            </div>
          </div>
        </div>

        {/* Node Footer */}
        <div className="mt-6">
          <AuthNodeFooter variant="default" />
        </div>

        {/* Back to Landing */}
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-[11px] tracking-wider text-slate-500 hover:text-cyan-400 
                       transition-colors uppercase"
          >
            ← Back to BantayanCare
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default HealthWorkerLoginPage;
