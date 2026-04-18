import { useState } from 'react'
import { 
  Search, 
  Plus, 
  ShieldAlert, 
  KeyRound, 
  RefreshCw,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import type { AdminDashboardContextType } from '../AdminDashboard'
import type { Profile } from '../../../lib/supabaseClient'

/**
 * Generate a random 6-character uppercase alphanumeric string for access IDs.
 */
function generateAccessId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function UserManagement() {
  const { users, user, profile, loadUsers, loadLogs } = useOutletContext<AdminDashboardContextType>()
  
  // State
  const [searchUser, setSearchUser] = useState('')
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({ 
    first_name: '', 
    last_name: '', 
    email: '', 
    role: 'caregiver' as Profile['role'], 
    access_id: '' 
  })
  
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  // Handlers
  async function handleUpdateStatus(userId: string, newStatus: Profile['status']) {
    setUpdatingStatus(userId)
    
    const payload: Partial<Profile> = { status: newStatus }
    let generatedId = ''

    if (newStatus === 'authorized') {
      generatedId = generateAccessId()
      payload.unique_access_id = generatedId
    }

    const { error } = await supabase
      .from('caregivers')
      .update(payload)
      .eq('id', userId)

    if (!error) {
      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        user_type: profile?.role ?? 'admin',
        action: 'UPDATE_USER_STATUS',
        details: { target_user: userId, status: newStatus, assigned_id: generatedId || undefined }
      })
      await loadUsers()
      await loadLogs()
    }
    setUpdatingStatus(null)
  }

  async function handleReissueId(userId: string) {
    if (!confirm('Are you sure you want to REISSUE the Access ID? The old ID will be invalidated immediately.')) return
    
    setProcessingId(userId)
    const newId = generateAccessId()

    const { error } = await supabase
      .from('caregivers')
      .update({ unique_access_id: newId })
      .eq('id', userId)

    if (!error) {
      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        user_type: profile?.role ?? 'admin',
        action: 'REISSUE_ACCESS_ID',
        details: { target_user: userId, new_id: newId }
      })
      await loadUsers()
      await loadLogs()
    }
    setProcessingId(null)
  }

  async function handleProvisionUser() {
    if (!newUser.first_name || !newUser.last_name || !newUser.email) {
      alert('Please provide first name, last name, and email.')
      return
    }

    const accessId = newUser.access_id.trim() || generateAccessId()
    const tempUid = crypto.randomUUID() // For manual provisioning without GoTrue user (will link upon first login)

    const { error } = await supabase
      .from('caregivers')
      .insert({
        id: tempUid,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        role: newUser.role,
        status: 'authorized',
        unique_access_id: accessId
      })

    if (error) {
      console.error('Provisioning Error:', error)
      alert(`Provisioning failed: ${error.message}`)
      return
    }

    await supabase.from('activity_logs').insert({
      user_id: user?.id,
      user_type: profile?.role ?? 'admin',
      action: 'AUTHORIZE_USER',
      details: { ...newUser, assigned_id: accessId }
    })

    await loadUsers()
    await loadLogs()
    setShowAddUser(false)
    setNewUser({ first_name: '', last_name: '', email: '', role: 'caregiver', access_id: '' })
  }

  const filteredUsers = users.filter(u => {
    const q = searchUser.toLowerCase()
    return (
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.unique_access_id?.toLowerCase().includes(q)
    )
  })

  const pendingUsers = users.filter(u => u.status === 'pending')

  return (
    <div className="space-y-6 animate-in fade-in duration-500 slide-in-from-bottom-4">
      
      {/* Header & Main Action */}
      <div className="bg-card border border-card-border rounded-[32px] md:rounded-[40px] p-6 lg:p-12 relative overflow-hidden shadow-sm dark:shadow-none transition-colors">
        <div className="md:absolute top-0 right-0 md:p-8 mb-8 md:mb-0">
           <button 
             onClick={() => setShowAddUser(!showAddUser)}
             className="w-full md:w-auto px-6 py-4 md:py-3 bg-sky-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-harmonized flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all"
           >
             <Plus size={16} /> Authorize Personnel
           </button>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-black text-text-main mb-2 tracking-tight uppercase transition-colors">Access Governance</h2>
        <p className="text-sidebar-text-muted font-bold text-[10px] md:text-sm uppercase tracking-widest mb-6 md:mb-12 transition-colors">User Provisioning & Authorization Matrix</p>

        {/* Enrollment Form */}
        {showAddUser && (
          <div className="mb-12 p-6 md:p-8 bg-card border border-card-border rounded-3xl animate-in zoom-in-95 duration-300 shadow-sm dark:shadow-none">
            <h4 className="text-[10px] md:text-xs font-black uppercase text-sky-500 tracking-[0.2em] mb-6">Initialize New Node Authorization</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
              {[
                { label: 'First Name', val: newUser.first_name, set: (v:string)=>setNewUser(p=>({...p,first_name:v})) },
                { label: 'Last Name', val: newUser.last_name, set: (v:string)=>setNewUser(p=>({...p,last_name:v})) },
                { label: 'Email', val: newUser.email, set: (v:string)=>setNewUser(p=>({...p,email:v})) },
              ].map(f => (
                <div key={f.label} className="space-y-2">
                   <label className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest ml-1">{f.label}</label>
                   <input 
                     value={f.val} 
                     onChange={e => f.set(e.target.value)} 
                     className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-xs font-bold text-text-main focus:outline-none focus:border-sky-500/50 placeholder:text-sidebar-text-muted/50 transition-colors shadow-sm dark:shadow-none"
                   />
                </div>
              ))}
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest ml-1">System Role</label>
                 <select 
                   value={newUser.role} 
                   onChange={e => setNewUser(p => ({ ...p, role: e.target.value as Profile['role'] }))}
                   className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-xs font-bold text-text-main focus:outline-none focus:border-sky-500/50 appearance-none transition-colors shadow-sm dark:shadow-none"
                 >
                    <option value="caregiver" className="bg-card text-text-main">Caregiver</option>
                    <option value="medical_practitioner" className="bg-card text-text-main">Practitioner</option>
                    <option value="admin" className="bg-card text-text-main">Administrator</option>
                 </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest ml-1">Access ID (Optional)</label>
                <input 
                  placeholder="Auto-generate" 
                  value={newUser.access_id} 
                  onChange={e => setNewUser(p => ({ ...p, access_id: e.target.value.toUpperCase() }))} 
                  className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-xs font-bold text-text-main focus:outline-none focus:border-sky-500/50 placeholder:text-sidebar-text-muted/50 tracking-widest transition-colors shadow-sm dark:shadow-none"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
               <button 
                 onClick={handleProvisionUser}
                 className="flex-1 px-8 py-4 md:py-3 bg-sky-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:scale-105 active:scale-95 transition-all"
               >
                 Initialize Credentials
               </button>
               <button onClick={()=>setShowAddUser(false)} className="px-8 py-4 md:py-3 text-xs font-black text-sidebar-text-muted hover:text-text-main uppercase tracking-widest transition-colors">Abort</button>
            </div>
          </div>
        )}

        {/* Pending Approvals Section */}
        {pendingUsers.length > 0 && (
          <div className="mb-10 p-6 bg-sky-500/5 border border-sky-500/20 rounded-[32px] transition-colors">
            <h4 className="flex items-center gap-2 text-sky-500 mb-4 px-2 tracking-[0.15em] text-xs font-black uppercase">
               <ShieldAlert size={14} /> Critical: Node Verification Required ({pendingUsers.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between bg-card p-4 rounded-2xl border border-card-border shadow-sm dark:shadow-lg transition-colors">
                  <div>
                    <div className="font-black text-sm uppercase tracking-tight text-text-main transition-colors">{u.first_name} {u.last_name}</div>
                    <div className="text-[10px] font-bold text-sidebar-text-muted font-mono uppercase italic transition-colors">{u.role} · {u.email}</div>
                  </div>
                  <div className="flex gap-2">
                     <button 
                       onClick={() => handleUpdateStatus(u.id, 'authorized')} 
                       className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-lg hover:scale-105 active:scale-95 transition-all shadow-none border-none"
                     >
                       Approve
                     </button>
                     <button 
                       onClick={() => handleUpdateStatus(u.id, 'revoked')} 
                       className="px-4 py-2 text-[10px] font-black text-sidebar-text-muted hover:text-text-main uppercase transition-all"
                     >
                       Deny
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table Header Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
           <div className="relative group w-full md:max-w-sm">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:text-sky-500 transition-colors" />
              <input 
                placeholder="SEARCH FLEET: NAME, EMAIL, OR NODE ID..." 
                value={searchUser} 
                onChange={e => setSearchUser(e.target.value)}
                className="w-full bg-card border border-card-border rounded-2xl py-4 md:py-3 pl-12 pr-4 text-xs font-semibold text-text-main focus:outline-none focus:border-sky-500/40 placeholder:text-sidebar-text-muted/50 tracking-wider transition-colors shadow-sm dark:shadow-none" 
              />
           </div>
        </div>

        {/* Users Table (Desktop) */}
        <div className="hidden md:block overflow-x-auto">
            <table className="w-full font-sans">
              <thead>
                <tr className="text-left text-[10px] font-black text-sidebar-text-muted uppercase tracking-[0.2em] bg-card transition-colors">
                  <th className="px-6 py-5">Personnel Profile</th>
                  <th className="px-6 py-5">System Role</th>
                  <th className="px-6 py-5">Node Identity</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right flex items-center justify-end gap-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border transition-colors">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-card transition-colors group">
                    <td className="px-6 py-6">
                       <div className="text-sm font-black text-text-main transition-colors">{u.first_name} {u.last_name}</div>
                       <div className="text-xs text-sidebar-text-muted lowercase transition-colors">{u.email}</div>
                    </td>
                    <td className="px-6 py-6 transition-colors">
                       <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight ${
                          u.role === 'admin' ? 'bg-cyan-500/10 text-cyan-400' : 
                          u.role === 'medical_practitioner' ? 'bg-sky-500/10 text-sky-400' :
                          'bg-card text-sidebar-text-muted transition-all'
                       }`}>{u.role.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-6">
                       <div className="flex items-center gap-3">
                          <code className="text-xs font-black text-sky-500 font-mono tracking-widest bg-sky-500/10 dark:bg-sky-500/5 px-3 py-1.5 rounded-lg border border-sky-500/20">
                            {u.unique_access_id ?? 'UNINITIALIZED'}
                          </code>
                          <button 
                            disabled={processingId === u.id}
                            onClick={() => handleReissueId(u.id)}
                            title="Reissue Access ID (Invalidates old ID)"
                            className="p-2 bg-card text-sidebar-text-muted hover:bg-sky-500 hover:text-white rounded-xl transition-all group/btn shadow-sm dark:shadow-none"
                          >
                             {processingId === u.id ? <RefreshCw size={14} className="animate-spin" /> : <KeyRound size={14} />}
                          </button>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                        <div className={`text-[10px] font-black uppercase tracking-[0.1em] px-3 py-1.5 rounded-full border inline-flex items-center gap-2 transition-all ${
                          u.status === 'authorized' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-none' : 
                          u.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-none' : 
                          'node-urgent border-none shadow-none px-3 py-1.5'
                        }`}>
                           {u.status === 'authorized' ? <CheckCircle2 size={12} /> : u.status === 'pending' ? <Clock size={12} className="animate-pulse" /> : <XCircle size={12} />}
                           {u.status}
                        </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                       <div className="flex justify-end gap-2">
                         {u.role !== 'admin' && (
                           <div className="relative">
                             <select 
                               className="bg-card border border-card-border rounded-xl px-3 py-2 text-[10px] font-black uppercase text-sidebar-text-muted hover:text-text-main focus:outline-none transition-all appearance-none text-right cursor-pointer pr-2 shadow-sm dark:shadow-none"
                               value={u.status} 
                               onChange={(e) => handleUpdateStatus(u.id, e.target.value as Profile['status'])} 
                               disabled={updatingStatus === u.id}
                             >
                               <option value="pending" className="bg-card text-text-main">Pending</option>
                               <option value="authorized" className="bg-card text-text-main">Authorize</option>
                               <option value="revoked" className="bg-card text-text-main">Revoke</option>
                             </select>
                           </div>
                         )}
                         <button className="p-2 text-sidebar-text-muted hover:text-text-main transition-colors">
                           <MoreVertical size={16} />
                         </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>

        {/* Users Card List (Mobile) */}
        <div className="md:hidden space-y-4">
           {filteredUsers.map(u => (
             <div key={u.id} className="bg-card border border-card-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                   <div>
                      <div className="text-base font-black text-text-main uppercase tracking-tight">{u.first_name} {u.last_name}</div>
                      <div className="text-xs text-sidebar-text-muted">{u.email}</div>
                   </div>
                   <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight ${
                      u.role === 'admin' ? 'bg-cyan-500/10 text-cyan-400' : 
                      u.role === 'medical_practitioner' ? 'bg-sky-500/10 text-sky-400' :
                      'bg-card text-sidebar-text-muted transition-all'
                   }`}>{u.role.replace('_', ' ')}</span>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between p-3 bg-primary/50 rounded-2xl border border-card-border">
                      <code className="text-xs font-black text-sky-500 font-mono tracking-widest px-2">
                        {u.unique_access_id ?? 'UNINITIALIZED'}
                      </code>
                      <button 
                        disabled={processingId === u.id}
                        onClick={() => handleReissueId(u.id)}
                        className="p-2 bg-card text-sidebar-text-muted hover:bg-sky-500 hover:text-white rounded-xl transition-all"
                      >
                         {processingId === u.id ? <RefreshCw size={14} className="animate-spin" /> : <KeyRound size={14} />}
                      </button>
                   </div>

                   <div className="flex items-center justify-between">
                      <div className={`text-[10px] font-black uppercase tracking-[0.1em] px-3 py-1.5 rounded-full border inline-flex items-center gap-2 transition-all ${
                        u.status === 'authorized' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                        u.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                        'node-urgent border-none shadow-none'
                      }`}>
                         {u.status === 'authorized' ? <CheckCircle2 size={12} /> : u.status === 'pending' ? <Clock size={12} className="animate-pulse" /> : <XCircle size={12} />}
                         {u.status}
                      </div>

                      {u.role !== 'admin' && (
                         <select 
                           className="bg-card border border-card-border rounded-xl px-4 py-2 text-[10px] font-black uppercase text-sidebar-text-muted active:scale-95 transition-all appearance-none cursor-pointer"
                           value={u.status} 
                           onChange={(e) => handleUpdateStatus(u.id, e.target.value as Profile['status'])} 
                           disabled={updatingStatus === u.id}
                         >
                           <option value="pending">Pending</option>
                           <option value="authorized">Authorize</option>
                           <option value="revoked">Revoke</option>
                         </select>
                      )}
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  )
}
