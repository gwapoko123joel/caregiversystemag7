import { supabase } from '../lib/supabaseClient';
import type { UserProfile, UserRole, AvailabilityStatus, ShiftStatus } from '../lib/supabaseClient';

export interface ProfileStats {
  patients_monitored?: number;
  active_alerts?: number;
  resolved_alerts?: number;
  total_reports?: number;
  last_report_date?: string;
  total_users?: number;
  security_alerts?: number;
  avg_response_time?: string;
}

/**
 * Normalizes a role string to snake_case for DB constraints.
 * Example: "Medical Practitioner" -> "medical_practitioner"
 */
function normalizeRole(role: string): UserRole {
  const normalized = role.toLowerCase().trim().replace(/\s+/g, '_');
  // Validate against known roles, default to caregiver if unknown
  const validRoles: UserRole[] = ['admin', 'medical_practitioner', 'caregiver', 'practitioner'];
  return validRoles.includes(normalized as UserRole) ? (normalized as UserRole) : 'caregiver';
}

/**
 * Ensures a user profile exists. Called after every successful login.
 * If no profile exists, it creates one with defaults based on role.
 */
export async function ensureUserProfile(user: any, rawRole: string): Promise<{ data: UserProfile | null; error: any }> {
  if (!user || !user.id) return { data: null, error: 'No user provided' };

  const role = normalizeRole(rawRole);
  console.log('[ProfileService] Ensuring profile for UID:', user.id, 'with role:', role);

  // 1. Check if profile already exists
  const { data: existingProfile, error: fetchError } = await supabase
    .from('system_users')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (fetchError) {
    console.error('[ProfileService] Error fetching profile:', fetchError);
    return { data: null, error: fetchError };
  }

  // 2. If profile exists, update last_login (if column exists) or just return
  if (existingProfile) {
    console.log('[ProfileService] Profile exists, updating metadata...');
    const { data: updatedProfile, error: updateError } = await supabase
      .from('system_users')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('[ProfileService] Error updating profile:', updateError);
      return { data: existingProfile as unknown as UserProfile, error: updateError };
    }
    return { data: updatedProfile as unknown as UserProfile, error: null };
  }

  // 3. If no profile exists, create a new one
  console.log('[ProfileService] No profile found, creating new entry...');
  const accessId = generateAccessId(role);
  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User';

  const newProfile = {
    user_id: user.id,
    email: user.email || '',
    full_name: fullName,
    role: role, 
    access_id: accessId,
    status: 'authorized',
    is_active: true,
  };

  const { data: createdProfile, error: createError } = await supabase
    .from('system_users')
    .insert(newProfile)
    .select()
    .single();

  if (createError) {
    console.error('[ProfileService] Error creating profile:', createError);
    return { data: null, error: createError };
  }

  console.log('[ProfileService] New profile created successfully:', createdProfile.access_id);
  return { data: createdProfile as UserProfile, error: null };
}

/**
 * Generates an Access ID based on the user's role.
 * Format: ROLE_PREFIX-XXXX (random 4-digit number)
 */
function generateAccessId(role: UserRole): string {
  const prefixMap: Record<string, string> = {
    admin: 'ADMIN',
    medical_practitioner: 'MP',
    practitioner: 'MP',
    caregiver: 'CG',
  };
  const prefix = prefixMap[role] || 'USR';
  const randomNum = String(Math.floor(1000 + Math.random() * 9000));
  return `${prefix}-${randomNum}`;
}

/**
 * Fetches the current user's profile, or creates it if missing.
 */
export async function ensureAndGetProfile(): Promise<{ data: UserProfile | null; error: any }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'No active session found' };

  // 1. Try to fetch
  const { data, error } = await supabase
    .from('system_users')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!error && data) return { data: data as UserProfile, error: null };

  // 2. If missing, we need the role. We'll check the metadata or the caregivers table
  console.log('[ProfileService] Profile missing for active session, attempting recovery...');
  
  const { data: legacy } = await supabase
    .from('caregivers')
    .select('role, email')
    .eq('id', user.id)
    .maybeSingle();

  const role = legacy?.role || user.user_metadata?.role || 'caregiver';
  return await ensureUserProfile(user, role);
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('system_users')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[ProfileService] Error fetching profile:', error);
    return null;
  }
  return data as UserProfile;
}

/**
 * Updates the current user's profile with partial data.
 */
export async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('system_users')
    .update(updates)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('[ProfileService] Error updating profile:', error);
    return null;
  }
  return data as UserProfile;
}

/**
 * Fetches real-time analytics for the profile page based on role.
 */
export async function getProfileStats(profile: UserProfile): Promise<ProfileStats> {
  const stats: ProfileStats = {};

  try {
    if (profile.role === 'practitioner' || profile.role === 'medical_practitioner') {
      // Practitioner Stats
      const { count: patients } = await supabase.from('patients').select('*', { count: 'exact', head: true });
      const { count: alerts } = await supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('is_acknowledged', false);
      const { count: resolved } = await supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('is_acknowledged', true);
      
      stats.patients_monitored = patients || 0;
      stats.active_alerts = alerts || 0;
      stats.resolved_alerts = resolved || 0;
      stats.avg_response_time = '4.2m'; // Placeholder for complex calc
    } else if (profile.role === 'caregiver') {
      // Caregiver Stats
      const { count: reports } = await supabase.from('patient_monitoring_logs').select('*', { count: 'exact', head: true }).eq('caregiver_id', profile.user_id);
      const { data: lastReport } = await supabase.from('patient_monitoring_logs').select('recorded_at').eq('caregiver_id', profile.user_id).order('recorded_at', { ascending: false }).limit(1).maybeSingle();
      
      stats.total_reports = reports || 0;
      stats.last_report_date = lastReport?.recorded_at;
    } else if (profile.role === 'admin') {
      // Admin Stats
      const { count: users } = await supabase.from('system_users').select('*', { count: 'exact', head: true });
      const { count: security } = await supabase.from('activity_logs').select('*', { count: 'exact', head: true }).like('action', '%SECURITY%');
      
      stats.total_users = users || 0;
      stats.security_alerts = security || 0;
    }
  } catch (err) {
    console.error('[ProfileService] Error fetching stats:', err);
  }

  return stats;
}
