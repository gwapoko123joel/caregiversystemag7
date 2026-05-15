import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { 
  ShieldCheck, User, Mail, IdCard, 
  CheckCircle2, Loader2, Search,
  Briefcase, Activity, Clock, ShieldAlert
} from 'lucide-react'
import ClinicalHandshake from '../../../components/shared/ClinicalHandshake'

export default function PractitionerVerificationView() {
  const [pendingUsers, setPendingUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [showHandshake, setShowHandshake] = useState(false)

  useEffect(() => { fetchPendingUsers(); }, [])

  async function fetchPendingUsers() {
    setLoading(true)
    const { data } = await supabase
      .from('caregivers')
      .select('*')
      .eq('role', 'medical_practitioner')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    setPendingUsers(data || [])
    if (data && data.length > 0 && !selectedUser) setSelectedUser(data[0])
    setLoading(false)
  }

  async function handleVerify(userId: string) {
    setProcessing(true)
    try {
      const { error } = await supabase
        .from('caregivers')
        .update({ status: 'authorized', is_active: true })
        .eq('id', userId)

      if (error) throw error

      await supabase.from('activity_logs').insert({
        action: 'PRACTITIONER_VERIFIED',
        details: { target: selectedUser.full_name, license: selectedUser.prc_license }
      })
      
      setShowHandshake(true)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 h-[calc(100vh-120px)] flex flex-col pb-6">
      
      {/* ── HEADER ── */}
      <div className="px-2">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
          Practitioner <span className="text-sky-500">Verification</span>
        </h2>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-2">
          Credential Validation Hub • Security Governance Node
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* LEFT: PENDING QUEUE (4 Spans) */}
        <div className="lg:col-span-4 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[32px] overflow-hidden flex flex-col shadow-2xl">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Verification Queue ({pendingUsers.length})</h3>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {loading ? (
              <div className="flex justify-center p-10"><Loader2 className="animate-spin text-sky-500" /></div>
            ) : pendingUsers.length === 0 ? (
              <div className="text-center py-20 opacity-30">
                <ShieldCheck size={40} className="mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">All Nodes Verified</p>
              </div>
            ) : (
              pendingUsers.map(u => (
                <button 
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`w-full p-5 rounded-2xl border transition-all text-left group ${
                    selectedUser?.id === u.id 
                      ? 'bg-sky-500/10 border-sky-500/50 shadow-lg' 
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                  }`}
                >
                  <p className="text-sm font-black text-white uppercase tracking-tight">{u.full_name}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-tighter">Registered: {new Date(u.created_at).toLocaleDateString()}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: CREDENTIAL INTEL (8 Spans) */}
        <div className="lg:col-span-8 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 md:p-10 shadow-2xl flex flex-col relative overflow-hidden">
          {selectedUser ? (
            <>
              <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/5 space-y-10 animate-in slide-in-from-right-4 duration-500">
                
                {/* Profile Header */}
                <div className="flex items-center gap-8">
                  <div className="w-24 h-24 bg-sky-500/10 rounded-[2.5rem] flex items-center justify-center text-sky-500 border border-sky-500/20 shadow-2xl group">
                    <User size={48} className="group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div>
                    <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em]">Practitioner Identity</span>
                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter mt-3">{selectedUser.full_name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <p className="text-[11px] text-amber-500 font-bold uppercase tracking-widest">Awaiting Verification Handshake</p>
                    </div>
                  </div>
                </div>

                {/* Data Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 bg-slate-950/50 rounded-3xl border border-white/5 flex flex-col justify-between h-32">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Mail size={16} />
                        <p className="text-[9px] font-black uppercase tracking-widest">Communication Node</p>
                      </div>
                      <p className="text-sm font-bold text-white lowercase">{selectedUser.email}</p>
                  </div>
                  <div className="p-6 bg-slate-950/50 rounded-3xl border border-white/5 flex flex-col justify-between h-32">
                      <div className="flex items-center gap-2 text-sky-500">
                        <ShieldCheck size={16} />
                        <p className="text-[9px] font-black uppercase tracking-widest">PRC Clinical License</p>
                      </div>
                      <p className="text-xl font-black text-sky-400 font-mono tracking-[0.2em]">{selectedUser.prc_license || 'NOT_FOUND'}</p>
                  </div>
                </div>

                {/* Security Advisory */}
                <div className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl flex items-start gap-4">
                  <ShieldAlert className="text-slate-500 shrink-0" size={20} />
                  <p className="text-[11px] text-slate-400 leading-relaxed uppercase font-medium">
                    Confirm that the provided PRC license matches the official Professional Regulation Commission registry before authorizing node activation. 
                    Authorization grants this personnel full access to Barangay Bantayan patient telemetry.
                  </p>
                </div>
              </div>

              {/* Action Handshake (Pinned to Bottom) */}
              <div className="pt-6 border-t border-white/5 flex gap-4 mt-6 bg-transparent">
                <button 
                  disabled={processing}
                  onClick={() => handleVerify(selectedUser.id)}
                  className="flex-[2] py-4 bg-sky-500 hover:bg-sky-400 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-sky-500/20 active:scale-95 flex items-center justify-center gap-3"
                >
                  {processing ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> Authorize Practitioner</>}
                </button>
                <button 
                  className="flex-1 py-4 bg-white/5 hover:bg-rose-600 border border-white/10 text-slate-500 hover:text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] transition-all"
                >
                  Flag Credentials
                </button>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20 space-y-6">
               <Briefcase size={80} strokeWidth={1} />
               <p className="text-xs font-black uppercase tracking-[0.4em]">Select a pending practitioner for audit</p>
            </div>
          )}
        </div>
      </div>
      {/* Handshake Success Overlay */}
      {showHandshake && (
        <ClinicalHandshake 
          title="Practitioner Verified"
          message={`Dr. ${selectedUser?.full_name} has been authorized to access the clinical network.`}
          subtext={`LICENSE: ${selectedUser?.prc_license || 'VERIFIED'}`}
          onComplete={() => { 
            setShowHandshake(false); 
            setSelectedUser(null);
            fetchPendingUsers();
          }}
          actionLabel="Return to Queue"
        />
      )}
    </div>
  )
}
