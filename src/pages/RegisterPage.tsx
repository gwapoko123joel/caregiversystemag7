import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Mail, Lock, KeyRound, Eye, EyeOff, User,
  AlertCircle, Loader2, ShieldCheck, CheckCircle2,
  ArrowRight, Heart, Stethoscope, UserCheck, ArrowLeft
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type ActiveTab = 'caregiver' | 'medical_practitioner'
type CaregiverStep = 1 | 2

interface CaregiverVerifiedInfo {
  id: string
  unique_access_id: string
  first_name: string | null
  last_name: string | null
  email: string | null
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function generateMPAccessId(): string {
  // Generates MP-XXXX where XXXX is a random 4-digit number
  const num = Math.floor(1000 + Math.random() * 9000)
  return `MP-${num}`
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<ActiveTab>('caregiver')

  // ── Caregiver State ──
  const [cgStep, setCgStep] = useState<CaregiverStep>(1)
  const [cgAccessId, setCgAccessId] = useState('')
  const [cgVerifiedInfo, setCgVerifiedInfo] = useState<CaregiverVerifiedInfo | null>(null)
  const [cgFirstName, setCgFirstName] = useState('')
  const [cgLastName, setCgLastName] = useState('')
  const [cgEmail, setCgEmail] = useState('')
  const [cgBhwId, setCgBhwId] = useState('')
  const [cgPassword, setCgPassword] = useState('')
  const [cgConfirmPassword, setCgConfirmPassword] = useState('')
  const [cgShowPassword, setCgShowPassword] = useState(false)
  const [cgShowConfirm, setCgShowConfirm] = useState(false)
  const [cgVerifying, setCgVerifying] = useState(false)
  const [cgSubmitting, setCgSubmitting] = useState(false)
  const [cgError, setCgError] = useState<string | null>(null)
  const [cgSuccess, setCgSuccess] = useState(false)

  // ── Practitioner State ──
  const [mpStep, setMpStep] = useState<CaregiverStep>(1)
  const [mpAccessId, setMpAccessId] = useState('')
  const [mpVerifiedInfo, setMpVerifiedInfo] = useState<CaregiverVerifiedInfo | null>(null)
  const [mpFirstName, setMpFirstName] = useState('')
  const [mpLastName, setMpLastName] = useState('')
  const [mpEmail, setMpEmail] = useState('')
  const [mpPrcLicense, setMpPrcLicense] = useState('')
  const [mpPassword, setMpPassword] = useState('')
  const [mpConfirmPassword, setMpConfirmPassword] = useState('')
  const [mpShowPassword, setMpShowPassword] = useState(false)
  const [mpShowConfirm, setMpShowConfirm] = useState(false)
  const [mpVerifying, setMpVerifying] = useState(false)
  const [mpSubmitting, setMpSubmitting] = useState(false)
  const [mpError, setMpError] = useState<string | null>(null)
  const [mpSuccess, setMpSuccess] = useState(false)
  const [mpGeneratedId, setMpGeneratedId] = useState('')

  // ─────────────────────────────────────────────
  // CAREGIVER: STEP 1 — Verify Access ID
  // ─────────────────────────────────────────────
  async function handleCaregiverVerify(e: FormEvent) {
    e.preventDefault()
    setCgError(null)

    const trimmedId = cgAccessId.trim().toUpperCase()
    if (!trimmedId) {
      setCgError('Please enter your Access ID.')
      return
    }

    setCgVerifying(true)
    try {
      const { data, error } = await supabase
        .from('caregivers')
        .select('id, unique_access_id, role, is_active, email, first_name, last_name')
        .eq('unique_access_id', trimmedId)
        .maybeSingle()

      if (error) {
        setCgError('Verification failed. Please try again.')
        return
      }

      if (!data) {
        setCgError('Access ID not found. Please check with your administrator.')
        return
      }

      if (data.role !== 'caregiver') {
        setCgError('This Access ID is not assigned to a Caregiver account.')
        return
      }

      if (data.email) {
        // Email already set means this ID has been registered
        setCgError('This Access ID is already registered. Please sign in instead.')
        return
      }

      // ✅ Valid — move to Step 2
      setCgVerifiedInfo(data)
      // Pre-fill name if admin already entered it
      if (data.first_name) setCgFirstName(data.first_name)
      if (data.last_name) setCgLastName(data.last_name)
      setCgStep(2)

    } finally {
      setCgVerifying(false)
    }
  }

  // ─────────────────────────────────────────────
  // CAREGIVER: STEP 2 — Complete Registration
  // ─────────────────────────────────────────────
  async function handleCaregiverRegister(e: FormEvent) {
    e.preventDefault()
    setCgError(null)

    if (!cgFirstName.trim() || !cgLastName.trim()) {
      setCgError('First and last name are required.')
      return
    }
    if (!cgEmail.trim()) {
      setCgError('Email address is required.')
      return
    }
    if (cgPassword.length < 8) {
      setCgError('Password must be at least 8 characters.')
      return
    }
    if (cgPassword !== cgConfirmPassword) {
      setCgError('Passwords do not match.')
      return
    }
    if (!cgVerifiedInfo) {
      setCgError('Session expired. Please verify your Access ID again.')
      setCgStep(1)
      return
    }

    setCgSubmitting(true)
    try {
      // Step A: Create Supabase auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cgEmail.trim().toLowerCase(),
        password: cgPassword,
        options: {
          data: {
            full_name: `${cgFirstName.trim()} ${cgLastName.trim()}`,
            role: 'caregiver',
            access_id: cgVerifiedInfo.unique_access_id,
          }
        }
      })

      if (authError) {
        console.error('[Register] STEP A AUTH FAILED:', JSON.stringify(authError))
        setCgError(`Step A failed: ${authError.message}`)
        return
      }

      if (!authData.user) {
        setCgError('Registration failed. Please try again.')
        return
      }

      console.log('[Register] Step A auth succeeded, UID:', authData.user.id)
      console.log('[Register] Waiting for session propagation...')

      // Delay to allow the auth session to propagate before hitting RLS policies
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step B: Update the provisioned row with the real Auth UID and profile details
      const { error: updateError } = await supabase
        .from('caregivers')
        .update({
          id: authData.user.id,           // Overwrite temporary UUID with real Auth UID
          email: cgEmail.trim().toLowerCase(),
          first_name: cgFirstName.trim(),
          last_name: cgLastName.trim(),
          bhw_id: cgBhwId.trim(),
          is_active: false,
          status: 'pending'               // Wait for final admin authorization
        })
        .eq('unique_access_id', cgVerifiedInfo.unique_access_id)

      if (updateError) {
        console.error('[Register] STEP B UPDATE FAILED:', JSON.stringify(updateError))
        await supabase.auth.signOut()
        setCgError(`Step B failed: ${updateError.message} (code: ${updateError.code})`)
        return
      }

      console.log('[Register] Step B update succeeded')

      // Step C: Log the registration
      await supabase.from('activity_logs').insert({
        user_id: authData.user.id,
        user_type: 'caregiver',
        action: 'REGISTER',
        details: {
          access_id: cgVerifiedInfo.unique_access_id,
          method: 'invite_code'
        }
      })

      setCgSuccess(true)

    } catch (err: any) {
      console.error('[Register] Unexpected error:', err)
      setCgError(`Unexpected error: ${err.message}`)
    } finally {
      setCgSubmitting(false)
    }
  }

  // ─────────────────────────────────────────────
  // PRACTITIONER: STEP 1 — Verify Access ID
  // ─────────────────────────────────────────────
  async function handlePractitionerVerify(e: FormEvent) {
    e.preventDefault()
    setMpError(null)

    const trimmedId = mpAccessId.trim().toUpperCase()
    if (!trimmedId) {
      setMpError('Please enter your Access ID.')
      return
    }

    setMpVerifying(true)
    try {
      const { data, error } = await supabase
        .from('caregivers')
        .select('id, unique_access_id, role, is_active, email, first_name, last_name')
        .eq('unique_access_id', trimmedId)
        .maybeSingle()

      if (error) {
        setMpError('Verification failed. Please try again.')
        return
      }

      if (!data) {
        setMpError('Access ID not found. Please contact your Barangay Admin.')
        return
      }

      if (data.role !== 'medical_practitioner') {
        setMpError('This Access ID is not assigned to a Practitioner account.')
        return
      }

      if (data.email) {
        setMpError('This Access ID is already registered. Please sign in instead.')
        return
      }

      // ✅ Valid — move to Step 2
      setMpVerifiedInfo(data)
      if (data.first_name) setMpFirstName(data.first_name)
      if (data.last_name) setMpLastName(data.last_name)
      setMpStep(2)

    } finally {
      setMpVerifying(false)
    }
  }

  // ─────────────────────────────────────────────
  // PRACTITIONER: STEP 2 — Complete Registration
  // ─────────────────────────────────────────────
  async function handlePractitionerRegister(e: FormEvent) {
    e.preventDefault()
    setMpError(null)

    if (!mpFirstName.trim() || !mpLastName.trim()) {
      setMpError('First and last name are required.')
      return
    }
    if (!mpEmail.trim()) {
      setMpError('Email address is required.')
      return
    }
    if (mpPassword.length < 8) {
      setMpError('Password must be at least 8 characters.')
      return
    }
    if (mpPassword !== mpConfirmPassword) {
      setMpError('Passwords do not match.')
      return
    }
    if (!mpVerifiedInfo) {
      setMpError('Session expired. Please verify your Access ID again.')
      setMpStep(1)
      return
    }

    setMpSubmitting(true)
    try {
      // Step A: Create Supabase auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: mpEmail.trim().toLowerCase(),
        password: mpPassword,
        options: {
          data: {
            full_name: `${mpFirstName.trim()} ${mpLastName.trim()}`,
            role: 'medical_practitioner',
            access_id: mpVerifiedInfo.unique_access_id,
          }
        }
      })

      if (authError) {
        setMpError(`Authentication failed: ${authError.message}`)
        return
      }

      if (!authData.user) {
        setMpError('Registration failed. Please try again.')
        return
      }

      // Delay to allow the auth session to propagate
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step B: Update the provisioned row with the real Auth UID and clinical details
      const { error: updateError } = await supabase
        .from('caregivers')
        .update({
          id: authData.user.id,
          email: mpEmail.trim().toLowerCase(),
          first_name: mpFirstName.trim(),
          last_name: mpLastName.trim(),
          prc_license: mpPrcLicense.trim(),
          is_active: false,
          status: 'pending'
        })
        .eq('unique_access_id', mpVerifiedInfo.unique_access_id)

      if (updateError) {
        await supabase.auth.signOut()
        setMpError(`Profile update failed: ${updateError.message}`)
        return
      }

      // Step C: Log the registration
      await supabase.from('activity_logs').insert({
        user_id: authData.user.id,
        user_type: 'medical_practitioner',
        action: 'REGISTER',
        details: { access_id: mpVerifiedInfo.unique_access_id }
      })

      setMpGeneratedId(mpVerifiedInfo.unique_access_id)
      setMpSuccess(true)

    } catch (err: any) {
      setMpError(`Unexpected error: ${err.message}`)
    } finally {
      setMpSubmitting(false)
    }
  }

  // ─────────────────────────────────────────────
  // SUCCESS SCREENS
  // ─────────────────────────────────────────────
  if (cgSuccess || mpSuccess) {
    const isPractitioner = mpSuccess
    const accessId = isPractitioner ? mpGeneratedId : cgVerifiedInfo?.unique_access_id

    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-lg bg-card border border-card-border rounded-3xl p-10 shadow-2xl text-center">
          <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-3xl font-light text-text-main mb-3 tracking-[0.1em] uppercase">
            Registration Submitted
          </h2>
          <p className="text-sidebar-text-muted font-light leading-relaxed mb-6">
            Your account is <strong className="text-amber-400">pending administrator approval</strong>.
            You will be able to log in once an admin authorizes your account.
          </p>
          <div className="bg-sky-500/5 border border-sky-500/20 rounded-2xl p-5 mb-8">
            <p className="text-xs text-sidebar-text-muted uppercase tracking-widest mb-2 font-light">
              Your Access ID
            </p>
            <code className="text-2xl font-mono text-sky-400 tracking-widest">
              {accessId}
            </code>
            <p className="text-xs text-sidebar-text-muted mt-3 font-light">
              ⚠️ Save this ID — you will need it every time you log in
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-sky-500 hover:bg-sky-400 text-white font-light rounded-2xl py-4 flex items-center justify-center gap-2 transition-all uppercase tracking-widest"
          >
            GO TO SIGN IN <ArrowRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4 md:p-6 font-sans relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 hover:opacity-80 transition-opacity mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-sky-600 rounded-xl flex items-center justify-center shadow-lg">
              <Heart size={20} className="text-white fill-white" />
            </div>
            <span className="text-xl font-light tracking-[0.2em] text-text-main uppercase">BantayanCare</span>
          </Link>
          <h1 className="text-2xl font-light text-text-main uppercase tracking-[0.15em] mb-2">
            Health Worker Registration
          </h1>
          <p className="text-sm text-sidebar-text-muted font-light">
            Barangay Bantayan Care Network
          </p>
        </div>

        <div className="bg-card border border-card-border rounded-3xl overflow-hidden shadow-2xl">
          {/* Tab Selector */}
          <div className="grid grid-cols-2 border-b border-card-border">
            <button
              onClick={() => { setActiveTab('caregiver'); setCgError(null) }}
              className={`py-5 flex items-center justify-center gap-2 text-xs font-light uppercase tracking-widest transition-all ${activeTab === 'caregiver'
                  ? 'bg-sky-500/10 text-sky-400 border-b-2 border-sky-500'
                  : 'text-sidebar-text-muted hover:text-text-main hover:bg-white/5'
                }`}
            >
              <UserCheck size={16} />
              Caregiver
            </button>
            <button
              onClick={() => { setActiveTab('medical_practitioner'); setMpError(null) }}
              className={`py-5 flex items-center justify-center gap-2 text-xs font-light uppercase tracking-widest transition-all ${activeTab === 'medical_practitioner'
                  ? 'bg-sky-500/10 text-sky-400 border-b-2 border-sky-500'
                  : 'text-sidebar-text-muted hover:text-text-main hover:bg-white/5'
                }`}
            >
              <Stethoscope size={16} />
              Practitioner
            </button>
          </div>

          <div className="p-8">
            {/* ══════════════════════════════════════════ */}
            {/* CAREGIVER TAB                             */}
            {/* ══════════════════════════════════════════ */}
            {activeTab === 'caregiver' && (
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-light border transition-all ${cgStep >= 1 ? 'bg-sky-500 border-sky-500 text-white' : 'border-card-border text-sidebar-text-muted'
                    }`}>
                    {cgStep > 1 ? <CheckCircle2 size={14} /> : '1'}
                  </div>
                  <div className={`flex-1 h-px transition-all ${cgStep > 1 ? 'bg-sky-500' : 'bg-card-border'}`} />
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-light border transition-all ${cgStep >= 2 ? 'bg-sky-500 border-sky-500 text-white' : 'border-card-border text-sidebar-text-muted'
                    }`}>
                    2
                  </div>
                  <div className="flex-1 text-right">
                    <span className="text-[10px] text-sidebar-text-muted uppercase tracking-widest font-light">
                      {cgStep === 1 ? 'Verify ID' : 'Complete Profile'}
                    </span>
                  </div>
                </div>

                {cgStep === 1 && (
                  <form onSubmit={handleCaregiverVerify} className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="w-14 h-14 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <KeyRound size={24} className="text-sky-400" />
                      </div>
                      <h2 className="text-lg font-light text-text-main uppercase tracking-[0.15em] mb-2">
                        Verify Your Access ID
                      </h2>
                    </div>

                    {cgError && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                        <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                        <span className="text-sm text-red-400 font-light">{cgError}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="relative group">
                        <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:text-sky-500 transition-colors" />
                        <input
                          type="text"
                          placeholder="e.g. CG-0001"
                          value={cgAccessId}
                          onChange={(e) => setCgAccessId(e.target.value.toUpperCase())}
                          className="w-full bg-primary/50 border border-card-border rounded-2xl py-4 pl-12 pr-4 text-text-main focus:outline-none focus:border-sky-500/50 transition-all font-light tracking-widest uppercase"
                          autoFocus
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={cgVerifying || !cgAccessId.trim()}
                      className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-light rounded-2xl py-4 flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-sm"
                    >
                      {cgVerifying ? <Loader2 size={18} className="animate-spin" /> : 'Verify Access ID'}
                    </button>
                  </form>
                )}

                {cgStep === 2 && cgVerifiedInfo && (
                  <form onSubmit={handleCaregiverRegister} className="space-y-5">
                    <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                      <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                      <div className="flex-1">
                        <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-light">Access ID Verified</p>
                        <code className="text-sm text-emerald-300 font-mono tracking-widest">
                          {cgVerifiedInfo.unique_access_id}
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setCgStep(1); setCgVerifiedInfo(null); setCgError(null) }}
                        className="text-[10px] text-sidebar-text-muted hover:text-sky-400 uppercase tracking-widest font-light transition-colors"
                      >
                        Change
                      </button>
                    </div>

                    {cgError && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                        <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                        <span className="text-sm text-red-400 font-light">{cgError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest ml-1">First Name</label>
                        <div className="relative group">
                          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:text-sky-500 transition-colors" />
                          <input type="text" value={cgFirstName} onChange={(e) => setCgFirstName(e.target.value)} className="w-full bg-primary/50 border border-card-border rounded-2xl py-3.5 pl-10 pr-3 text-text-main focus:outline-none focus:border-sky-500/50 transition-all font-light text-sm" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest ml-1">Last Name</label>
                        <div className="relative group">
                          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:text-sky-500 transition-colors" />
                          <input type="text" value={cgLastName} onChange={(e) => setCgLastName(e.target.value)} className="w-full bg-primary/50 border border-card-border rounded-2xl py-3.5 pl-10 pr-3 text-text-main focus:outline-none focus:border-sky-500/50 transition-all font-light text-sm" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest ml-1">Email Address</label>
                      <div className="relative group">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:text-sky-500 transition-colors" />
                        <input type="email" value={cgEmail} onChange={(e) => setCgEmail(e.target.value)} className="w-full bg-primary/50 border border-card-border rounded-2xl py-3.5 pl-10 pr-3 text-text-main focus:outline-none focus:border-sky-500/50 transition-all font-light text-sm" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest ml-1">BHW ID Number (For Verification)</label>
                      <div className="relative group">
                        <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:text-sky-500 transition-colors" />
                        <input type="text" placeholder="e.g. BHW-2024-001" value={cgBhwId} onChange={(e) => setCgBhwId(e.target.value)} className="w-full bg-primary/50 border border-card-border rounded-2xl py-3.5 pl-10 pr-3 text-text-main focus:outline-none focus:border-sky-500/50 transition-all font-light text-sm" required />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest ml-1">Password</label>
                        <div className="relative group">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:text-sky-500 transition-colors" />
                          <input type={cgShowPassword ? 'text' : 'password'} value={cgPassword} onChange={(e) => setCgPassword(e.target.value)} className="w-full bg-primary/50 border border-card-border rounded-2xl py-3.5 pl-10 pr-10 text-text-main focus:outline-none focus:border-sky-500/50 transition-all font-light text-sm" />
                          <button type="button" onClick={() => setCgShowPassword(!cgShowPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sidebar-text-muted hover:text-text-main transition-colors">
                            {cgShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest ml-1">Confirm</label>
                        <div className="relative group">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:text-sky-500 transition-colors" />
                          <input type={cgShowConfirm ? 'text' : 'password'} value={cgConfirmPassword} onChange={(e) => setCgConfirmPassword(e.target.value)} className="w-full bg-primary/50 border border-card-border rounded-2xl py-3.5 pl-10 pr-10 text-text-main focus:outline-none focus:border-sky-500/50 transition-all font-light text-sm" />
                          <button type="button" onClick={() => setCgShowConfirm(!cgShowConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sidebar-text-muted hover:text-text-main transition-colors">
                            {cgShowConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {cgPassword && (
                      <div className="flex items-center gap-2">
                        <div className={`h-1 flex-1 rounded-full transition-all ${cgPassword.length >= 8 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <div className={`h-1 flex-1 rounded-full transition-all ${cgPassword.length >= 10 ? 'bg-emerald-500' : 'bg-card-border'}`} />
                        <div className={`h-1 flex-1 rounded-full transition-all ${cgPassword.length >= 12 ? 'bg-emerald-500' : 'bg-card-border'}`} />
                        <span className="text-[10px] text-sidebar-text-muted font-light">
                          {cgPassword.length < 8 ? 'Too short' : cgPassword.length < 10 ? 'Acceptable' : cgPassword.length < 12 ? 'Good' : 'Strong'}
                        </span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={cgSubmitting}
                      className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-light rounded-2xl py-4 flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-sm mt-2"
                    >
                      {cgSubmitting ? <Loader2 size={18} className="animate-spin" /> : <>COMPLETE REGISTRATION <ArrowRight size={18} /></>}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════ */}
            {/* PRACTITIONER TAB                          */}
            {/* ══════════════════════════════════════════ */}
            {activeTab === 'medical_practitioner' && (
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-light border transition-all ${mpStep >= 1 ? 'bg-sky-500 border-sky-500 text-white' : 'border-card-border text-sidebar-text-muted'
                    }`}>
                    {mpStep > 1 ? <CheckCircle2 size={14} /> : '1'}
                  </div>
                  <div className={`flex-1 h-px transition-all ${mpStep > 1 ? 'bg-sky-500' : 'bg-card-border'}`} />
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-light border transition-all ${mpStep >= 2 ? 'bg-sky-500 border-sky-500 text-white' : 'border-card-border text-sidebar-text-muted'
                    }`}>
                    2
                  </div>
                  <div className="flex-1 text-right">
                    <span className="text-[10px] text-sidebar-text-muted uppercase tracking-widest font-light">
                      {mpStep === 1 ? 'Verify ID' : 'Clinical Profile'}
                    </span>
                  </div>
                </div>

                {mpStep === 1 && (
                  <form onSubmit={handlePractitionerVerify} className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="w-14 h-14 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <KeyRound size={24} className="text-sky-400" />
                      </div>
                      <h2 className="text-lg font-light text-text-main uppercase tracking-[0.15em] mb-2">
                        Practitioner Access
                      </h2>
                    </div>

                    {mpError && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                        <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                        <span className="text-sm text-red-400 font-light">{mpError}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="relative group">
                        <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:text-sky-500 transition-colors" />
                        <input
                          type="text"
                          placeholder="e.g. MP-1234"
                          value={mpAccessId}
                          onChange={(e) => setMpAccessId(e.target.value.toUpperCase())}
                          className="w-full bg-primary/50 border border-card-border rounded-2xl py-4 pl-12 pr-4 text-text-main focus:outline-none focus:border-sky-500/50 transition-all font-light tracking-widest uppercase"
                          autoFocus
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={mpVerifying || !mpAccessId.trim()}
                      className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-light rounded-2xl py-4 flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-sm"
                    >
                      {mpVerifying ? <Loader2 size={18} className="animate-spin" /> : 'Verify Practitioner ID'}
                    </button>
                  </form>
                )}

                {mpStep === 2 && mpVerifiedInfo && (
                  <form onSubmit={handlePractitionerRegister} className="space-y-5">
                    <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                      <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                      <div className="flex-1">
                        <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-light">Credential Verified</p>
                        <code className="text-sm text-emerald-300 font-mono tracking-widest">
                          {mpVerifiedInfo.unique_access_id}
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setMpStep(1); setMpVerifiedInfo(null); setMpError(null) }}
                        className="text-[10px] text-sidebar-text-muted hover:text-sky-400 uppercase tracking-widest font-light transition-colors"
                      >
                        Change
                      </button>
                    </div>

                    {mpError && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                        <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                        <span className="text-sm text-red-400 font-light">{mpError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest ml-1">First Name</label>
                        <div className="relative group">
                          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:text-sky-500 transition-colors" />
                          <input type="text" value={mpFirstName} onChange={(e) => setMpFirstName(e.target.value)} className="w-full bg-primary/50 border border-card-border rounded-2xl py-3.5 pl-10 pr-3 text-text-main focus:outline-none focus:border-sky-500/50 transition-all font-light text-sm" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest ml-1">Last Name</label>
                        <div className="relative group">
                          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:text-sky-500 transition-colors" />
                          <input type="text" value={mpLastName} onChange={(e) => setMpLastName(e.target.value)} className="w-full bg-primary/50 border border-card-border rounded-2xl py-3.5 pl-10 pr-3 text-text-main focus:outline-none focus:border-sky-500/50 transition-all font-light text-sm" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest ml-1">Email Address</label>
                      <div className="relative group">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:text-sky-500 transition-colors" />
                        <input type="email" value={mpEmail} onChange={(e) => setMpEmail(e.target.value)} className="w-full bg-primary/50 border border-card-border rounded-2xl py-3.5 pl-10 pr-3 text-text-main focus:outline-none focus:border-sky-500/50 transition-all font-light text-sm" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest ml-1">PRC License Number</label>
                      <div className="relative group">
                        <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:text-sky-500 transition-colors" />
                        <input type="text" placeholder="e.g. 0123456" value={mpPrcLicense} onChange={(e) => setMpPrcLicense(e.target.value)} className="w-full bg-primary/50 border border-card-border rounded-2xl py-3.5 pl-10 pr-3 text-text-main focus:outline-none focus:border-sky-500/50 transition-all font-light text-sm" required />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest ml-1">Password</label>
                        <div className="relative group">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:text-sky-500 transition-colors" />
                          <input type={mpShowPassword ? 'text' : 'password'} value={mpPassword} onChange={(e) => setMpPassword(e.target.value)} className="w-full bg-primary/50 border border-card-border rounded-2xl py-3.5 pl-10 pr-10 text-text-main focus:outline-none focus:border-sky-500/50 transition-all font-light text-sm" />
                          <button type="button" onClick={() => setMpShowPassword(!mpShowPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sidebar-text-muted hover:text-text-main transition-colors">
                            {mpShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-light text-sidebar-text-muted uppercase tracking-widest ml-1">Confirm</label>
                        <div className="relative group">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:text-sky-500 transition-colors" />
                          <input type={mpShowConfirm ? 'text' : 'password'} value={mpConfirmPassword} onChange={(e) => setMpConfirmPassword(e.target.value)} className="w-full bg-primary/50 border border-card-border rounded-2xl py-3.5 pl-10 pr-10 text-text-main focus:outline-none focus:border-sky-500/50 transition-all font-light text-sm" />
                          <button type="button" onClick={() => setMpShowConfirm(!mpShowConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sidebar-text-muted hover:text-text-main transition-colors">
                            {mpShowConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={mpSubmitting}
                      className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-light rounded-2xl py-4 flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-sm mt-2"
                    >
                      {mpSubmitting ? <Loader2 size={18} className="animate-spin" /> : <>REGISTER AS PRACTITIONER <ArrowRight size={18} /></>}
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>

          <div className="px-8 pb-8 pt-2 border-t border-card-border flex flex-col items-center gap-3">
            <p className="text-sm text-sidebar-text-muted font-light">
              Already registered?{' '}
              <Link to="/login" className="text-sky-500 hover:underline">Sign in here</Link>
            </p>
            <Link to="/" className="flex items-center gap-1 text-xs text-sidebar-text-muted hover:text-text-main transition-colors font-light">
              <ArrowLeft size={12} /> Back to Home
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}