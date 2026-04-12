import { useState, type FormEvent } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  Mail,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ArrowRight,
  Heart
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

type Role = 'caregiver' | 'medical_practitioner' | 'admin'

const ROLES: { value: Role; label: string }[] = [
  { value: 'caregiver', label: 'Caregiver' },
  { value: 'medical_practitioner', label: 'Medical Practitioner' },
  { value: 'admin', label: 'Administrator' },
]

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const urlError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accessId, setAccessId] = useState('')
  const [role, setRole] = useState<Role>('caregiver')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email || !password || !accessId) {
      setError('All fields are required.')
      return
    }

    setLoading(true)
    const { error: authError } = await signIn(email, password, accessId)
    setLoading(false)

    if (authError) {
      setError(authError)
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* ── Background Elements ── */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-purple/20 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-purple/10 blur-[120px] rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none" />
      
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left Branding (Hidden on mobile) */}
        <div className="hidden lg:block space-y-8">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-gradient-to-br from-brand-neon-green to-brand-accent-green rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(57,255,20,0.4)]">
                <Heart size={28} className="text-brand-dark fill-brand-dark" />
             </div>
             <span className="text-2xl font-black tracking-tight text-white uppercase">BantayanCare</span>
          </div>
          
          <h1 className="text-6xl font-bold text-white leading-[1.1] tracking-tight">
            Advanced <span className="text-brand-neon-green">Patient</span> Monitoring.
          </h1>
          
          <p className="text-xl text-gray-400 font-medium leading-relaxed max-w-sm">
            Access your secure portal for real-time care coordination and reporting.
          </p>
          
          <div className="space-y-4 pt-4">
             {[
               "End-to-end encrypted telemetry",
               "Automated caregiver sync",
               "Direct medical practitioner access"
             ].map(feature => (
               <div key={feature} className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-brand-neon-green shadow-[0_0_8px_rgba(57,255,20,0.8)]" />
                  <span className="font-semibold text-sm">{feature}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Right Form Card */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            
            <div className="mb-8">
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Welcome Back</h2>
              <p className="text-gray-400 font-medium">Verify your credentials to continue</p>
            </div>

            {/* Role Switcher */}
            <div className="flex p-1 bg-brand-dark/50 rounded-xl mb-8 border border-white/5">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    role === r.value 
                      ? 'bg-brand-neon-green text-brand-dark shadow-lg shadow-brand-neon-green/20' 
                      : 'text-gray-500 hover:text-white'
                  }`}
                  onClick={() => setRole(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Error Message */}
            {(error || urlError) && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-500 animate-shake">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span className="text-sm font-bold">
                  {error || (urlError === 'profile_not_found' 
                    ? 'Caregiver profile missing. Verify your registration.' 
                    : 'Authentication failure.')}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-neon-green transition-colors" />
                  <input
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-brand-dark/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-neon-green/50 focus:ring-1 focus:ring-brand-neon-green/50 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Secure Password</label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-neon-green transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-brand-dark/50 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-neon-green/50 focus:ring-1 focus:ring-brand-neon-green/50 transition-all font-medium"
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

              {/* Access ID */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">
                  Access ID 
                  {role === 'admin' && <span className="text-brand-accent-green/60 normal-case italic ml-1">(Bypass Active)</span>}
                </label>
                <div className="relative group">
                  <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-neon-green transition-colors" />
                  <input
                    type="text"
                    placeholder="e.g. ADM-001"
                    value={accessId}
                    onChange={(e) => setAccessId(e.target.value.toUpperCase())}
                    className="w-full bg-brand-dark/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-neon-green/50 focus:ring-1 focus:ring-brand-neon-green/50 transition-all font-medium tracking-wider"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-neon-green text-brand-dark font-black rounded-2xl py-4 flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(57,255,20,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg uppercase tracking-tight overflow-hidden relative group"
              >
                {loading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    LOG IN TO PORTAL <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center gap-4">
              <p className="text-gray-500 text-sm font-semibold">
                New to the system? <Link to="/register" className="text-brand-neon-green hover:underline">Request Access</Link>
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
