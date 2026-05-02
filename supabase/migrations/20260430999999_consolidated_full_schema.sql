-- =================================================================
-- BANTAYAN CARE: CONSOLIDATED SCHEMA SYNC MIGRATION
-- Based on verified real schema as of 2026-04-30
-- =================================================================

-- Section 1: Safety check
DO 
$$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'caregivers' AND table_schema = 'public'
  ) THEN
    RAISE EXCEPTION 'caregivers table missing - cannot proceed';
  END IF;
END
$$
;

-- =================================================================
-- Section 2: CAREGIVERS TABLE EXTENSIONS
-- =================================================================

-- Profile system fields
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

-- Caregiver-specific fields
ALTER TABLE caregivers
  ADD COLUMN IF NOT EXISTS assigned_barangay TEXT DEFAULT 'Bantayan',
  ADD COLUMN IF NOT EXISTS bhw_id_number TEXT,
  ADD COLUMN IF NOT EXISTS training_certifications JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS supervising_practitioner_id UUID REFERENCES caregivers(id),
  ADD COLUMN IF NOT EXISTS shift_schedule TEXT,
  ADD COLUMN IF NOT EXISTS coverage_area TEXT[];

-- Admin-specific fields
ALTER TABLE caregivers
  ADD COLUMN IF NOT EXISTS admin_level TEXT 
    CHECK (admin_level IN ('barangay_health_officer', 'system_admin', 'super_admin')),
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS office_phone TEXT,
  ADD COLUMN IF NOT EXISTS jurisdiction TEXT,
  ADD COLUMN IF NOT EXISTS appointment_date DATE;

-- COMPATIBILITY GENERATED COLUMNS
-- These let frontend code use full_name, contact_number, status seamlessly
ALTER TABLE caregivers
  ADD COLUMN IF NOT EXISTS full_name TEXT 
    GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED;

ALTER TABLE caregivers
  ADD COLUMN IF NOT EXISTS contact_number TEXT 
    GENERATED ALWAYS AS (phone) STORED;

ALTER TABLE caregivers
  ADD COLUMN IF NOT EXISTS status TEXT 
    GENERATED ALWAYS AS (CASE WHEN is_active THEN 'authorized' ELSE 'pending' END) STORED;

-- Validate emergency contact format if provided
ALTER TABLE caregivers DROP CONSTRAINT IF EXISTS valid_emergency_contact;
ALTER TABLE caregivers
  ADD CONSTRAINT valid_emergency_contact 
  CHECK (emergency_contact_number IS NULL 
         OR emergency_contact_number ~ '^\+639[0-9]{9}$');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_caregivers_role_active 
  ON caregivers(role, is_active);
CREATE INDEX IF NOT EXISTS idx_caregivers_supervising 
  ON caregivers(supervising_practitioner_id);

-- Enable RLS
ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
DROP POLICY IF EXISTS "users_view_authorized_profiles" ON caregivers;
CREATE POLICY "users_view_authorized_profiles" ON caregivers
  FOR SELECT USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM caregivers self_check
      WHERE self_check.id = auth.uid() 
        AND self_check.is_active = true
    )
  );

DROP POLICY IF EXISTS "users_update_own_profile" ON caregivers;
CREATE POLICY "users_update_own_profile" ON caregivers
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() 
    AND role = (SELECT role FROM caregivers WHERE id = auth.uid())
    AND is_active = (SELECT is_active FROM caregivers WHERE id = auth.uid())
  );

-- =================================================================
-- Section 3: PATIENTS TABLE EXTENSIONS
-- =================================================================

DO 
$$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'patients' AND table_schema = 'public'
  ) THEN
    -- Add registration workflow columns
    ALTER TABLE patients
      ADD COLUMN IF NOT EXISTS registration_status TEXT NOT NULL DEFAULT 'active'
        CHECK (registration_status IN ('pending_verification', 'active', 'inactive', 'archived', 'rejected')),
      ADD COLUMN IF NOT EXISTS registered_by UUID REFERENCES caregivers(id),
      ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES caregivers(id),
      ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
      ADD COLUMN IF NOT EXISTS reassignment_history JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS assigned_caregiver_id UUID REFERENCES caregivers(id);

    CREATE INDEX IF NOT EXISTS idx_patients_registration_status 
      ON patients(registration_status);
    CREATE INDEX IF NOT EXISTS idx_patients_assigned_caregiver 
      ON patients(assigned_caregiver_id);

    ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "caregivers_view_assigned_patients" ON patients;
    CREATE POLICY "caregivers_view_assigned_patients" ON patients
      FOR SELECT USING (
        assigned_caregiver_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM caregivers 
          WHERE id = auth.uid() 
            AND role IN ('admin', 'medical_practitioner')
            AND is_active = true
        )
      );

    DROP POLICY IF EXISTS "caregivers_register_patients" ON patients;
    CREATE POLICY "caregivers_register_patients" ON patients
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM caregivers 
          WHERE id = auth.uid() 
            AND role IN ('caregiver', 'admin', 'medical_practitioner')
            AND is_active = true
        )
      );

    DROP POLICY IF EXISTS "admin_full_access_patients" ON patients;
    CREATE POLICY "admin_full_access_patients" ON patients
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM caregivers 
          WHERE id = auth.uid() 
            AND role = 'admin' 
            AND is_active = true
        )
      );
  END IF;
END
$$
;

-- =================================================================
-- Section 4: PRACTITIONER_CREDENTIALS TABLE
-- =================================================================

CREATE TABLE IF NOT EXISTS practitioner_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID NOT NULL UNIQUE REFERENCES caregivers(id) ON DELETE CASCADE,
  prc_license_number TEXT NOT NULL,
  prc_license_expiry DATE NOT NULL,
  prc_profession TEXT NOT NULL,
  primary_hospital TEXT,
  hospital_affiliations JSONB DEFAULT '[]'::jsonb,
  specializations TEXT[] DEFAULT ARRAY[]::TEXT[],
  certifications JSONB DEFAULT '[]'::jsonb,
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
  verified_by UUID REFERENCES caregivers(id),
  verified_at TIMESTAMPTZ,
  clinical_hotline TEXT NOT NULL,
  backup_contact TEXT,
  preferred_contact_hours TEXT,
  accepts_sms BOOLEAN DEFAULT true,
  accepts_calls BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practitioner_credentials_caregiver 
  ON practitioner_credentials(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_practitioner_credentials_status 
  ON practitioner_credentials(verification_status);

ALTER TABLE practitioner_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "active_users_read_credentials" ON practitioner_credentials;
CREATE POLICY "active_users_read_credentials" ON practitioner_credentials
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM caregivers WHERE id = auth.uid() AND is_active = true)
  );

DROP POLICY IF EXISTS "admin_writes_credentials" ON practitioner_credentials;
CREATE POLICY "admin_writes_credentials" ON practitioner_credentials
  FOR ALL USING (
    EXISTS (SELECT 1 FROM caregivers WHERE id = auth.uid() AND role = 'admin' AND is_active = true)
  );

DROP POLICY IF EXISTS "practitioner_self_manage_credentials" ON practitioner_credentials;
CREATE POLICY "practitioner_self_manage_credentials" ON practitioner_credentials
  FOR ALL USING (caregiver_id = auth.uid());

-- =================================================================
-- Section 5: PRACTITIONER_AVAILABILITY TABLE
-- =================================================================

CREATE TABLE IF NOT EXISTS practitioner_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID NOT NULL UNIQUE REFERENCES caregivers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'off_duty'
    CHECK (status IN ('available', 'busy', 'off_duty', 'on_break', 'in_consultation', 'emergency_only', 'on_call', 'unavailable')),
  status_message TEXT,
  busy_until TIMESTAMPTZ,
  auto_status_enabled BOOLEAN DEFAULT true,
  last_status_change TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  total_calls_today INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practitioner_availability_caregiver 
  ON practitioner_availability(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_practitioner_availability_status 
  ON practitioner_availability(status);

ALTER TABLE practitioner_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "active_users_read_availability" ON practitioner_availability;
CREATE POLICY "active_users_read_availability" ON practitioner_availability
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM caregivers WHERE id = auth.uid() AND is_active = true)
  );

DROP POLICY IF EXISTS "practitioner_self_availability" ON practitioner_availability;
CREATE POLICY "practitioner_self_availability" ON practitioner_availability
  FOR ALL USING (caregiver_id = auth.uid());

-- Enable Realtime
DO 
$$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'practitioner_availability'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE practitioner_availability;
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END
$$
;

-- =================================================================
-- Section 6: CONSULTATION_SESSIONS (extends existing video_sessions)
-- =================================================================

-- video_sessions exists with: session_id INT, patient_id INT, initiated_by UUID,
-- practitioner_id UUID, room_id VARCHAR, status VARCHAR
-- We'll EXTEND it in place rather than rename, to preserve any existing data

-- Add new phone-pivot columns to video_sessions (will be renamed later)
ALTER TABLE video_sessions
  ADD COLUMN IF NOT EXISTS consultation_type TEXT NOT NULL DEFAULT 'phone_call'
    CHECK (consultation_type IN ('phone_call', 'sms', 'in_person', 'video_call')),
  ADD COLUMN IF NOT EXISTS phone_number_dialed TEXT,
  ADD COLUMN IF NOT EXISTS call_status TEXT NOT NULL DEFAULT 'initiated'
    CHECK (call_status IN ('initiated', 'connected', 'completed', 'missed', 'failed', 'voicemail')),
  ADD COLUMN IF NOT EXISTS call_duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS consultation_notes TEXT,
  ADD COLUMN IF NOT EXISTS urgency_level TEXT NOT NULL DEFAULT 'routine'
    CHECK (urgency_level IN ('routine', 'urgent', 'critical')),
  ADD COLUMN IF NOT EXISTS sms_message_body TEXT,
  ADD COLUMN IF NOT EXISTS practitioner_status_at_call TEXT,
  ADD COLUMN IF NOT EXISTS initiated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Now rename to consultation_sessions if not already done
DO 
$$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'video_sessions' AND table_schema = 'public'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'consultation_sessions' AND table_schema = 'public'
  ) THEN
    ALTER TABLE video_sessions RENAME TO consultation_sessions;
  END IF;
END
$$
;

ALTER TABLE consultation_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_consultations" ON consultation_sessions;
CREATE POLICY "users_read_consultations" ON consultation_sessions
  FOR SELECT USING (
    initiated_by = auth.uid() 
    OR practitioner_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM caregivers WHERE id = auth.uid() AND role = 'admin' AND is_active = true)
  );

DROP POLICY IF EXISTS "users_create_consultations" ON consultation_sessions;
CREATE POLICY "users_create_consultations" ON consultation_sessions
  FOR INSERT WITH CHECK (initiated_by = auth.uid() OR practitioner_id = auth.uid());

DROP POLICY IF EXISTS "users_update_consultations" ON consultation_sessions;
CREATE POLICY "users_update_consultations" ON consultation_sessions
  FOR UPDATE USING (initiated_by = auth.uid() OR practitioner_id = auth.uid());

-- =================================================================
-- Section 7: TRIGGERS AND FUNCTIONS
-- =================================================================

-- Auto-create availability row when practitioner is verified
CREATE OR REPLACE FUNCTION create_availability_on_verification()
RETURNS TRIGGER AS 
$$
BEGIN
  IF NEW.verification_status = 'verified' AND OLD.verification_status != 'verified' THEN
    INSERT INTO practitioner_availability (caregiver_id, status)
    VALUES (NEW.caregiver_id, 'off_duty')
    ON CONFLICT (caregiver_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$
 LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_availability ON practitioner_credentials;
CREATE TRIGGER trigger_create_availability
  AFTER UPDATE ON practitioner_credentials
  FOR EACH ROW
  EXECUTE FUNCTION create_availability_on_verification();

-- Auto-revert busy status when busy_until expires
CREATE OR REPLACE FUNCTION auto_revert_busy_status()
RETURNS void AS 
$$
BEGIN
  UPDATE practitioner_availability
  SET status = 'available', status_message = NULL, busy_until = NULL
  WHERE status IN ('busy', 'in_consultation', 'on_break')
    AND busy_until IS NOT NULL
    AND busy_until <= NOW() 
    AND auto_status_enabled = true;
END;
$$
 LANGUAGE plpgsql;

-- Schedule via pg_cron if available
DO 
$$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('auto-revert-busy', '*/5 * * * *', 'SELECT auto_revert_busy_status()');
    RAISE NOTICE 'pg_cron scheduled for auto_revert_busy_status';
  ELSE
    RAISE NOTICE 'pg_cron not available - run auto_revert_busy_status manually or via external cron';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Failed to schedule pg_cron job - ignoring';
END
$$
;

-- Profile completion calculation (uses REAL column: phone, not contact_number)
CREATE OR REPLACE FUNCTION calculate_profile_completion(caregiver_uuid UUID)
RETURNS INTEGER AS 
$$
DECLARE
  c RECORD;
  total_fields INTEGER;
  completed_fields INTEGER := 0;
BEGIN
  SELECT * INTO c FROM caregivers WHERE id = caregiver_uuid;
  total_fields := 8;
  
  IF c.profile_picture_url IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF c.bio IS NOT NULL AND length(c.bio) > 0 THEN completed_fields := completed_fields + 1; END IF;
  IF c.date_of_birth IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF c.gender IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF c.address IS NOT NULL AND length(c.address) > 0 THEN completed_fields := completed_fields + 1; END IF;
  IF c.emergency_contact_name IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF c.emergency_contact_number IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  -- Use REAL column "phone" (not contact_number)
  IF c.phone IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  
  IF c.role = 'caregiver' THEN
    total_fields := total_fields + 3;
    IF c.bhw_id_number IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
    IF c.shift_schedule IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
    IF c.coverage_area IS NOT NULL AND array_length(c.coverage_area, 1) > 0 
       THEN completed_fields := completed_fields + 1; END IF;
       
  ELSIF c.role = 'medical_practitioner' THEN
    total_fields := total_fields + 3;
    IF EXISTS (SELECT 1 FROM practitioner_credentials WHERE caregiver_id = c.id) THEN
      completed_fields := completed_fields + 3;
    END IF;
    
  ELSIF c.role = 'admin' THEN
    total_fields := total_fields + 3;
    IF c.admin_level IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
    IF c.department IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
    IF c.jurisdiction IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  END IF;
  
  IF total_fields = 0 THEN RETURN 0; END IF;
  RETURN (completed_fields * 100 / total_fields);
END;
$$
 LANGUAGE plpgsql;

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

-- =================================================================
-- Section 8: VIEWS (using REAL column names)
-- =================================================================

DROP VIEW IF EXISTS available_practitioners_directory CASCADE;
CREATE VIEW available_practitioners_directory AS
SELECT 
  c.id AS caregiver_id,
  c.first_name,
  c.last_name,
  c.first_name || ' ' || c.last_name AS full_name,
  c.email,
  c.phone,
  c.role,
  pc.prc_license_number,
  pc.prc_profession,
  pc.primary_hospital,
  pc.specializations,
  pc.clinical_hotline,
  pc.backup_contact,
  pc.accepts_sms,
  pc.accepts_calls,
  pc.preferred_contact_hours,
  pa.status AS availability_status,
  pa.status_message,
  pa.busy_until,
  pa.last_status_change,
  pa.last_active_at,
  pa.total_calls_today,
  CASE pa.status
    WHEN 'available' THEN 1
    WHEN 'emergency_only' THEN 2
    WHEN 'on_break' THEN 3
    WHEN 'busy' THEN 4
    WHEN 'in_consultation' THEN 5
    WHEN 'off_duty' THEN 6
    ELSE 99
  END AS sort_priority
FROM caregivers c
INNER JOIN practitioner_credentials pc ON pc.caregiver_id = c.id
INNER JOIN practitioner_availability pa ON pa.caregiver_id = c.id
WHERE c.role = 'medical_practitioner'
  AND c.is_active = true
  AND pc.verification_status = 'verified'
  AND pc.prc_license_expiry > CURRENT_DATE;

DROP VIEW IF EXISTS caregiver_profile_stats CASCADE;
CREATE VIEW caregiver_profile_stats AS
SELECT 
  c.id AS caregiver_id,
  (SELECT COUNT(*) FROM patients p WHERE p.assigned_caregiver_id = c.id) AS total_assigned_patients,
  (SELECT COUNT(*) FROM patient_monitoring_logs pml WHERE pml.caregiver_id = c.id) AS total_reports_submitted,
  (SELECT COUNT(*) FROM patient_monitoring_logs pml 
   WHERE pml.caregiver_id = c.id) AS reports_this_week,
  (SELECT COUNT(*) FROM consultation_sessions cs WHERE cs.initiated_by = c.id) AS total_consultations_initiated
FROM caregivers c
WHERE c.role = 'caregiver';

DROP VIEW IF EXISTS practitioner_profile_stats CASCADE;
CREATE VIEW practitioner_profile_stats AS
SELECT 
  c.id AS caregiver_id,
  (SELECT COUNT(*) FROM consultation_sessions cs WHERE cs.practitioner_id = c.id) AS total_consultations_received,
  (SELECT COUNT(*) FROM consultation_sessions cs 
   WHERE cs.practitioner_id = c.id 
     AND cs.initiated_at >= NOW() - INTERVAL '7 days') AS consultations_this_week,
  (SELECT COUNT(*) FROM consultation_sessions cs 
   WHERE cs.practitioner_id = c.id 
     AND cs.urgency_level = 'critical') AS critical_consultations_handled,
  (SELECT AVG(cs.call_duration_seconds) FROM consultation_sessions cs 
   WHERE cs.practitioner_id = c.id 
     AND cs.call_duration_seconds IS NOT NULL) AS avg_call_duration_seconds
FROM caregivers c
WHERE c.role = 'medical_practitioner';

DROP VIEW IF EXISTS admin_profile_stats CASCADE;
CREATE VIEW admin_profile_stats AS
SELECT 
  c.id AS caregiver_id,
  (SELECT COUNT(*) FROM caregivers WHERE is_active = true) AS total_users_authorized,
  (SELECT COUNT(*) FROM patients WHERE registration_status = 'active') AS total_active_patients,
  (SELECT COUNT(*) FROM patients WHERE registration_status = 'pending_verification') AS pending_approvals,
  (SELECT COUNT(*) FROM activity_logs WHERE user_id = c.id) AS total_admin_actions
FROM caregivers c
WHERE c.role = 'admin';

-- =================================================================
-- Section 9: STORAGE BUCKETS
-- =================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures', 'profile-pictures', true, 2097152,
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

INSERT INTO storage.buckets (id, name, public) 
VALUES ('patient-photos', 'patient-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "patient_photos_public_read" ON storage.objects;
CREATE POLICY "patient_photos_public_read" ON storage.objects 
  FOR SELECT USING (bucket_id = 'patient-photos');

DROP POLICY IF EXISTS "patient_photos_authenticated_upload" ON storage.objects;
CREATE POLICY "patient_photos_authenticated_upload" ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'patient-photos' 
    AND auth.role() = 'authenticated'
  );

-- =================================================================
-- POST-MIGRATION VERIFICATION
-- =================================================================

DO 
$$
DECLARE
  missing_items TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practitioner_credentials') THEN
    missing_items := array_append(missing_items, 'practitioner_credentials table');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practitioner_availability') THEN
    missing_items := array_append(missing_items, 'practitioner_availability table');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'consultation_sessions') THEN
    missing_items := array_append(missing_items, 'consultation_sessions table');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'caregiver_profile_stats') THEN
    missing_items := array_append(missing_items, 'caregiver_profile_stats view');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'available_practitioners_directory') THEN
    missing_items := array_append(missing_items, 'available_practitioners_directory view');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-pictures') THEN
    missing_items := array_append(missing_items, 'profile-pictures bucket');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'caregivers' AND column_name = 'full_name') THEN
    missing_items := array_append(missing_items, 'caregivers.full_name compatibility column');
  END IF;
  
  IF array_length(missing_items, 1) > 0 THEN
    RAISE WARNING 'MIGRATION INCOMPLETE - Missing: %', array_to_string(missing_items, ', ');
  ELSE
    RAISE NOTICE '✅ MIGRATION SUCCESSFUL - All components in place';
  END IF;
END
$$
;
