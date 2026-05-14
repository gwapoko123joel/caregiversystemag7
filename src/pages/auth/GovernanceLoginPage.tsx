import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Lock, Mail, ArrowRight, AlertTriangle,
  Fingerprint, KeyRound, ServerCrash,
  Loader2, ChevronRight, ShieldAlert, ShieldCheck,
} from 'lucide-react';
import {
  AuthBackground, AuthInput,
  AuthError, AuthNodeFooter,
} from '../../components/auth/AuthComponents';
import { adminGovernanceLogin, getCurrentSession } from '../../services/authService';
import { ensureUserProfile } from '../../services/profileService';

const GovernanceLoginPage = () => {
  const navigate = useNavigate();

  // Multi-step state
  const [step, setStep] = useState(1); // Step 1: Access ID → Step 2: Credentials
  const [accessId, setAccessId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const session = await getCurrentSession();
      if (session && session.role === 'admin') {
        navigate('/dashboard/admin');
      }
      setCheckingSession(false);
    };
    checkSession();
  }, [navigate]);

  // Lock out after 5 failed attempts
  const isLockedOut = failedAttempts >= 5;

  const handleStepOne = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!accessId.trim()) {
      setError('Admin Access ID is required to proceed.');
      return;
    }

    // Basic format validation
    const idPattern = /^ADMIN-\d{3,4}$/i;
    if (!idPattern.test(accessId.trim().toUpperCase())) {
      setError('Invalid Access ID format. Expected: ADMIN-XXXX');
      setFailedAttempts((prev) => prev + 1);
      return;
    }

    setStep(2);
  };

  const handleStepTwo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLockedOut) {
      setError('Too many failed attempts. This terminal is locked. Contact super admin.');
      return;
    }

    if (!email.trim()) {
      setError('Administrative email is required.');
      return;
    }

    if (!password) {
      setError('Security passphrase is required.');
      return;
    }

    setLoading(true);

    const result = await adminGovernanceLogin(accessId, email, password);

    if (result.success) {
      // Ensure admin profile is created/updated
      if (result.user) {
        await ensureUserProfile(result.user, 'admin');
      }

      // Navigate to admin dashboard
      navigate('/dashboard/admin');
    } else {
      setError(result.error || 'Authentication failure.');
      setFailedAttempts((prev) => prev + 1);
    }

    setLoading(false);
  };

  const handleBackToStepOne = () => {
    setStep(1);
    setEmail('');
    setPassword('');
    setError('');
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-slate-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <AuthBackground variant="governance" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* ===== GOVERNANCE LOGIN CARD ===== */}
        <div className="rounded-[32px] border border-white/5 bg-slate-900/40 
                        backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden transition-all">

          {/* Top accent — Amber/Red for warning */}
          <div className="h-1 bg-gradient-to-r from-amber-500 via-red-500 to-amber-500" />

          <div className="p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-4">
              {/* Shield Icon */}
              <div className="flex justify-center">
                <motion.div
                  animate={{ 
                    boxShadow: [
                      '0 0 0 0 rgba(245, 158, 11, 0)',
                      '0 0 0 8px rgba(245, 158, 11, 0.1)',
                      '0 0 0 0 rgba(245, 158, 11, 0)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 
                             border border-amber-500/30 flex items-center justify-center"
                >
                  <Shield className="w-8 h-8 text-amber-400" />
                </motion.div>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-black text-white uppercase tracking-tight">
                  System Governance
                </h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
                  Bantayan Administrative Node — Secure Access
                </p>
              </div>

              {/* Warning Banner */}
              <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg 
                              border border-amber-500/20 bg-amber-500/5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] tracking-wider text-amber-400/80 uppercase font-semibold">
                  Authorized Personnel Only
                </span>
              </div>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-3">
              <div className={`flex items-center gap-1.5 text-[10px] tracking-wider uppercase font-semibold
                              ${step >= 1 ? 'text-amber-400' : 'text-slate-600'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
                                ${step >= 1 
                                  ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400' 
                                  : 'bg-slate-800 border border-slate-700 text-slate-500'}`}>
                  {step > 1 ? <ShieldCheck className="w-3 h-3" /> : '1'}
                </div>
                Verify ID
              </div>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <div className={`flex items-center gap-1.5 text-[10px] tracking-wider uppercase font-semibold
                              ${step >= 2 ? 'text-amber-400' : 'text-slate-600'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
                                ${step >= 2 
                                  ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400' 
                                  : 'bg-slate-800 border border-slate-700 text-slate-500'}`}>
                  2
                </div>
                Authenticate
              </div>
            </div>

            {/* Lockout Warning */}
            {isLockedOut && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 p-4 rounded-xl border border-red-500/40 
                           bg-red-500/10"
              >
                <ServerCrash className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm font-bold text-red-400">Terminal Locked</p>
                  <p className="text-[11px] text-red-300/70">
                    Too many failed attempts. Contact super admin to unlock.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Failed Attempts Counter */}
            {failedAttempts > 0 && !isLockedOut && (
              <div className="flex items-center justify-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[10px] tracking-wider text-red-400/70 uppercase">
                  Failed Attempts: {failedAttempts}/5
                </span>
              </div>
            )}

            {/* Error Display */}
            <AuthError message={error} onDismiss={() => setError('')} />

            {/* ===== STEP 1: ACCESS ID VERIFICATION ===== */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleStepOne}
                  className="space-y-5"
                >
                  <AuthInput
                    icon={<Fingerprint className="w-3.5 h-3.5 text-amber-400" />}
                    label="Admin Access ID"
                    type="text"
                    value={accessId}
                    onChange={(e) => setAccessId(e.target.value.toUpperCase())}
                    placeholder="ADMIN-XXXX"
                    disabled={loading || isLockedOut}
                    autoComplete="off"
                  />

                  <p className="text-[10px] text-slate-500 text-center">
                    Enter your assigned governance Access ID to proceed to authentication.
                  </p>

                  <button
                    type="submit"
                    disabled={loading || isLockedOut}
                    className="w-full py-3.5 rounded-xl text-white text-sm font-bold 
                               tracking-wider uppercase shadow-lg transition-all duration-300 
                               disabled:opacity-60 disabled:cursor-not-allowed
                               flex items-center justify-center gap-2
                               bg-gradient-to-r from-slate-600 to-slate-700 
                               hover:from-amber-600/80 hover:to-amber-700/80
                               shadow-slate-500/10 hover:shadow-amber-500/20"
                  >
                    <KeyRound className="w-4 h-4" />
                    Verify Access ID
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.form>
              )}

              {/* ===== STEP 2: EMAIL + PASSWORD ===== */}
              {step === 2 && (
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleStepTwo}
                  className="space-y-5"
                >
                  {/* Show verified Access ID */}
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-500/30 
                                  bg-emerald-500/5">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <div className="flex-1">
                      <p className="text-[10px] tracking-wider text-emerald-400/70 uppercase">
                        Access ID Verified
                      </p>
                      <p className="text-sm font-bold text-emerald-300 tracking-wider">
                        {accessId}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleBackToStepOne}
                      className="text-[10px] text-slate-400 hover:text-amber-400 
                                 tracking-wider uppercase transition-colors"
                    >
                      Change
                    </button>
                  </div>

                  <AuthInput
                    icon={<Mail className="w-3.5 h-3.5 text-amber-400" />}
                    label="Administrative Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your admin email"
                    disabled={loading || isLockedOut}
                    autoComplete="email"
                  />

                  <AuthInput
                    icon={<Lock className="w-3.5 h-3.5 text-amber-400" />}
                    label="Security Passphrase"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your security passphrase"
                    disabled={loading || isLockedOut}
                    autoComplete="current-password"
                    showPasswordToggle
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                  />

                  <button
                    type="submit"
                    disabled={loading || isLockedOut}
                    className="w-full py-3.5 rounded-xl text-white text-sm font-bold 
                               tracking-wider uppercase shadow-lg transition-all duration-300 
                               disabled:opacity-60 disabled:cursor-not-allowed
                               flex items-center justify-center gap-2
                               bg-gradient-to-r from-slate-600 to-slate-700 
                               hover:from-amber-600/80 hover:to-amber-700/80
                               shadow-slate-500/10 hover:shadow-amber-500/20"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Authenticating Governance Node...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Authenticate
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Back button */}
                  <button
                    type="button"
                    onClick={handleBackToStepOne}
                    className="w-full text-center text-[11px] text-slate-500 
                               hover:text-amber-400 transition-colors tracking-wider uppercase"
                  >
                    ← Back to Access ID Verification
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Security Bar */}
          <div className="border-t border-slate-700/50 bg-slate-900/50 px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[9px] tracking-wider text-slate-500 uppercase">
                <Shield className="w-3 h-3" />
                Multi-Step Auth
              </div>
              <div className="flex items-center gap-1.5 text-[9px] tracking-wider text-slate-500 uppercase">
                <Fingerprint className="w-3 h-3" />
                ID Verified
              </div>
              <div className="flex items-center gap-1.5 text-[9px] tracking-wider text-slate-500 uppercase">
                <Lock className="w-3 h-3" />
                Audit Logged
              </div>
            </div>
          </div>
        </div>

        {/* Node Footer */}
        <div className="mt-6">
          <AuthNodeFooter variant="governance" />
        </div>
      </motion.div>
    </div>
  );
};

export default GovernanceLoginPage;
