import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Eye, EyeOff, User, Lock,
  AlertCircle, Loader2, ShieldCheck, CheckCircle2,
  ArrowRight, Stethoscope, ArrowLeft, Key, UserPlus
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'

type ActiveTab = 'caregiver' | 'medical_practitioner'

export default function RegisterPage() {
  const { } = useAuth()
  const navigate = useNavigate()

  // ── UI STATE ──
  const [activeTab, setActiveTab] = useState<ActiveTab>('caregiver')
  const [step, setStep] = useState(1)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // ── FORM DATA ──
  const [accessId, setAccessId] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [license, setLicense] = useState('') // BHW ID or PRC License
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [verifiedInfo, setVerifiedInfo] = useState<any>(null)

  // ── LOGIC: AUTO-DETECT ROLE ──
  const handleIdChange = (val: string) => {
    const v = val.toUpperCase()
    setAccessId(v)
    if (v.startsWith('CG')) setActiveTab('caregiver')
    else if (v.startsWith('MP')) setActiveTab('medical_practitioner')
  }

  // ── STEP 1: VERIFY ID ──
  const handleVerify = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!accessId.trim()) return

    setLoading(true)
    try {
      const { data, error: dbError } = await supabase
        .from('caregivers')
        .select('*')
        .eq('unique_access_id', accessId.trim().toUpperCase())
        .maybeSingle()

      if (dbError) throw dbError
      
      if (!data) {
        setError('Access ID not found. Contact administrator.')
        return
      }

      if (data.role !== activeTab) {
        setError(`This ID is registered for a ${data.role === 'caregiver' ? 'Caregiver' : 'Practitioner'}.`)
        return
      }

      if (data.email) {
        setError('This ID is already registered. Please sign in.')
        return
      }

      // Success
      setVerifiedInfo(data)
      if (data.first_name) setFirstName(data.first_name)
      if (data.last_name) setLastName(data.last_name)
      setStep(2)
    } catch (err: any) {
      setError(err.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  // ── STEP 2: FINAL INITIALIZATION ──
  const handleFinalRegister = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      // A: Auth Sign Up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            full_name: `${firstName.trim()} ${lastName.trim()}`,
            role: activeTab,
            access_id: accessId.trim().toUpperCase()
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Auth creation failed')

      // B: Update Database Row
      const updatePayload: any = {
        id: authData.user.id,
        email: email.trim().toLowerCase(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        is_active: false,
        status: 'pending'
      }

      if (activeTab === 'caregiver') updatePayload.bhw_id = license.trim()
      else updatePayload.prc_license = license.trim()

      const { error: updateError } = await supabase
        .from('caregivers')
        .update(updatePayload)
        .eq('unique_access_id', accessId.trim().toUpperCase())

      if (updateError) {
        await supabase.auth.signOut()
        throw updateError
      }

      // C: Activity Log
      await supabase.from('activity_logs').insert({
        user_id: authData.user.id,
        user_type: activeTab,
        action: 'REGISTER',
        details: { access_id: accessId.trim().toUpperCase() }
      })

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Initialization failed')
    } finally {
      setLoading(false)
    }
  }

  // ── RENDER SUCCESS SCREEN ──
  if (success) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
           <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[140px]" />
           <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[140px]" />
        </div>

        <div className="max-w-md w-full bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[40px] p-10 shadow-2xl relative z-10 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-50 mb-2 tracking-tighter uppercase leading-tight">
            Enrollment <span className="text-sky-500">Success</span>
          </h2>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed mb-8">
            Account pending <span className="text-amber-400">administrative review</span>.
          </p>

          <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-6 mb-8">
            <p className="text-[9px] text-slate-500 uppercase tracking-[0.3em] mb-2 font-semibold leading-relaxed">Secure Access ID</p>
            <code className="text-2xl font-mono text-sky-400 font-bold tracking-[0.2em]">{accessId}</code>
          </div>

          <button onClick={() => navigate('/login')} className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
            <span>Return to Terminal</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  // ── MAIN RENDER ──
  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
         <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[120px]" />
      </div>

      <button onClick={() => navigate('/login')} className="absolute top-6 left-6 flex items-center gap-2 p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-slate-50 transition-all z-50">
        <ArrowLeft size={16} />
        <span className="text-[10px] font-semibold uppercase tracking-widest">Back</span>
      </button>

      <div className="max-w-md w-full bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/20">
             <UserPlus size={24} className="text-slate-50" />
          </div>
          <h1 className="text-xl font-semibold tracking-tighter uppercase leading-tight">Personnel Enrollment</h1>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1 leading-relaxed">Initialization Protocol</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
           <button 
             onClick={() => setStep(1)}
             className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all cursor-pointer ${step >= 1 ? 'bg-sky-500 border-sky-500 text-slate-950 shadow-lg shadow-sky-500/20' : 'border-slate-800 text-slate-600'}`}
           >
             1
           </button>
           <div className={`h-px w-8 transition-all ${step >= 2 ? 'bg-sky-500' : 'bg-slate-800'}`} />
           <button 
             disabled={!verifiedInfo}
             onClick={() => setStep(2)}
             className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${verifiedInfo ? 'cursor-pointer hover:border-sky-500/50' : 'cursor-not-allowed'} ${step >= 2 ? 'bg-sky-500 border-sky-500 text-slate-950 shadow-lg shadow-sky-500/20' : 'border-slate-800 text-slate-600'}`}
           >
             2
           </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-rose-400 text-[9px] font-bold uppercase tracking-widest">
            <AlertCircle size={14} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* STEP 1: VERIFY ID */}
        {step === 1 && (
          <form onSubmit={handleVerify} className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex p-1 bg-slate-950/50 rounded-xl border border-white/5 mb-2">
              <button type="button" onClick={() => setActiveTab('caregiver')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-bold uppercase transition-all ${activeTab === 'caregiver' ? 'bg-sky-500 text-slate-950' : 'text-slate-500'}`}>
                <User size={12} /> Caregiver
              </button>
              <button type="button" onClick={() => setActiveTab('medical_practitioner')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-bold uppercase transition-all ${activeTab === 'medical_practitioner' ? 'bg-sky-500 text-slate-950' : 'text-slate-500'}`}>
                <Stethoscope size={12} /> Practitioner
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest ml-1">Access Token</label>
              <div className="relative group">
                <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-500 transition-colors" />
                <input 
                  autoFocus
                  value={accessId}
                  onChange={(e) => handleIdChange(e.target.value)}
                  placeholder="e.g. CG-XXXX"
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-slate-50 font-mono font-bold tracking-widest outline-none focus:border-sky-500/50 uppercase"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading || !accessId}
              className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <><ShieldCheck size={16} /> Verify Node Identity</>}
            </button>
          </form>
        )}

        {/* STEP 2: PROFILE SETUP */}
        {step === 2 && (
          <form onSubmit={handleFinalRegister} className="space-y-4 animate-in slide-in-from-right duration-300">
             <div className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <p className="text-[10px] font-mono font-bold text-emerald-400 tracking-widest leading-relaxed">{accessId}</p>
                </div>
                <button type="button" onClick={() => setStep(1)} className="text-[8px] font-semibold text-slate-500 hover:text-slate-50 uppercase tracking-widest">Reset</button>
             </div>

             <div className="grid grid-cols-2 gap-3">
                <Input label="First Name" value={firstName} onChange={setFirstName} placeholder="Juan" />
                <Input label="Last Name" value={lastName} onChange={setLastName} placeholder="Dela Cruz" />
             </div>
             <Input label="Network Email" type="email" value={email} onChange={setEmail} placeholder="name@bantayan.care" />
             
             {/* ── PASSKEY & CONFIRM ── */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               
               {/* Passkey Field */}
               <div className="space-y-1.5">
                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Passkey</label>
                 <div className="relative group">
                   {/* Lock Icon (Left) */}
                   <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-500 transition-colors" />
                   
                   <input 
                     type={showPassword ? 'text' : 'password'}
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     placeholder="••••••••"
                     className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3.5 pl-10 pr-12 text-sm text-white outline-none focus:border-sky-500/50 transition-all font-medium"
                   />
                   
                   {/* Eye Toggle (Right) */}
                   <button 
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-600 hover:text-sky-400 transition-all active:scale-90"
                   >
                     {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                   </button>
                 </div>
               </div>
             
               {/* Confirm Field */}
               <div className="space-y-1.5">
                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm</label>
                 <div className="relative group">
                   {/* Lock Icon (Left) */}
                   <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-500 transition-colors" />
                   
                   <input 
                     type={showConfirmPassword ? 'text' : 'password'}
                     value={confirmPassword} 
                     onChange={(e) => setConfirmPassword(e.target.value)}
                     placeholder="••••••••"
                     className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3.5 pl-10 pr-12 text-sm text-white outline-none focus:border-sky-500/50 transition-all font-medium"
                   />
                   
                   {/* Eye Toggle (Right) */}
                   <button 
                     type="button"
                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                     className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-600 hover:text-sky-400 transition-all active:scale-90"
                   >
                     {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                   </button>
                 </div>
               </div>
             </div>

             <Input 
                label={activeTab === 'medical_practitioner' ? "PRC License" : "BHW ID Number"} 
                value={license} 
                onChange={setLicense} 
                placeholder="e.g. 0123456" 
             />

             <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-slate-50 font-semibold uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 mt-4">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16} /> Initialize Account</>}
             </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
           <Link to="/login" className="text-[9px] font-semibold text-slate-500 hover:text-sky-400 uppercase tracking-widest transition-all">
             Already active? <span className="text-sky-500 border-b border-sky-500/20">Sign in to Node</span>
           </Link>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }: any) {
  return (
    <div className="space-y-1.5 w-full">
      <label className="text-[8px] font-semibold text-slate-500 uppercase tracking-widest ml-1">{label}</label>
      <input 
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-950/50 border border-white/10 rounded-lg py-2.5 px-4 text-xs text-slate-50 outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-800"
      />
    </div>
  );
}