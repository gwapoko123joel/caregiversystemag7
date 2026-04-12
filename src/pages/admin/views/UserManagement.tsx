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
      <div className="bg-white/5 border border-white/5 rounded-[40px] p-8 lg:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8">
           <button 
             onClick={() => setShowAddUser(!showAddUser)}
             className="px-6 py-3 bg-brand-neon-green text-brand-dark font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-brand-neon-green/20 flex items-center gap-2 hover:scale-105 transition-all"
           >
             <Plus size={16} /> Authorize Personnel
           </button>
        </div>
        
        <h2 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">Access Governance</h2>
        <p className="text-gray-500 font-bold text-sm uppercase tracking-widest mb-12">User Provisioning & Authorization Matrix</p>

        {/* Enrollment Form */}
        {showAddUser && (
          <div className="mb-12 p-8 bg-brand-dark/50 border border-white/10 rounded-3xl animate-in zoom-in-95 duration-300">
            <h4 className="text-xs font-black uppercase text-brand-neon-green tracking-[0.2em] mb-6">Initialize New Node Authorization</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { label: 'First Name', val: newUser.first_name, set: (v:string)=>setNewUser(p=>({...p,first_name:v})) },
                { label: 'Last Name', val: newUser.last_name, set: (v:string)=>setNewUser(p=>({...p,last_name:v})) },
                { label: 'Email', val: newUser.email, set: (v:string)=>setNewUser(p=>({...p,email:v})) },
              ].map(f => (
                <div key={f.label} className="space-y-2">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{f.label}</label>
                   <input 
                     value={f.val} 
                     onChange={e => f.set(e.target.value)} 
                     className="w-full bg-brand-dark border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-brand-neon-green/50 placeholder:text-gray-700"
                   />
                </div>
              ))}
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">System Role</label>
                 <select 
                   value={newUser.role} 
                   onChange={e => setNewUser(p => ({ ...p, role: e.target.value as Profile['role'] }))}
                   className="w-full bg-brand-dark border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-brand-neon-green/50 appearance-none"
                 >
                    <option value="caregiver">Caregiver</option>
                    <option value="medical_practitioner">Practitioner</option>
                    <option value="admin">Administrator</option>
                 </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Access ID (Optional)</label>
                <input 
                  placeholder="Auto-generate" 
                  value={newUser.access_id} 
                  onChange={e => setNewUser(p => ({ ...p, access_id: e.target.value.toUpperCase() }))} 
                  className="w-full bg-brand-dark border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-brand-neon-green/50 placeholder:text-gray-700 tracking-widest"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
               <button 
                 onClick={handleProvisionUser}
                 className="px-8 py-3 bg-brand-neon-green text-brand-dark font-black text-xs uppercase tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all"
               >
                 Initialize Credentials
               </button>
               <button onClick={()=>setShowAddUser(false)} className="px-8 py-3 text-xs font-black text-gray-500 hover:text-white uppercase tracking-widest">Abort</button>
            </div>
          </div>
        )}

        {/* Pending Approvals Section */}
        {pendingUsers.length > 0 && (
          <div className="mb-10 p-6 bg-brand-neon-green/5 border border-brand-neon-green/20 rounded-[32px]">
            <h4 className="flex items-center gap-2 text-brand-neon-green mb-4 px-2 tracking-[0.15em] text-xs font-black uppercase">
               <ShieldAlert size={14} /> Critical: Node Verification Required ({pendingUsers.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between bg-brand-dark/50 p-4 rounded-2xl border border-white/5 shadow-lg">
                  <div>
                    <div className="font-black text-sm uppercase tracking-tight text-white">{u.first_name} {u.last_name}</div>
                    <div className="text-[10px] font-bold text-gray-500 font-mono uppercase italic">{u.role} · {u.email}</div>
                  </div>
                  <div className="flex gap-2">
                     <button 
                       onClick={() => handleUpdateStatus(u.id, 'authorized')} 
                       className="px-4 py-2 bg-brand-neon-green text-brand-dark text-[10px] font-black uppercase rounded-lg hover:scale-105 transition-all"
                     >
                       Approve
                     </button>
                     <button 
                       onClick={() => handleUpdateStatus(u.id, 'revoked')} 
                       className="px-4 py-2 text-[10px] font-black text-gray-500 hover:text-white uppercase transition-all"
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
           <div className="relative group max-w-sm flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-brand-neon-green transition-colors" />
              <input 
                placeholder="SEARCH FLEET: NAME, EMAIL, OR NODE ID..." 
                value={searchUser} 
                onChange={e => setSearchUser(e.target.value)}
                className="w-full bg-brand-dark border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs font-semibold text-white focus:outline-none focus:border-brand-neon-green/40 placeholder:text-gray-700 tracking-wider" 
              />
           </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] bg-white/[0.01]">
                  <th className="px-6 py-5">Personnel Profile</th>
                  <th className="px-6 py-5">System Role</th>
                  <th className="px-6 py-5">Node Identity</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right flex items-center justify-end gap-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-6">
                       <div className="text-sm font-black text-white">{u.first_name} {u.last_name}</div>
                       <div className="text-xs text-gray-500 lowercase">{u.email}</div>
                    </td>
                    <td className="px-6 py-6">
                       <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight ${
                          u.role === 'admin' ? 'bg-brand-accent-green/10 text-brand-accent-green' : 
                          u.role === 'medical_practitioner' ? 'bg-brand-purple/10 text-brand-purple' :
                          'bg-white/5 text-gray-500'
                       }`}>{u.role.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-6">
                       <div className="flex items-center gap-3">
                          <code className="text-xs font-black text-brand-neon-green/80 font-mono tracking-widest bg-brand-neon-green/5 px-3 py-1.5 rounded-lg border border-brand-neon-green/10">
                            {u.unique_access_id ?? 'UNINITIALIZED'}
                          </code>
                          <button 
                            disabled={processingId === u.id}
                            onClick={() => handleReissueId(u.id)}
                            title="Reissue Access ID (Invalidates old ID)"
                            className="p-2 bg-white/5 hover:bg-brand-neon-green hover:text-brand-dark rounded-xl transition-all group/btn"
                          >
                             {processingId === u.id ? <RefreshCw size={14} className="animate-spin" /> : <KeyRound size={14} />}
                          </button>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                       <div className={`text-[10px] font-black uppercase tracking-[0.1em] px-3 py-1.5 rounded-full border inline-flex items-center gap-2 ${
                         u.status === 'authorized' ? 'bg-brand-dark/50 text-brand-neon-green border-brand-neon-green' : 
                         u.status === 'pending' ? 'bg-brand-dark/50 text-yellow-500 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 
                         'bg-brand-dark/50 text-red-500 border-red-500'
                       }`}>
                          {u.status === 'authorized' ? <CheckCircle2 size={12} /> : u.status === 'pending' ? <Clock size={12} className="animate-pulse" /> : <XCircle size={12} />}
                          {u.status}
                       </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                       <div className="flex justify-end gap-2">
                         {u.role !== 'admin' && (
                           <select 
                             className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-gray-400 focus:outline-none focus:text-white transition-all appearance-none text-right cursor-pointer"
                             value={u.status} 
                             onChange={(e) => handleUpdateStatus(u.id, e.target.value as Profile['status'])} 
                             disabled={updatingStatus === u.id}
                           >
                             <option value="pending" className="bg-brand-dark">Pending</option>
                             <option value="authorized" className="bg-brand-dark">Authorize</option>
                             <option value="revoked" className="bg-brand-dark">Revoke</option>
                           </select>
                         )}
                         <button className="p-2 text-gray-700 hover:text-white transition-colors">
                           <MoreVertical size={16} />
                         </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  )
}
