import { useState } from 'react'
import {
  Search, Plus, KeyRound, RefreshCw,
  MoreVertical, CheckCircle2, XCircle, Clock,
  ShieldCheck, Loader2, ShieldAlert
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

  // Handle Rejection (For Pending slots)
  async function handleReject(userId: string, name: string) {
    if (!confirm(`Are you sure you want to REJECT and delete the access slot for ${name}?`)) return;

    const { error } = await supabase.from('caregivers').delete().eq('id', userId);

    if (!error) {
      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        user_type: profile?.role ?? 'admin',
        action: 'PERSONNEL_REJECTED',
        details: { target: name }
      });
      await loadUsers();
      await loadLogs();
    }
  }

  // Handle Revocation (For Authorized users)
  async function handleRevoke(userId: string, name: string) {
    if (!confirm(`WARNING: You are about to REVOKE network access for ${name}. They will be forced to log out immediately. Proceed?`)) return;

    const { error } = await supabase
      .from('caregivers')
      .update({ status: 'pending', is_active: false })
      .eq('id', userId);

    if (!error) {
      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        user_type: profile?.role ?? 'admin',
        action: 'ACCESS_REVOKED',
        details: { target: name }
      });
      await loadUsers();
      await loadLogs();
    }
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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* ── HEADER & SEARCH ACTION BAR ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shadow-[0_0_10px_#0ea5e9]" />
            <span className="text-[10px] font-black text-sky-500 uppercase tracking-[0.4em]">Governance: Identity Hub</span>
          </div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
            Personnel <span className="text-sky-500">Manager</span>
          </h2>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-2">
            Provisioning, Access Governance, & Policy Enforcement
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative group w-full sm:w-80">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search personnel by name, email, or ID..."
              className="w-full bg-slate-900/60 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-700"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddUser(true)}
            className="w-full sm:w-auto px-8 py-4 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-sky-500/20 active:scale-95 flex items-center justify-center gap-3"
          >
            <Plus size={18} /> Issue Access Key
          </button>
        </div>
      </div>

      {/* ── PERSONNEL ROSTER GRID ── */}
      <div className="space-y-4">
        {/* Table Headers (Visible on Desktop) */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
          <div className="col-span-4">Identity & Credentials</div>
          <div className="col-span-3 text-center">Unique Access Token</div>
          <div className="col-span-2 text-center">Clearance Level</div>
          <div className="col-span-3 text-right">Node Controls</div>
        </div>

        {isLoading && users.length === 0 ? (
          <div className="py-20 text-center opacity-40">
             <Loader2 className="animate-spin text-sky-500 mx-auto" size={32} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            title="Personnel Not Found"
            message={searchUser ? `No results for "${searchUser}" across the administrative node.` : "No personnel have been provisioned in the system yet."}
            onRetry={loadUsers}
            icon={Search}
          />
        ) : (
          filteredUsers.map((u) => (
            <div 
              key={u.id}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[32px] p-6 lg:px-8 hover:bg-slate-900/60 transition-all group shadow-xl"
            >
              {/* 1. Identity */}
              <div className="col-span-4 flex items-center gap-5">
                <div className="w-14 h-14 bg-sky-500/10 rounded-[1.5rem] flex items-center justify-center text-sky-500 border border-sky-500/20 font-black text-xl group-hover:scale-110 transition-transform duration-500">
                  {u.full_name?.[0] || 'U'}
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-white uppercase tracking-tight">{u.full_name || 'Unregistered Node'}</h4>
                  <p className="text-[10px] text-slate-500 font-bold lowercase leading-none mb-2">{u.email || 'pending_assignment@bantayan.node'}</p>
                  <div className="flex items-center gap-2">
                     <span className="text-[8px] font-black px-2 py-0.5 bg-white/5 rounded border border-white/10 text-slate-400 uppercase">
                       {u.role.replace('_', ' ')}
                     </span>
                     {(u.prc_license || u.bhw_id) && (
                       <div className="flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase tracking-tighter">
                          <ShieldCheck size={10} /> {u.prc_license || u.bhw_id}
                       </div>
                     )}
                  </div>
                </div>
              </div>

              {/* 2. Access Token */}
              <div className="col-span-3 flex justify-center">
                 <div className="flex items-center gap-3 bg-slate-950/50 border border-white/5 rounded-2xl px-4 py-3 group-hover:border-sky-500/30 transition-all">
                    <span className="text-xs font-mono font-bold text-sky-400 tracking-wider">{u.access_id ?? u.unique_access_id}</span>
                    <button 
                      onClick={() => handleRotateKey(u.id, u.role, u.full_name)}
                      className="p-1.5 hover:bg-sky-500/20 text-slate-600 hover:text-sky-400 rounded-lg transition-all"
                      title="Rotate Token"
                      disabled={processingId === u.id}
                    >
                      {processingId === u.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    </button>
                 </div>
              </div>

              {/* 3. Status */}
              <div className="col-span-2 flex justify-center">
                 <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                   u.status === 'authorized' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                 }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'authorized' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{u.status}</span>
                 </div>
              </div>

              {/* 4. Controls */}
              <div className="col-span-3 flex items-center justify-end gap-2">
                
                {/* IF PENDING: Show Authorize & Reject */}
                {u.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus(u.id, 'authorized')}
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/10 active:scale-95 flex items-center gap-2"
                      disabled={updatingStatus === u.id}
                    >
                      {updatingStatus === u.id ? <Loader2 className="animate-spin" size={12} /> : <CheckCircle2 size={12} />} Authorize
                    </button>
                    <button 
                      onClick={() => handleReject(u.id, u.full_name)}
                      className="p-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl border border-rose-500/20 transition-all active:scale-95"
                      title="Reject & Delete Slot"
                    >
                      <XCircle size={16} />
                    </button>
                  </>
                )}

                {/* IF AUTHORIZED: Show Revoke */}
                {u.status === 'authorized' && (
                  <button 
                    onClick={() => handleRevoke(u.id, u.full_name)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/5 hover:border-rose-500/50 active:scale-95 flex items-center gap-2"
                  >
                    <ShieldAlert size={12} /> Revoke Access
                  </button>
                )}

                {/* Settings / More Button */}
                <button className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-500 rounded-xl transition-all">
                  <MoreVertical size={18} />
                </button>
              </div>

            </div>
          ))
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
  );
}