// src/types/database.ts

// ============================================================================
// USER & ROLE TYPES
// ============================================================================

/**
 * Canonical user roles. 
 * 
 * IMPORTANT: 'practitioner' is NOT valid. Always use 'medical_practitioner'.
 * The normalizeRole() helper in profileService.ts handles legacy aliases.
 */
export type UserRole = 'caregiver' | 'medical_practitioner' | 'admin';

export type RegistrationStatus =
  | 'pending_verification'
  | 'active'
  | 'inactive'
  | 'archived'
  | 'rejected';

export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';

export type AdminLevel = 'barangay_health_officer' | 'system_admin' | 'super_admin';

// ============================================================================
// AVAILABILITY & SHIFT TYPES (must come before UserProfile)
// ============================================================================

export type AvailabilityStatus =
  | 'available'
  | 'busy'
  | 'off_duty'
  | 'on_break'
  | 'in_consultation'
  | 'emergency_only'
  | 'on_call'
  | 'unavailable';

export type ShiftStatus = 'on_duty' | 'off_duty' | 'on_break' | 'emergency_responding';

// ============================================================================
// CAREGIVER (the unified user table)
// ============================================================================

export interface TrainingCertification {
  name: string;
  issuer: string;
  date_issued: string;
  expiry_date?: string;
  certificate_url?: string;
}

export interface Caregiver {
  id: string;
  unique_access_id: string;
  first_name: string;
  last_name: string;
  full_name?: string; // Generated column from first_name + last_name
  email: string | null;
  phone: string | null;
  contact_number?: string | null; // Generated column alias for phone
  role: UserRole;
  status: 'pending' | 'authorized' | 'revoked' | 'suspended' | 'rejected'; // Generated from is_active
  is_active: boolean;

  // Shared profile fields
  profile_picture_url?: string | null;
  bio?: string | null;
  date_of_birth?: string | null;
  gender?: Gender | null;
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_number?: string | null;
  years_of_experience?: number | null;
  languages_spoken?: string[];
  preferences?: Record<string, unknown>;
  profile_completion_percentage?: number;

  // Caregiver-specific
  assigned_barangay?: string | null;
  bhw_id_number?: string | null;
  training_certifications?: TrainingCertification[];
  supervising_practitioner_id?: string | null;
  shift_schedule?: string | null;
  coverage_area?: string[] | null;

  // Admin-specific
  admin_level?: AdminLevel | null;
  department?: string | null;
  office_phone?: string | null;
  jurisdiction?: string | null;
  appointment_date?: string | null;

  // Approval/rejection workflow (from migration)
  approved_at?: string | null;
  approved_by?: string | null;
  rejected_at?: string | null;
  rejected_by?: string | null;
  rejection_reason?: string | null;

  // Consent tracking (RA 10173)
  terms_accepted_at?: string | null;
  privacy_consent_at?: string | null;
  credentials_attestation_at?: string | null;
  prc_verification_authorized_at?: string | null;

  // Activity tracking
  last_login_at?: string | null;
  login_count?: number;

  // Registration metadata
  registration_ip?: string | null;
  registration_user_agent?: string | null;
  registered_via?: string | null;

  created_at: string;
  updated_at?: string;
}

// ============================================================================
// PROFILE (Caregiver alias used in AuthContext)
// ============================================================================

/**
 * Profile is what the AuthContext exposes. It's essentially Caregiver with
 * a legacy `access_id` field that maps to `unique_access_id` for backward
 * compatibility with components that haven't been migrated yet.
 */
export interface Profile extends Caregiver {
  /** @deprecated Use unique_access_id instead. Kept for backward compatibility. */
  access_id?: string | null;
  full_name: string; // Required at this layer
}

// ============================================================================
// USER PROFILE (extended profile from a separate user_profiles table)
// ============================================================================

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  access_id: string;
  avatar_url: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  is_verified: boolean;
  last_login: string | null;
  login_count: number;
  specialization: string;
  license_number: string;
  assigned_patients: number;
  created_at: string;
  updated_at: string;
  experience_years: number;
  institution: string;
  availability_status: AvailabilityStatus;
  can_receive_calls: boolean;
  available_days: string[];
  available_start_time: string | null;
  available_end_time: string | null;
  current_shift_status: ShiftStatus;
  last_active_at: string | null;
  shift_schedule: string;
  emergency_contact: string;
  admin_level: string;
  governance_clearance: string;
}

// ============================================================================
// PATIENT
// ============================================================================

export interface Patient {
  patient_id: number;
  first_name: string;
  last_name: string;
  full_name?: string; // Virtual property often used in UI
  date_of_birth: string | null;
  gender: string | null;
  phone_number: string | null;
  address: string | null;
  medical_conditions: string | null;
  emergency_contact: string | null;
  photo_url: string | null;

  // Registration workflow
  registration_status: RegistrationStatus;
  registered_by: string | null;
  registered_at: string;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;

  // Assignment
  assigned_caregiver_id: string | null;
  reassignment_history: Array<{
    from_caregiver_id: string;
    to_caregiver_id: string;
    changed_by: string;
    changed_at: string;
    reason?: string;
  }> | null;

  created_at: string;
  status: 'active' | 'inactive' | 'discharged';
}

// ============================================================================
// PROFILE STATS (per-role aggregates)
// ============================================================================

export interface CaregiverProfileStats {
  caregiver_id: string;
  total_assigned_patients: number;
  total_reports_submitted: number;
  reports_this_week: number;
  total_consultations_initiated: number;
}

export interface PractitionerProfileStats {
  caregiver_id: string;
  total_consultations_received: number;
  consultations_this_week: number;
  critical_consultations_handled: number;
  avg_call_duration_seconds: number | null;
}

export interface AdminProfileStats {
  caregiver_id: string;
  total_users_authorized: number;
  total_active_patients: number;
  pending_approvals: number;
  total_admin_actions: number;
}

export interface ProfileStats {
  patients_monitored?: number;
  active_alerts?: number;
  resolved_alerts?: number;
  total_reports?: number;
  reports_this_week?: number;
  last_report_date?: string;
  total_users?: number;
  security_alerts?: number;
  avg_response_time?: string;
}

// ============================================================================
// PRACTITIONER CREDENTIALS & AVAILABILITY
// ============================================================================

export interface PractitionerCredentials {
  id: string;
  caregiver_id: string;
  prc_license_number: string;
  prc_license_expiry: string;
  prc_profession: string;
  primary_hospital: string | null;
  hospital_affiliations: Array<{ name: string; address?: string; role?: string }>;
  specializations: string[];
  certifications: Array<{ name: string; issuer: string; date: string; expiry?: string }>;
  verification_status: 'pending' | 'verified' | 'rejected' | 'expired';
  verified_by: string | null;
  verified_at: string | null;
  clinical_hotline: string;
  backup_contact: string | null;
  preferred_contact_hours: string | null;
  accepts_sms: boolean;
  accepts_calls: boolean;
  created_at: string;
  updated_at: string;
}

export interface PractitionerAvailability {
  id: string;
  caregiver_id: string;
  status: AvailabilityStatus;
  status_message: string | null;
  busy_until: string | null;
  auto_status_enabled: boolean;
  last_status_change: string;
  last_active_at: string;
  total_calls_today: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// CONSULTATION & MONITORING
// ============================================================================

export interface ConsultationSession {
  session_id: number;
  consultation_type: 'phone_call' | 'sms' | 'in_person';
  initiated_by: string;
  practitioner_id: string;
  patient_id: number | null;
  phone_number_dialed: string;
  call_status: 'initiated' | 'connected' | 'completed' | 'missed' | 'failed' | 'voicemail';
  call_duration_seconds: number | null;
  consultation_notes: string | null;
  urgency_level: 'routine' | 'urgent' | 'critical';
  sms_message_body: string | null;
  practitioner_status_at_call: string | null;
  started_at: string | null;
  ended_at: string | null;
  completed_at: string | null;
}

export interface VitalSigns {
  blood_pressure?: string;
  heart_rate?: number;
  temperature?: number;
  oxygen_saturation?: number;
  respiratory_rate?: number;
  weight?: number;
  blood_glucose?: number;
  pain_level?: number;
}

export interface PatientMonitoringLog {
  log_id: number;
  patient_id: number | null;
  caregiver_id: string | null;
  vital_signs: VitalSigns | null;
  physical_status: string | null; // 'stable' | 'warning' | 'critical'
  image_url: string | null;
  notes: string | null;
  recorded_at: string;
}

// ============================================================================
// AUDIT & ALERTS
// ============================================================================

export interface ActivityLog {
  log_id: number;
  user_id: string | null;
  user_type: UserRole | null;
  action: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  timestamp: string;
}

export interface Alert {
  alert_id: number;
  patient_id: number | null;
  alert_type: 'critical' | 'warning' | 'info' | 'emergency';
  message: string | null;
  triggered_by: string | null;
  is_acknowledged: boolean;
  acknowledged_by: string | null;
  created_at: string;
  acknowledged_at: string | null;
}