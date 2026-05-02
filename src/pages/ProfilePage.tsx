import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Camera, Save, AlertCircle, User as UserIcon, Mail, Phone,
  MapPin, Calendar, Briefcase,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { ProfileAvatar } from '../components/profile/ProfileAvatar';
import { CaregiverProfileSection } from './profile/sections/CaregiverProfileSection';
import { PractitionerProfileSection } from './profile/sections/PractitionerProfileSection';
import { AdminProfileSection } from './profile/sections/AdminProfileSection';
import { ProfileStatsSection } from './profile/sections/ProfileStatsSection';
import type { Caregiver } from '../types/database';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Caregiver | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<Partial<Caregiver>>({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('caregivers')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfile(data);
      setFormData(data);
    }
    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File too large. Maximum 2MB.');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      // Handle cache busting properly
      const cacheBustedUrl = publicUrl.includes('?') 
        ? `${publicUrl}&t=${Date.now()}` 
        : `${publicUrl}?t=${Date.now()}`;

      await supabase.from('caregivers')
        .update({ profile_picture_url: cacheBustedUrl })
        .eq('id', profile.id);

      await supabase.from('activity_logs').insert({
        user_id: profile.id,
        action: 'profile_picture_updated',
        timestamp: new Date().toISOString()
      });

      setProfile({ ...profile, profile_picture_url: cacheBustedUrl });
      setFormData({ ...formData, profile_picture_url: cacheBustedUrl });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);

    try {
      // Build role-specific update payload
      const baseUpdate = {
        full_name: formData.full_name,
        bio: formData.bio,
        contact_number: formData.contact_number,
        phone: formData.contact_number, // Sync with phone column
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        address: formData.address,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_number: formData.emergency_contact_number,
        years_of_experience: formData.years_of_experience,
        languages_spoken: formData.languages_spoken,
      };

      let roleUpdate: any = {};
      
      if (profile.role === 'caregiver') {
        roleUpdate = {
          bhw_id_number: formData.bhw_id_number,
          shift_schedule: formData.shift_schedule,
          coverage_area: formData.coverage_area,
          assigned_barangay: formData.assigned_barangay,
        };
      } else if (profile.role === 'admin') {
        roleUpdate = {
          admin_level: formData.admin_level,
          department: formData.department,
          office_phone: formData.office_phone,
          jurisdiction: formData.jurisdiction,
          appointment_date: formData.appointment_date,
        };
      }

      const { error } = await supabase
        .from('caregivers')
        .update({ ...baseUpdate, ...roleUpdate })
        .eq('id', profile.id);

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        user_id: profile.id,
        action: 'profile_updated',
        timestamp: new Date().toISOString()
      });

      await loadProfile();
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const displayName = profile.full_name || `${profile.first_name} ${profile.last_name}`;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/5 border border-cyan-500/15 rounded-2xl p-8">
        <h1 className="text-2xl font-light tracking-[0.2em] uppercase text-white mb-2">
          My Profile
        </h1>
        <p className="text-sm font-light text-white/60">
          {profile.role === 'caregiver' && 'Manage your caregiver information and field assignments'}
          {(profile.role === 'medical_practitioner' || profile.role === 'practitioner') && 'Manage your medical credentials and contact information'}
          {profile.role === 'admin' && 'Manage your administrative authority and system access'}
        </p>
      </div>

      {/* Profile completion */}
      {(profile.profile_completion_percentage || 0) < 100 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-amber-500/10 border border-amber-500/20 
                   rounded-xl p-4 flex items-center gap-4"
        >
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" strokeWidth={1.5} />
          <div className="flex-1">
            <p className="text-sm font-light text-white">
              Profile {profile.profile_completion_percentage || 0}% complete
            </p>
            <div className="w-full bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${profile.profile_completion_percentage || 0}%` }}
                className="h-full bg-gradient-to-r from-amber-400 to-cyan-400"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Avatar section */}
      <div className="backdrop-blur-xl bg-white/5 border border-cyan-500/15 rounded-2xl p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <ProfileAvatar 
              src={profile.profile_picture_url} 
              fullName={displayName}
              size="2xl"
            />
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-1 right-1 w-10 h-10 rounded-full
                       bg-cyan-500 hover:bg-cyan-400 cursor-pointer
                       flex items-center justify-center
                       border-2 border-[#000814] transition-colors"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-white" strokeWidth={1.5} />
              )}
            </label>
            <input
              id="avatar-upload" type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarUpload}
              className="hidden" disabled={uploading}
            />
          </div>
          
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-xl font-light text-white mb-1">{displayName}</h2>
            <p className="text-sm font-light tracking-wider uppercase text-cyan-300/80 mb-1">
              {profile.role.replace('_', ' ')}
            </p>
            <p className="text-xs font-light text-white/50">
              {profile.email}
            </p>
            {profile.role === 'caregiver' && profile.assigned_barangay && (
              <p className="text-xs font-light text-cyan-300/60 mt-2">
                📍 Assigned to Barangay {profile.assigned_barangay}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Activity stats */}
      <ProfileStatsSection userId={profile.id} role={profile.role} />

      {/* Shared personal information */}
      <SharedPersonalInfoSection 
        formData={formData} 
        setFormData={setFormData}
        userEmail={profile.email}
      />

      {/* Role-specific sections */}
      {profile.role === 'caregiver' && (
        <CaregiverProfileSection formData={formData} setFormData={setFormData} />
      )}
      
      {(profile.role === 'medical_practitioner' || profile.role === 'practitioner') && (
        <PractitionerProfileSection caregiverId={profile.id} />
      )}
      
      {profile.role === 'admin' && (
        <AdminProfileSection formData={formData} setFormData={setFormData} />
      )}

      {/* Emergency contact (shared) */}
      <EmergencyContactSection formData={formData} setFormData={setFormData} />

      {/* Save button */}
      <div className="flex justify-end gap-3 sticky bottom-6 z-10">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400
                   disabled:opacity-50 text-white font-light tracking-wider 
                   uppercase text-sm flex items-center gap-2 transition-colors 
                   min-h-[44px] shadow-lg shadow-cyan-500/30"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" strokeWidth={1.5} />
          )}
          Save Changes
        </button>
      </div>
    </div>
  );
}

// Sub-component: Shared personal info (used by all roles)
function SharedPersonalInfoSection({ formData, setFormData, userEmail }: any) {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-cyan-500/15 rounded-2xl p-8">
      <h3 className="text-sm font-light tracking-[0.2em] uppercase text-cyan-300 mb-6">
        Personal Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Full Name" icon={UserIcon}
          value={formData.full_name || `${formData.first_name || ''} ${formData.last_name || ''}`.trim() || ''} 
          onChange={(v: string) => setFormData({ ...formData, full_name: v })} />
        <FormField label="Email" icon={Mail} value={userEmail || ''} disabled />
        <FormField label="Contact Number" icon={Phone}
          value={formData.contact_number || formData.phone || ''}
          onChange={(v: string) => setFormData({ ...formData, contact_number: v })}
          placeholder="+639XXXXXXXXX" />
        <FormField label="Date of Birth" icon={Calendar} type="date"
          value={formData.date_of_birth || ''}
          onChange={(v: string) => setFormData({ ...formData, date_of_birth: v })} />
        <FormSelect label="Gender" 
          value={formData.gender || ''}
          onChange={(v: string) => setFormData({ ...formData, gender: v })}
          options={['Male', 'Female', 'Other', 'Prefer not to say']} />
        <FormField label="Years of Experience" icon={Briefcase} type="number"
          value={formData.years_of_experience?.toString() || ''}
          onChange={(v: string) => setFormData({ ...formData, years_of_experience: parseInt(v) || 0 })} />
        <div className="md:col-span-2">
          <FormField label="Address" icon={MapPin}
            value={formData.address || ''}
            onChange={(v: string) => setFormData({ ...formData, address: v })}
            placeholder="Sitio, Barangay, Municipality, Province" />
        </div>
      </div>
      <div className="mt-6">
        <label className="block text-xs font-light tracking-wider uppercase text-cyan-300/80 mb-2">
          Bio
        </label>
        <textarea
          value={formData.bio || ''}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          rows={3}
          placeholder="Brief description about yourself..."
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-cyan-500/15
                   text-white font-light placeholder:text-white/30
                   focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.07]
                   transition-colors"
        />
      </div>
    </div>
  );
}

function EmergencyContactSection({ formData, setFormData }: any) {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-cyan-500/15 rounded-2xl p-8">
      <h3 className="text-sm font-light tracking-[0.2em] uppercase text-cyan-300 mb-6">
        Emergency Contact
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Contact Name" icon={UserIcon}
          value={formData.emergency_contact_name || ''}
          onChange={(v: string) => setFormData({ ...formData, emergency_contact_name: v })} />
        <FormField label="Contact Number" icon={Phone}
          value={formData.emergency_contact_number || ''}
          onChange={(v: string) => setFormData({ ...formData, emergency_contact_number: v })}
          placeholder="+639XXXXXXXXX" />
      </div>
    </div>
  );
}

// Reusable form helpers
export function FormField({ label, icon: Icon, value, onChange, type = 'text', placeholder, disabled }: any) {
  return (
    <div>
      <label className="block text-xs font-light tracking-wider uppercase text-cyan-300/80 mb-2">
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-300/60" 
                       strokeWidth={1.5} />}
        <input
          type={type} value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder} disabled={disabled}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 rounded-xl 
                    bg-white/5 border border-cyan-500/15
                    text-white font-light placeholder:text-white/30
                    focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.07]
                    disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
        />
      </div>
    </div>
  );
}

export function FormSelect({ label, value, onChange, options }: any) {
  return (
    <div>
      <label className="block text-xs font-light tracking-wider uppercase text-cyan-300/80 mb-2">
        {label}
      </label>
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-cyan-500/15
                 text-white font-light focus:outline-none focus:border-cyan-500/40 transition-colors
                 appearance-none"
      >
        <option value="" className="bg-[#000814]">Select...</option>
        {options.map((opt: string) => (
          <option key={opt} value={opt} className="bg-[#000814]">{opt}</option>
        ))}
      </select>
    </div>
  );
}
