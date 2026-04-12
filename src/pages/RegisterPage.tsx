import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Mail,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  User,
  AlertCircle,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Heart,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

type Role = 'caregiver' | 'medical_practitioner' | 'admin'

const ROLES: { value: Role; label: string; description: string }[] = [
  {
    value: 'caregiver',
    label: 'Caregiver',
    description: 'Provides daily patient care and submits monitoring reports',
  },
  {
    value: 'medical_practitioner',
    label: 'Medical Practitioner',
    description: 'Reviews patient data and provides clinical oversight',
  },
  {
    value: 'admin',
    label: 'Administrator',
    description: 'Manages system access, users, and audit logs',
  },
]

interface FormState {
  full_name: string
  email: string
  password: string
  confirm_password: string
  access_id: string
  role: Role
}

const INITIAL: FormState = {
  full_name: '',
  email: '',
  password: '',
  confirm_password: '',
  access_id: '',
  role: 'caregiver',
}

export default function RegisterPage() {
  const { signUp } = useAuth()

  const [form, setForm] = useState<FormState>(INITIAL)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function validateAccessId(id: string): boolean {
    return /^[A-Z]{2,4}-\d{4}-\d{3,}$/.test(id)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.full_name || !form.email || !form.password || !form.confirm_password || !form.access_id) {
      setError('All fields are required.')
      return
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (!validateAccessId(form.access_id)) {
      setError('Invalid Access ID format. Expected: PREFIX-YEAR-NUMBER')
      return
    }

    setLoading(true)
    const { error: authError } = await signUp({
      email: form.email,
      password: form.password,
      full_name: form.full_name,
      role: form.role,
      access_id: form.access_id,
    })
    setLoading(false)

    if (authError) {
      setError(authError)
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-hero-gradient opacity-30" />
        <div className="w-full max-w-lg bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 shadow-2xl relative z-10 text-center">
          <div className="w-20 h-20 bg-brand-neon-green rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(57,255,20,0.5)]">
            <CheckCircle2 size={40} className="text-brand-dark" />
          </div>
          <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Request Submitted</h2>
          <p className="text-gray-400 font-medium leading-relaxed mb-10">
            Your registration is complete. Please verify your email <strong>{form.email}</strong> before signing in to the portal.
          </p>
          <button 
            onClick={() => window.location.href='/login'}
            className="w-full bg-brand-neon-green text-brand-dark font-black rounded-2xl py-4 flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(57,255,20,0.4)] transition-all uppercase tracking-tight"
          >
            GO TO SIGN IN <ArrowRight size={20} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* ── Background Elements ── */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-purple/20 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-purple/10 blur-[120px] rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none" />
      
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-5 gap-12 items-start relative z-10">
        
        {/* Left Branding (2/5) */}
        <div className="hidden lg:block lg:col-span-2 sticky top-12 space-y-10">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-gradient-to-br from-brand-neon-green to-brand-accent-green rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(57,255,20,0.4)]">
                <Heart size={28} className="text-brand-dark fill-brand-dark" />
             </div>
             <span className="text-2xl font-black tracking-tight text-white uppercase">BantayanCare</span>
          </div>
          
          <h1 className="text-5xl font-bold text-white leading-[1.1] tracking-tight">
            Join the <span className="text-brand-neon-green">Medical</span> Fleet.
          </h1>
          
          <p className="text-lg text-gray-400 font-medium leading-relaxed">
            Register your credentials to begin coordination in Barangay Bantayan.
          </p>
          
          <div className="space-y-4">
             {ROLES.map(r => (
               <div key={r.value} className={`p-5 rounded-2xl border transition-all ${form.role === r.value ? 'bg-brand-neon-green/10 border-brand-neon-green/30' : 'bg-white/5 border-white/5'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-2 h-2 rounded-full ${form.role === r.value ? 'bg-brand-neon-green shadow-[0_0_8px_rgba(57,255,20,0.8)]' : 'bg-gray-600'}`} />
                    <span className={`text-sm font-black uppercase tracking-widest ${form.role === r.value ? 'text-brand-neon-green' : 'text-gray-500'}`}>{r.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 font-medium">{r.description}</p>
               </div>
             ))}
          </div>
        </div>

        {/* Right Form Card (3/5) */}
        <div className="w-full lg:col-span-3">
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 lg:p-12 shadow-2xl">
            
            <div className="mb-10">
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Create Your Account</h2>
              <p className="text-gray-400 font-medium">Complete the secure enrollment form below</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-500 animate-shake">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span className="text-sm font-bold">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Legal Full Name</label>
                  <div className="relative group">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-neon-green transition-colors" />
                    <input
                      type="text"
                      placeholder="Juan dela Cruz"
                      value={form.full_name}
                      onChange={(e) => set('full_name', e.target.value)}
                      className="w-full bg-brand-dark/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-brand-neon-green/50 focus:ring-1 focus:ring-brand-neon-green/50 transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-neon-green transition-colors" />
                    <input
                      type="email"
                      placeholder="you@email.com"
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                      className="w-full bg-brand-dark/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-brand-neon-green/50 focus:ring-1 focus:ring-brand-neon-green/50 transition-all font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Role Select */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">System Role</label>
                  <div className="relative group">
                    <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-neon-green transition-colors z-20" />
                    <select
                      value={form.role}
                      onChange={(e) => set('role', e.target.value as Role)}
                      className="w-full bg-brand-dark/50 border border-white/10 rounded-2xl py-4 pl-12 pr-10 text-white focus:outline-none focus:border-brand-neon-green/50 focus:ring-1 focus:ring-brand-neon-green/50 transition-all font-medium appearance-none relative z-10"
                    >
                      {ROLES.map(r => <option key={r.value} value={r.value} className="bg-brand-dark">{r.label}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-20">
                      <ChevronRight size={18} className="rotate-90" />
                    </div>
                  </div>
                </div>

                {/* Access ID */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Access ID (PREFIX-YYYY-NNN)</label>
                  <div className="relative group">
                    <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-neon-green transition-colors" />
                    <input
                      type="text"
                      placeholder="e.g. CG-2024-001"
                      value={form.access_id}
                      onChange={(e) => set('access_id', e.target.value.toUpperCase())}
                      className="w-full bg-brand-dark/50 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white focus:outline-none focus:border-brand-neon-green/50 focus:ring-1 focus:ring-brand-neon-green/50 transition-all font-medium tracking-wider"
                      required
                    />
                    {form.access_id && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {validateAccessId(form.access_id) ? <CheckCircle2 size={18} className="text-brand-neon-green" /> : <AlertCircle size={18} className="text-red-500" />}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Password */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-neon-green transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => set('password', e.target.value)}
                      className="w-full bg-brand-dark/50 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white focus:outline-none focus:border-brand-neon-green/50 focus:ring-1 focus:ring-brand-neon-green/50 transition-all font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Confirm Password</label>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-neon-green transition-colors" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.confirm_password}
                      onChange={(e) => set('confirm_password', e.target.value)}
                      className="w-full bg-brand-dark/50 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white focus:outline-none focus:border-brand-neon-green/50 focus:ring-1 focus:ring-brand-neon-green/50 transition-all font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-neon-green text-brand-dark font-black rounded-2xl py-5 flex items-center justify-center gap-2 hover:shadow-[0_0_40px_rgba(57,255,20,0.4)] hover:scale-[1.01] transition-all disabled:opacity-50 text-xl uppercase tracking-tight group"
              >
                {loading ? <Loader2 size={24} className="animate-spin" /> : <>ENROLL IN PLATFORM <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-white/10 flex flex-col items-center gap-4">
              <p className="text-gray-500 text-sm font-semibold">
                Already registered? <Link to="/login" className="text-brand-neon-green hover:underline">Return to Sign In</Link>
              </p>
              <div className="flex items-center gap-2 text-gray-600 text-[10px] font-black uppercase tracking-tighter">
                <ShieldCheck size={12} className="text-brand-accent-green" />
                HIPAA COMPLIANT SECURE GATEWAY
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
