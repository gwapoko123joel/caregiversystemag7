import type { Patient, PatientMonitoringLog } from '../../types/database'

export interface AlertItem {
  id: string | number
  patient_name: string
  status: string
  time: string
  vitals: string
  dismissed: boolean
  patient_id?: number
}

export interface PatientWithLogs extends Patient {
  patient_monitoring_logs: (PatientMonitoringLog & { caregiver_name?: string; caregivers?: any })[]
  patient_referrals?: any[]
  latest_log?: PatientMonitoringLog | null
}

export interface PractitionerDashboardContextType {
  patients: PatientWithLogs[]
  alerts: AlertItem[]
  alertCount: number
  isLoading: boolean
  criticalAlerts: AlertItem[]
  allLogs: (PatientMonitoringLog & { patient_name: string; caregiver_name: string })[]
  initiateCall: (caregiverName?: string, patientName?: string) => void
  loadData: () => Promise<void>
  dismissAlert: (id: string | number) => void
}
