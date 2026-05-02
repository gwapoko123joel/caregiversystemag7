-- ============================================================
-- SHARED PROFILE FIELDS (all roles)
-- ============================================================
ALTER TABLE caregivers
  ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT 
    CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_number TEXT,
  ADD COLUMN IF NOT EXISTS years_of_experience INTEGER 
    CHECK (years_of_experience >= 0),
  ADD COLUMN IF NOT EXISTS languages_spoken TEXT[] 
    DEFAULT ARRAY['Filipino', 'English']::TEXT[],
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER 
    DEFAULT 0 CHECK (profile_completion_percentage BETWEEN 0 AND 100);

-- Validate emergency contact format if provided
ALTER TABLE caregivers
  DROP CONSTRAINT IF EXISTS valid_emergency_contact;
ALTER TABLE caregivers
  ADD CONSTRAINT valid_emergency_contact 
  CHECK (emergency_contact_number IS NULL 
         OR emergency_contact_number ~ '^\+639[0-9]{9}$');

-- ============================================================
-- CAREGIVER-SPECIFIC FIELDS
-- ============================================================
ALTER TABLE caregivers
  ADD COLUMN IF NOT EXISTS assigned_barangay TEXT DEFAULT 'Bantayan',
  ADD COLUMN IF NOT EXISTS bhw_id_number TEXT, -- Barangay Health Worker ID
  ADD COLUMN IF NOT EXISTS training_certifications JSONB DEFAULT '[]'::jsonb,
    -- [{ name, issuer, date_issued, expiry_date, certificate_url }]
  ADD COLUMN IF NOT EXISTS supervising_practitioner_id UUID 
    REFERENCES caregivers(id),
  ADD COLUMN IF NOT EXISTS shift_schedule TEXT, 
    -- e.g., "Monday-Friday, 8AM-5PM"
  ADD COLUMN IF NOT EXISTS coverage_area TEXT[]; 
    -- e.g., ['Sitio 1', 'Sitio 2']

-- ============================================================
-- ADMIN-SPECIFIC FIELDS  
-- ============================================================
ALTER TABLE caregivers
  ADD COLUMN IF NOT EXISTS admin_level TEXT 
    CHECK (admin_level IN ('barangay_health_officer', 'system_admin', 'super_admin')),
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS office_phone TEXT,
  ADD COLUMN IF NOT EXISTS jurisdiction TEXT, -- Areas they oversee
  ADD COLUMN IF NOT EXISTS appointment_date DATE; -- When they were appointed

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_caregivers_role_status 
  ON caregivers(role, status);
CREATE INDEX IF NOT EXISTS idx_caregivers_supervising 
  ON caregivers(supervising_practitioner_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================
-- Remove existing if they exist to avoid conflict
DROP POLICY IF EXISTS "users_update_own_profile" ON caregivers;
CREATE POLICY "users_update_own_profile" ON caregivers
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() 
    -- Prevent users from changing their own role or status
    AND role = (SELECT role FROM caregivers WHERE id = auth.uid())
    AND status = (SELECT status FROM caregivers WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "users_view_authorized_profiles" ON caregivers;
-- Ensure we can view other profiles if needed, this uses a hypothetical is_authorized function
-- For now, allow viewing own profile at least.
CREATE POLICY "users_view_authorized_profiles" ON caregivers
  FOR SELECT USING (
    id = auth.uid()
  );

-- ============================================================
-- PROFILE COMPLETION FUNCTION (role-aware)
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_profile_completion(caregiver_uuid UUID)
RETURNS INTEGER AS 
$$
DECLARE
  c RECORD;
  total_fields INTEGER;
  completed_fields INTEGER := 0;
BEGIN
  SELECT * INTO c FROM caregivers WHERE id = caregiver_uuid;
  
  -- Base fields (8 total for all roles)
  total_fields := 8;
  
  IF c.profile_picture_url IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF c.bio IS NOT NULL AND length(c.bio) > 0 THEN completed_fields := completed_fields + 1; END IF;
  IF c.date_of_birth IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF c.gender IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF c.address IS NOT NULL AND length(c.address) > 0 THEN completed_fields := completed_fields + 1; END IF;
  IF c.emergency_contact_name IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF c.emergency_contact_number IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF c.phone IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  
  -- Role-specific fields
  IF c.role = 'caregiver' THEN
    total_fields := total_fields + 3;
    IF c.bhw_id_number IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
    IF c.shift_schedule IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
    IF c.coverage_area IS NOT NULL AND array_length(c.coverage_area, 1) > 0 
       THEN completed_fields := completed_fields + 1; END IF;
       
  ELSIF c.role = 'medical_practitioner' OR c.role = 'practitioner' THEN
    total_fields := total_fields + 3;
    -- Check if practitioner_credentials exists and is complete
    IF EXISTS (SELECT 1 FROM practitioner_credentials WHERE caregiver_id = c.id) THEN
      completed_fields := completed_fields + 3;
    END IF;
    
  ELSIF c.role = 'admin' THEN
    total_fields := total_fields + 3;
    IF c.admin_level IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
    IF c.department IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
    IF c.jurisdiction IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  END IF;
  
  RETURN (completed_fields * 100 / total_fields);
END;
$$
 LANGUAGE plpgsql;

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS 
$$
BEGIN
  NEW.profile_completion_percentage := calculate_profile_completion(NEW.id);
  RETURN NEW;
END;
$$
 LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profile_completion ON caregivers;
CREATE TRIGGER trigger_profile_completion
BEFORE UPDATE ON caregivers
FOR EACH ROW
EXECUTE FUNCTION update_profile_completion();

-- ============================================================
-- ACTIVITY STATS VIEWS (role-aware)
-- ============================================================
DROP VIEW IF EXISTS caregiver_profile_stats CASCADE;
CREATE VIEW caregiver_profile_stats AS
SELECT 
  c.id AS caregiver_id,
  COUNT(DISTINCT p.patient_id) AS total_assigned_patients,
  COUNT(DISTINCT pml.log_id) AS total_reports_submitted,
  COUNT(DISTINCT pml.log_id) FILTER (
    WHERE pml.recorded_at >= NOW() - INTERVAL '7 days'
  ) AS reports_this_week,
  COUNT(DISTINCT cs.session_id) FILTER (
    WHERE cs.initiated_by = c.id
  ) AS total_consultations_initiated
FROM caregivers c
LEFT JOIN patients p ON p.assigned_caregiver_id = c.id
LEFT JOIN patient_monitoring_logs pml ON pml.caregiver_id = c.id
LEFT JOIN consultation_sessions cs ON cs.initiated_by = c.id
WHERE c.role = 'caregiver'
GROUP BY c.id;

DROP VIEW IF EXISTS practitioner_profile_stats CASCADE;
CREATE VIEW practitioner_profile_stats AS
SELECT 
  c.id AS caregiver_id,
  COUNT(DISTINCT cs.session_id) AS total_consultations_received,
  COUNT(DISTINCT cs.session_id) FILTER (
    WHERE cs.started_at >= NOW() - INTERVAL '7 days'
  ) AS consultations_this_week,
  COUNT(DISTINCT cs.session_id) FILTER (
    WHERE cs.urgency_level = 'critical'
  ) AS critical_consultations_handled,
  AVG(cs.call_duration_seconds) FILTER (
    WHERE cs.call_duration_seconds IS NOT NULL
  ) AS avg_call_duration_seconds
FROM caregivers c
LEFT JOIN consultation_sessions cs ON cs.practitioner_id = c.id
WHERE c.role = 'medical_practitioner' OR c.role = 'practitioner'
GROUP BY c.id;

DROP VIEW IF EXISTS admin_profile_stats CASCADE;
CREATE VIEW admin_profile_stats AS
SELECT 
  c.id AS caregiver_id,
  (SELECT COUNT(*) FROM caregivers WHERE status = 'authorized') AS total_users_authorized,
  (SELECT COUNT(*) FROM patients WHERE registration_status = 'active') AS total_active_patients,
  (SELECT COUNT(*) FROM patients WHERE registration_status = 'pending_verification') AS pending_approvals,
  (SELECT COUNT(*) FROM activity_logs WHERE user_id = c.id) AS total_admin_actions
FROM caregivers c
WHERE c.role = 'admin';

-- ============================================================
-- STORAGE BUCKET SETUP
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "users_upload_own_avatar" ON storage.objects;
CREATE POLICY "users_upload_own_avatar" ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-pictures' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "users_update_own_avatar" ON storage.objects;
CREATE POLICY "users_update_own_avatar" ON storage.objects 
  FOR UPDATE USING (
    bucket_id = 'profile-pictures' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "users_delete_own_avatar" ON storage.objects;
CREATE POLICY "users_delete_own_avatar" ON storage.objects 
  FOR DELETE USING (
    bucket_id = 'profile-pictures' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "anyone_view_avatars" ON storage.objects;
CREATE POLICY "anyone_view_avatars" ON storage.objects 
  FOR SELECT USING (bucket_id = 'profile-pictures');
