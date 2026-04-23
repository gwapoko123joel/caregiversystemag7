import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Type helpers (Aligned with Actual Database Schema) ──────────────────────

export type UserRole = 'caregiver' | 'medical_practitioner' | 'practitioner' | 'admin'

export type AvailabilityStatus = 'available' | 'busy' | 'off_duty' | 'on_call' | 'unavailable'
export type ShiftStatus = 'on_duty' | 'off_duty' | 'on_break' | 'emergency_responding'

export interface UserProfile {
  id: string
  user_id: string
  email: string
  full_name: string
  role: UserRole
  access_id: string
  avatar_url: string
  phone: string
  address: string
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification'
  is_verified: boolean
  last_login: string | null
  login_count: number
  specialization: string
  license_number: string
  assigned_patients: number
  created_at: string
  updated_at: string
  
  // New Fields
  experience_years: number
  institution: string
  availability_status: AvailabilityStatus
  can_receive_calls: boolean
  available_days: string[]
  available_start_time: string | null
  available_end_time: string | null
  current_shift_status: ShiftStatus
  last_active_at: string | null
  
  shift_schedule: string
  emergency_contact: string
  
  admin_level: string
  governance_clearance: string
}

export interface Profile {
  id: string
  unique_access_id: string | null
  first_name: string
  last_name: string
  full_name?: string // Virtual property for convenience
  email: string | null
  phone: string | null
  role: UserRole
  is_active: boolean
  status: 'pending' | 'authorized' | 'revoked'
  created_at: string
}

export interface Patient {
  patient_id: number
  first_name: string
  last_name: string
  full_name?: string // Virtual property
  date_of_birth: string | null
  address: string | null
  emergency_contact: string | null
  medical_conditions: string | null
  status: 'active' | 'inactive' | 'discharged'
  created_at: string
}

export interface ActivityLog {
  log_id: number
  user_id: string | null
  user_type: UserRole | null
  action: string
  details: Record<string, unknown> | null
  ip_address: string | null
  timestamp: string
}

export interface VitalSigns {
  blood_pressure?: string
  heart_rate?: number
  temperature?: number
  oxygen_saturation?: number
  respiratory_rate?: number
  weight?: number
  blood_glucose?: number
  pain_level?: number
}

export interface PatientMonitoringLog {
  log_id: number
  patient_id: number | null
  caregiver_id: string | null
  vital_signs: VitalSigns | null
  physical_status: string | null // 'stable' | 'warning' | 'critical'
  image_url: string | null
  notes: string | null
  recorded_at: string
}

export interface Alert {
  alert_id: number
  patient_id: number | null
  alert_type: 'critical' | 'warning' | 'info' | 'emergency'
  message: string | null
  triggered_by: string | null
  is_acknowledged: boolean
  acknowledged_by: string | null
  created_at: string
  acknowledged_at: string | null
}
