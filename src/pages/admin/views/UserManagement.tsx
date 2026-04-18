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
import { SkeletonRow, EmptyState } from '../../../components/ClinicalPolish'

/**
 * Generate a random 6-character uppercase alphanumeric string for access IDs.
 */
function generateAccessId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function UserManagement() {
  const { users, user, profile, loadUsers, loadLogs, isLoading } = useOutletContext<AdminDashboardContextType>()
  
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

    const { error } = await supabase
      .from('caregivers')
      .insert({
        ...newUser,
        status: 'pending'
      })

    if (!error) {
      setShowAddUser(false)
      setNewUser({ first_name: '', last_name: '', email: '', role: 'caregiver', access_id: '' })
      await loadUsers()
    } else {
      alert(error.message)
    }
  }

  const filteredUsers = users.filter(u => 
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.unique_access_id?.toLowerCase().includes(searchUser.toLowerCase())
  )

  if (isLoading && users.length === 0) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="h-12 w-full md:w-64 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
        <div className="bg-card border border-card-border rounded-[32px] overflow-hidden">
          <table className="w-full">
            <tbody className="divide-y divide-card-border">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-text-muted group-focus-within:text-sky-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search personnel by name, email, or ID..." 
            className="w-full pl-12 pr-6 py-4 bg-card border border-card-border rounded-2xl text-text-main focus:outline-none focus:border-sky-500 transition-all font-medium text-sm shadow-sm placeholder:text-sidebar-text-muted/50"
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
          />
        </div>

        <button 
          onClick={() => setShowAddUser(true)}
          className="w-full md:w-auto px-8 py-4 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-sky-500/20 active:scale-95"
        >
          <Plus size={18} /> Provision Personnel
        </button>
      </div>

      <div className="bg-card border border-card-border rounded-[32px] overflow-hidden shadow-sm transition-colors">
        {/* Users Table (Desktop) */}
        {filteredUsers.length === 0 ? (
          <EmptyState 
            title="Personnel Not Found"
            message={searchUser ? `No results for "${searchUser}" across the administrative node.` : "No personnel have been provisioned in the system yet."}
            onRetry={loadUsers}
            icon={Search}
          />
        ) : (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] font-black text-sidebar-text-muted uppercase tracking-[0.2em] bg-card border-b border-card-border transition-colors">
                  <th className="px-6 py-6">Identity & Credentials</th>
                  <th className="px-6 py-6">Unique Access Token</th>
                  <th className="px-6 py-6">Clearance Level</th>
                  <th className="px-6 py-6 text-right">Node Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border transition-colors">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center font-black text-sky-500 text-lg border border-card-border">
                          {u.first_name?.[0]}{u.last_name?.[0]}
                        </div>
                        <div>
                          <div className="text-sm font-black text-text-main uppercase tracking-tight">{u.first_name} {u.last_name}</div>
                          <div className="text-xs text-sidebar-text-muted mt-0.5">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                        <div className="flex items-center gap-3">
                           <code className="text-[12px] font-black text-sky-500 font-mono tracking-widest bg-sky-500/5 px-3 py-1.5 rounded-xl border border-sky-500/20 shadow-sm">
                             {u.unique_access_id ?? 'UNINITIALIZED'}
                           </code>
                           <button 
                             disabled={processingId === u.id}
                             onClick={() => handleReissueId(u.id)}
                             title="Reissue Security Token"
                             className="p-2 text-sidebar-text-muted hover:text-sky-500 hover:bg-sky-500/10 rounded-xl transition-all active:scale-90"
                           >
                              {processingId === u.id ? <RefreshCw size={14} className="animate-spin" /> : <KeyRound size={14} />}
                           </button>
                        </div>
                    </td>
                    <td className="px-6 py-6">
                        <div className={`text-[10px] font-black uppercase tracking-[0.1em] px-3 py-1.5 rounded-full border inline-flex items-center gap-2 transition-all ${
                          u.status === 'authorized' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                          u.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                          'bg-red-500/10 text-red-500 border-red-500/20'
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
                               <option value="pending">Pending</option>
                               <option value="authorized">Authorize</option>
                               <option value="revoked">Revoke</option>
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
        )}

        {/* Users Card List (Mobile) */}
        {!isLoading && filteredUsers.length > 0 && (
          <div className="md:hidden space-y-4 p-4">
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
                        'bg-slate-100 dark:bg-white/5 text-sidebar-text-muted'
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
                          'bg-red-500/10 text-red-500 border-red-500/20'
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
        )}
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowAddUser(false)} />
          <div className="relative w-full max-w-lg bg-card border border-card-border rounded-[40px] p-8 shadow-2xl animate-in zoom-in duration-300 transition-colors">
            <h3 className="text-2xl font-black text-text-main uppercase tracking-tight mb-2 transition-colors">Provision New Personnel</h3>
            <p className="text-sidebar-text-muted font-bold text-xs uppercase tracking-widest mb-8 transition-colors">Grant secure node access to credentials</p>
            
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest ml-1 transition-colors">First Name</label>
                     <input 
                       type="text" 
                       className="w-full px-5 py-4 bg-primary/50 border border-card-border rounded-2xl text-text-main focus:outline-none focus:border-sky-500 transition-all font-medium text-sm transition-colors"
                       placeholder="e.g. Maria"
                       value={newUser.first_name}
                       onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest ml-1 transition-colors">Last Name</label>
                     <input 
                       type="text" 
                       className="w-full px-5 py-4 bg-primary/50 border border-card-border rounded-2xl text-text-main focus:outline-none focus:border-sky-500 transition-all font-medium text-sm transition-colors"
                       placeholder="e.g. Santos"
                       value={newUser.last_name}
                       onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest ml-1 transition-colors">Email Instance</label>
                  <input 
                    type="email" 
                    className="w-full px-5 py-4 bg-primary/50 border border-card-border rounded-2xl text-text-main focus:outline-none focus:border-sky-500 transition-all font-medium text-sm transition-colors"
                    placeholder="name@bantayancare.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest ml-1 transition-colors">Network Role</label>
                  <select 
                    className="w-full px-5 py-4 bg-primary/50 border border-card-border rounded-2xl text-text-main focus:outline-none focus:border-sky-500 transition-all font-medium text-sm appearance-none cursor-pointer transition-colors"
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                  >
                    <option value="caregiver">Caregiver — Field Operations</option>
                    <option value="medical_practitioner">Medical Practitioner — Clinical Node</option>
                    <option value="admin">Administrator — Network Governance</option>
                  </select>
               </div>
            </div>

            <div className="flex gap-3 mt-10">
               <button 
                 onClick={() => setShowAddUser(false)}
                 className="flex-1 py-4 text-xs font-black text-sidebar-text-muted uppercase tracking-widest hover:text-text-main transition-all"
               >
                 Abort Provisioning
               </button>
               <button 
                 onClick={handleProvisionUser}
                 className="flex-[2] py-4 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-sky-500/20 active:scale-95"
               >
                 Commit to Network
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
