-- Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Add registration workflow columns to patients table
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS registration_status TEXT NOT NULL DEFAULT 'pending_verification'
    CHECK (registration_status IN (
      'pending_verification', 'active', 'inactive', 'archived', 'rejected'
    )),
  ADD COLUMN IF NOT EXISTS registered_by UUID REFERENCES caregivers(id),
  ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES caregivers(id),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS reassignment_history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS assigned_caregiver_id UUID REFERENCES caregivers(id);

-- Index for admin verification queue
CREATE INDEX IF NOT EXISTS idx_patients_registration_status 
  ON patients(registration_status) 
  WHERE registration_status = 'pending_verification';

-- Index for caregiver patient lookup
CREATE INDEX IF NOT EXISTS idx_patients_assigned_caregiver 
  ON patients(assigned_caregiver_id);

-- RLS policies
DROP POLICY IF EXISTS "caregivers_view_assigned_patients" ON patients;
CREATE POLICY "caregivers_view_assigned_patients" ON patients
  FOR SELECT USING (
    assigned_caregiver_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM caregivers 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'medical_practitioner')
      AND status = 'authorized'
    )
  );

DROP POLICY IF EXISTS "caregivers_register_patients" ON patients;
CREATE POLICY "caregivers_register_patients" ON patients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM caregivers 
      WHERE id = auth.uid() 
      AND role IN ('caregiver', 'admin', 'medical_practitioner')
      AND status = 'authorized'
    )
    AND registered_by = auth.uid()
  );

DROP POLICY IF EXISTS "admin_full_access_patients" ON patients;
CREATE POLICY "admin_full_access_patients" ON patients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM caregivers 
      WHERE id = auth.uid() AND role = 'admin' AND status = 'authorized'
    )
  );

-- Create bucket for patient photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('patient-photos', 'patient-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'patient-photos');

DROP POLICY IF EXISTS "Caregiver Upload" ON storage.objects;
CREATE POLICY "Caregiver Upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'patient-photos' 
  AND auth.role() = 'authenticated'
);
