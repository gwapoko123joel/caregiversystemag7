import { useState } from 'react'
import {
  Search, Plus, KeyRound, RefreshCw,
  MoreVertical, CheckCircle2, XCircle, Clock,
  ShieldCheck, Loader2
} from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import type { AdminDashboardContextType } from '../AdminDashboard'
import type { Profile } from '../../../types/database'
import { SkeletonRow, EmptyState } from '../../../components/ClinicalPolish'

/**
 * Generate a random 4-digit number for access IDs.
 */
function generateAccessId(role: string): string {
  const prefix = role === 'caregiver' ? 'CG' : 'MP';
  const random = Math.floor(1000 + Math.random() * 9000); // 4 random digits
  return `${prefix}-${random}`;
}

export default function UserManagement() {
  const { users, user, profile, loadUsers, loadLogs, isLoading } = useOutletContext<AdminDashboardContextType>()

  // State
  const [searchUser, setSearchUser] = useState('')
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    role: 'caregiver' as Profile['role'],
    access_id: ''
  })

  const [editingId, setEditingId] = useState<{ id: string, value: string } | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Handlers
  async function handleUpdateStatus(userId: string, newStatus: Profile['status']) {
    setUpdatingStatus(userId)

    // Build payload: only update status and is_active
    const payload: Record<string, any> = {
      status: newStatus,
      is_active: newStatus === 'authorized',
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
        details: { target_user: userId, status: newStatus }
      })
      await loadUsers()
      await loadLogs()
    } else {
      console.error("Failed to update status:", error)
      alert("Error updating status: " + error.message) // Added alert so we can see if it fails!
    }

    setUpdatingStatus(null)
  }

  async function handleRotateKey(userId: string, role: string, name: string) {
    const newId = generateAccessId(role)

    if (!confirm(`Rotate Access Key for ${name}?\n\nNew Key will be: ${newId}\nThe old key will stop working immediately.`)) return

    setProcessingId(userId)
    try {
      const { error } = await supabase
        .from('caregivers')
        .update({ unique_access_id: newId })
        .eq('id', userId)

      if (error) throw error

      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        user_type: profile?.role ?? 'admin',
        action: 'KEY_ROTATION',
        details: { target_user: name, new_token: newId }
      })

      alert("Key rotated successfully.")
      await loadUsers()
      await loadLogs()
    } catch (err: any) {
      alert("Rotation failed: " + err.message)
    } finally {
      setProcessingId(null)
    }
  }

  async function handleManualIdUpdate() {
    const currentEdit = editingId
    if (!currentEdit) return

    setProcessingId(currentEdit.id)
    const { error } = await supabase
      .from('caregivers')
      .update({ unique_access_id: currentEdit.value.trim().toUpperCase() })
      .eq('id', currentEdit.id)

    if (!error) {
      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        user_type: profile?.role ?? 'admin',
        action: 'MANUAL_ACCESS_ID_UPDATE',
        details: { target_user: currentEdit.id, new_id: currentEdit.value }
      })
      await loadUsers()
      await loadLogs()
      setEditingId(null)
    } else {
      alert(error.message)
    }
    setProcessingId(null)
  }

  async function handleIssueNewKey() {
    if (!newUser.full_name) {
      alert('Please provide full name.')
      return
    }

    setSubmitting(true)
    const newAccessId = generateAccessId(newUser.role)

    // Split full_name into first_name + last_name (caregivers table requires both)
    const nameParts = newUser.full_name.trim().split(/\s+/)
    const first_name = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0] || 'Unknown'
    const last_name = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '-'

    try {
      const { error } = await supabase
        .from('caregivers')
        .insert({
          first_name,
          last_name,
          email: newUser.email.trim() || null, 
          role: newUser.role,
          unique_access_id: newAccessId,
          status: 'pending',
          is_active: false
        })

      if (error) throw error

      alert(`ACCESS KEY ISSUED\n\nPersonnel: ${newUser.full_name}\nKey: ${newAccessId}\n\nProvide this key to the staff member to complete registration.`);
      
      setNewUser({ full_name: '', email: '', role: 'caregiver' as Profile['role'], access_id: '' })
      setShowAddUser(false)
      await loadUsers()
      
    } catch (err: any) {
      alert("Issue failed: " + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredUsers = (users as any[]).filter(u =>
    u.full_name?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.access_id?.toLowerCase().includes(searchUser.toLowerCase())
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
          <Plus size={18} /> Issue Access Key
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
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center font-black text-sky-500 text-lg border border-card-border uppercase">
                          {u.full_name?.[0] || u.email?.[0] || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-black text-text-main uppercase tracking-tight">{u.full_name || 'Unnamed User'}</div>
                          <div className="text-xs text-sidebar-text-muted mt-0.5">{u.email || 'Unregistered'}</div>
                          {(u.prc_license || u.bhw_id) && (
                            <div className="text-[10px] text-sky-400 mt-1.5 font-mono tracking-widest bg-sky-500/10 inline-flex items-center px-2 py-0.5 rounded border border-sky-500/20">
                              <ShieldCheck size={10} className="mr-1" />
                              {u.prc_license ? `PRC: ${u.prc_license}` : `BHW: ${u.bhw_id}`}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        {editingId?.id === u.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              className="text-[12px] font-black text-sky-500 font-mono tracking-widest bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-sky-500 shadow-inner w-32 focus:outline-none"
                              value={editingId?.value || ''}
                              onChange={(e) => {
                                if (editingId) {
                                  setEditingId({ id: editingId.id, value: e.target.value.toUpperCase() })
                                }
                              }}
                              autoFocus
                              onKeyDown={(e) => e.key === 'Enter' && handleManualIdUpdate()}
                            />
                            <button
                              onClick={handleManualIdUpdate}
                              className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <code
                              className="text-[12px] font-black text-sky-500 font-mono tracking-widest bg-sky-500/5 px-3 py-1.5 rounded-xl border border-sky-500/20 shadow-sm cursor-pointer hover:bg-sky-500/10 transition-all"
                              onClick={() => setEditingId({ id: u.id, value: u.access_id || '' })}
                              title="Click to edit Access ID"
                            >
                              {u.access_id ?? 'UNINITIALIZED'}
                            </code>
                            <button
                              disabled={processingId === u.id}
                              onClick={() => handleRotateKey(u.id, u.role, u.full_name)}
                              title="Regenerate Key"
                              className="p-2 text-sidebar-text-muted hover:text-sky-500 hover:bg-sky-500/10 rounded-xl transition-all active:scale-90"
                            >
                              {processingId === u.id ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className={`text-[10px] font-black uppercase tracking-[0.1em] px-3 py-1.5 rounded-full border inline-flex items-center gap-2 transition-all ${u.status === 'authorized' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
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
                              <option value="suspended">Suspend</option>
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
                    <div className="text-base font-black text-text-main uppercase tracking-tight">{u.full_name}</div>
                    <div className="text-xs text-sidebar-text-muted">{u.email}</div>
                    {(u.prc_license || u.bhw_id) && (
                      <div className="text-[10px] text-sky-400 mt-1.5 font-mono tracking-widest bg-sky-500/10 inline-flex items-center px-2 py-0.5 rounded border border-sky-500/20">
                        <ShieldCheck size={10} className="mr-1" />
                        {u.prc_license ? `PRC: ${u.prc_license}` : `BHW: ${u.bhw_id}`}
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight ${u.role === 'admin' ? 'bg-cyan-500/10 text-cyan-400' :
                      u.role === 'medical_practitioner' ? 'bg-sky-500/10 text-sky-400' :
                        'bg-slate-100 dark:bg-white/5 text-sidebar-text-muted'
                    }`}>{u.role.replace('_', ' ')}</span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-primary/50 rounded-2xl border border-card-border">
                    <code className="text-xs font-black text-sky-500 font-mono tracking-widest px-2">
                      {u.access_id ?? 'UNINITIALIZED'}
                    </code>
                    <div className="flex gap-1">
                      <button
                        disabled={processingId === u.id}
                        onClick={() => handleRotateKey(u.id, u.role, u.full_name)}
                        className="p-2 bg-card text-sidebar-text-muted hover:bg-sky-500 hover:text-white rounded-xl transition-all"
                      >
                        {processingId === u.id ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className={`text-[10px] font-black uppercase tracking-[0.1em] px-3 py-1.5 rounded-full border inline-flex items-center gap-2 transition-all ${u.status === 'authorized' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
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
                        <option value="suspended">Suspend</option>
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
            <h3 className="text-2xl font-black text-text-main uppercase tracking-tight mb-2 transition-colors">Issue Access Key</h3>
            <p className="text-sidebar-text-muted font-bold text-xs uppercase tracking-widest mb-8 transition-colors">GRANT SECURE NETWORK ACCESS TO NEW STAFF</p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest ml-1 transition-colors">Full Name</label>
                <input
                  type="text"
                  className="w-full px-5 py-4 bg-primary/50 border border-card-border rounded-2xl text-text-main focus:outline-none focus:border-sky-500 transition-all font-medium text-sm transition-colors"
                  placeholder="e.g. Maria Santos"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest ml-1 transition-colors">Email Instance (Optional)</label>
                <input
                  type="email"
                  className="w-full px-5 py-4 bg-primary/50 border border-card-border rounded-2xl text-text-main focus:outline-none focus:border-sky-500 transition-all font-medium text-sm transition-colors"
                  placeholder="name@bantayancare.com (Optional)"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-sidebar-text-muted uppercase tracking-widest ml-1 transition-colors">Network Role</label>
                <select
                  className="w-full px-5 py-4 bg-primary/50 border border-card-border rounded-2xl text-text-main focus:outline-none focus:border-sky-500 transition-all font-medium text-sm appearance-none cursor-pointer transition-colors"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
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
                onClick={handleIssueNewKey}
                disabled={submitting}
                className="flex-[2] py-4 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-sky-500/20 active:scale-95"
              >
                {submitting ? <Loader2 className="animate-spin mx-auto" /> : 'Commit to Network'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}