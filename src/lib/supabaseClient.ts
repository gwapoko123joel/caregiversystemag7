import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Type helpers (Aligned with Actual Database Schema) ──────────────────────

export type UserRole = 'caregiver' | 'medical_practitioner' | 'admin'

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
