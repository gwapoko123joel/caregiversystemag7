import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { 
  ShieldCheck, User, Mail, IdCard, 
  CheckCircle2, XCircle, Loader2 
} from 'lucide-react'

export default function PractitionerVerificationView() {
  const [pendingUsers, setPendingUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchPendingUsers()
  }, [])

  async function fetchPendingUsers() {
    setLoading(true)
    const { data } = await supabase
      .from('caregivers')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    setPendingUsers(data || [])
    setLoading(false)
  }

  async function handleVerify(userId: string) {
    setProcessing(true)
    const { error } = await supabase
      .from('caregivers')
      .update({ 
        status: 'authorized', 
        is_active: true 
      })
      .eq('id', userId)

    if (!error) {
      // Create an activity log for the audit trail
      await supabase.from('activity_logs').insert({
        action: 'VERIFIED_PRACTITIONER',
        details: { target_user: userId }
      })
      
      setSelectedUser(null)
      fetchPendingUsers()
    }
    setProcessing(false)
  }

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-700">
      <div>
        <h2 className="text-2xl font-black text-text-main uppercase tracking-tight">Practitioner Verification</h2>
        <p className="text-[10px] font-bold text-sidebar-text-muted uppercase tracking-widest mt-1">
          Validate Medical Credentials & Clinical Consultation Hotlines
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* LEFT: PENDING LIST */}
        <div className="lg:col-span-4 bg-card border border-card-border rounded-[32px] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-card-border bg-primary/20">
            <p className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest">Pending Requests ({pendingUsers.length})</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex justify-center p-10"><Loader2 className="animate-spin text-sky-500" /></div>
            ) : pendingUsers.length === 0 ? (
              <div className="text-center py-10 opacity-30">
                <ShieldCheck size={40} className="mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase">No Pending Verifications</p>
              </div>
            ) : (
              pendingUsers.map(u => (
                <button 
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`w-full p-4 rounded-2xl border transition-all text-left group ${
                    selectedUser?.id === u.id ? 'bg-sky-500/10 border-sky-500' : 'bg-primary/10 border-card-border hover:border-sidebar-text-muted/30'
                  }`}
                >
                  <p className="text-xs font-black text-text-main uppercase">{u.first_name} {u.last_name}</p>
                  <p className="text-[9px] text-sidebar-text-muted font-bold uppercase mt-1">{u.role}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: DETAIL VIEW */}
        <div className="lg:col-span-8 bg-card border border-card-border rounded-[40px] p-8 flex flex-col justify-center relative overflow-hidden">
          {selectedUser ? (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-sky-500/10 rounded-3xl flex items-center justify-center text-sky-500 border border-sky-500/20 shadow-lg">
                  <User size={40} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-text-main uppercase tracking-tight">{selectedUser.first_name} {selectedUser.last_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Awaiting Verification</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-primary/20 p-6 rounded-3xl border border-card-border">
                  <div className="flex items-center gap-2 mb-2 text-sky-500">
                    <Mail size={16} />
                    <p className="text-[10px] font-black uppercase">Email Address</p>
                  </div>
                  <p className="text-sm font-medium text-text-main">{selectedUser.email}</p>
                </div>
                <div className="bg-primary/20 p-6 rounded-3xl border border-card-border">
                  <div className="flex items-center gap-2 mb-2 text-sky-500">
                    <IdCard size={16} />
                    <p className="text-[10px] font-black uppercase">PRC / BHW License</p>
                  </div>
                  <p className="text-sm font-black text-text-main font-mono tracking-widest">{selectedUser.prc_license || selectedUser.bhw_id || 'N/A'}</p>
                </div>
              </div>

              <div className="pt-8 border-t border-card-border flex gap-4">
                <button 
                  disabled={processing}
                  onClick={() => handleVerify(selectedUser.id)}
                  className="flex-1 py-4 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/20 active:scale-95"
                >
                  {processing ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={16} /> Authorize Personnel</>}
                </button>
                <button className="px-8 py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all">
                  <XCircle size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4 opacity-20">
              <ShieldCheck size={80} className="mx-auto" />
              <p className="text-xs font-black uppercase tracking-[0.3em]">Select a pending credential to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
