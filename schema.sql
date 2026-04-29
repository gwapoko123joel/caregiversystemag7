-- ==============================================================================
-- BANTAYAN CARE SYSTEM FULL SCHEMA MIGRATION
-- Copy and paste this into the Supabase SQL Editor for your project 
-- (nipxtcbzqtyajlmcdpmb) and click "Run".
-- ==============================================================================

-- 0. WIPE EXISTING SCHEMA TO PREVENT DUPLICATE ERRORS
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.video_sessions CASCADE;
DROP TABLE IF EXISTS public.alerts CASCADE;
DROP TABLE IF EXISTS public.automated_reports CASCADE;
DROP TABLE IF EXISTS public.patient_monitoring_logs CASCADE;
DROP TABLE IF EXISTS public.caregiver_patient_assignments CASCADE;
DROP TABLE IF EXISTS public.caregivers CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;

-- 1. Enable pg_net for edge function hooks (emails)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ==========================================
-- TABLE CREATION
-- ==========================================

-- patients
CREATE TABLE IF NOT EXISTS public.patients (
    patient_id serial PRIMARY KEY,
    first_name varchar NOT NULL,
    last_name varchar NOT NULL,
    date_of_birth date,
    address text,
    emergency_contact varchar,
    medical_conditions text,
    status varchar DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discharged')),
    created_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- caregivers
CREATE TABLE IF NOT EXISTS public.caregivers (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    unique_access_id varchar UNIQUE,
    first_name varchar NOT NULL,
    last_name varchar NOT NULL,
    email varchar UNIQUE,
    phone varchar,
    role varchar DEFAULT 'caregiver' CHECK (role IN ('caregiver', 'admin', 'medical_practitioner')),
    is_active boolean DEFAULT true,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'authorized', 'revoked')),
    created_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- caregiver_patient_assignments
CREATE TABLE IF NOT EXISTS public.caregiver_patient_assignments (
    assignment_id serial PRIMARY KEY,
    caregiver_id uuid REFERENCES public.caregivers(id),
    patient_id integer REFERENCES public.patients(patient_id),
    assigned_date timestamptz DEFAULT timezone('utc'::text, now()),
    expiry_date timestamptz,
    access_level varchar DEFAULT 'view' CHECK (access_level IN ('view', 'edit', 'full'))
);

-- patient_monitoring_logs
CREATE TABLE IF NOT EXISTS public.patient_monitoring_logs (
    log_id serial PRIMARY KEY,
    patient_id integer REFERENCES public.patients(patient_id),
    caregiver_id uuid REFERENCES public.caregivers(id),
    vital_signs jsonb,
    physical_status text,
    image_url varchar,
    notes text,
    recorded_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- automated_reports
CREATE TABLE IF NOT EXISTS public.automated_reports (
    report_id serial PRIMARY KEY,
    patient_id integer REFERENCES public.patients(patient_id),
    report_type varchar CHECK (report_type IN ('daily', 'weekly', 'critical', 'custom')),
    report_data jsonb,
    sent_to jsonb,
    delivery_status varchar DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed')),
    generated_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- alerts
CREATE TABLE IF NOT EXISTS public.alerts (
    alert_id serial PRIMARY KEY,
    patient_id integer REFERENCES public.patients(patient_id),
    alert_type varchar CHECK (alert_type IN ('critical', 'warning', 'info', 'emergency')),
    message text,
    triggered_by uuid REFERENCES public.caregivers(id),
    is_acknowledged boolean DEFAULT false,
    acknowledged_by uuid REFERENCES public.caregivers(id),
    created_at timestamptz DEFAULT timezone('utc'::text, now()),
    acknowledged_at timestamptz
);

-- video_sessions
CREATE TABLE IF NOT EXISTS public.video_sessions (
    session_id serial PRIMARY KEY,
    patient_id integer REFERENCES public.patients(patient_id),
    initiated_by uuid REFERENCES public.caregivers(id),
    practitioner_id uuid REFERENCES public.caregivers(id),
    room_id varchar UNIQUE,
    status varchar DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended')),
    started_at timestamptz,
    ended_at timestamptz,
    recording_url varchar
);

-- activity_logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
    log_id serial PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    user_type varchar CHECK (user_type IN ('caregiver', 'admin', 'medical_practitioner')),
    action varchar,
    details jsonb,
    ip_address varchar,
    timestamp timestamptz DEFAULT timezone('utc'::text, now())
);


-- ==========================================
-- TRIGGERS & FUNCTIONS
-- ==========================================

-- 1. Create Handle New User Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.caregivers (id, first_name, last_name, email, role, unique_access_id, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.raw_user_meta_data->>'full_name', ' ', 1), 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', split_part(NEW.raw_user_meta_data->>'full_name', ' ', 2), 'Name'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'caregiver'),
    COALESCE(NEW.raw_user_meta_data->>'access_id', 'BRG-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 6))),
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Restrict Profile Updates (Only Admins)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.caregivers
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.restrict_profile_updates()
RETURNS trigger AS $$
BEGIN
  IF NOT is_admin() THEN
    IF (OLD.unique_access_id IS DISTINCT FROM NEW.unique_access_id) OR 
       (OLD.status IS DISTINCT FROM NEW.status) OR
       (OLD.role IS DISTINCT FROM NEW.role) THEN
      RAISE EXCEPTION 'Only administrators can modify Access ID, Role, or Status.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_restrict_profile_updates ON public.caregivers;
CREATE TRIGGER tr_restrict_profile_updates
BEFORE UPDATE ON public.caregivers
FOR EACH ROW EXECUTE FUNCTION public.restrict_profile_updates();


-- 3. Email Notification Webhook
CREATE OR REPLACE FUNCTION public.send_auth_email_hook()
RETURNS trigger AS $$
DECLARE
  project_id text := 'nipxtcbzqtyajlmcdpmb';
  function_secret text := 'bantayan_secure_fn_hook_2026';
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'authorized') THEN
    PERFORM net.http_post(
      url := 'https://' || project_id || '.supabase.co/functions/v1/send-approval-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || function_secret
      ),
      body := jsonb_build_object(
        'email', NEW.email,
        'name', NEW.first_name || ' ' || NEW.last_name,
        'role', NEW.role,
        'accessId', NEW.unique_access_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_on_status_authorized ON public.caregivers;
CREATE TRIGGER tr_on_status_authorized
AFTER UPDATE ON public.caregivers
FOR EACH ROW EXECUTE FUNCTION public.send_auth_email_hook();


-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_monitoring_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_patient_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_authorized()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.caregivers
    WHERE id = auth.uid() AND status = 'authorized'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Everyone can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.caregivers;
CREATE POLICY "Users can view own profile" ON public.caregivers FOR SELECT USING (auth.uid() = id);

-- Admins view all
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.caregivers;
CREATE POLICY "Admins can view all profiles" ON public.caregivers FOR SELECT USING (is_admin());

-- Authorized practitioners can view profiles
DROP POLICY IF EXISTS "Authorized practitioners can view caregivers" ON public.caregivers;
CREATE POLICY "Authorized practitioners can view caregivers" ON public.caregivers FOR SELECT USING (is_authorized() AND (SELECT role FROM public.caregivers WHERE id = auth.uid()) = 'medical_practitioner');

-- Admins can update
DROP POLICY IF EXISTS "Admins can update profile fields" ON public.caregivers;
CREATE POLICY "Admins can update profile fields" ON public.caregivers FOR UPDATE USING (is_admin());

-- Authorized users can view and insert logs, alerts, videos
DROP POLICY IF EXISTS "Authorized users can view logs" ON public.patient_monitoring_logs;
CREATE POLICY "Authorized users can view logs" ON public.patient_monitoring_logs FOR SELECT USING (is_authorized() OR is_admin());

DROP POLICY IF EXISTS "Authorized users can insert logs" ON public.patient_monitoring_logs;
CREATE POLICY "Authorized users can insert logs" ON public.patient_monitoring_logs FOR INSERT WITH CHECK (is_authorized());

DROP POLICY IF EXISTS "Authorized users can view alerts" ON public.alerts;
CREATE POLICY "Authorized users can view alerts" ON public.alerts FOR SELECT USING (is_authorized() OR is_admin());

DROP POLICY IF EXISTS "Authorized users can insert alerts" ON public.alerts;
CREATE POLICY "Authorized users can insert alerts" ON public.alerts FOR INSERT WITH CHECK (is_authorized());

DROP POLICY IF EXISTS "Authorized users can view sessions" ON public.video_sessions;
CREATE POLICY "Authorized users can view sessions" ON public.video_sessions FOR SELECT USING (is_authorized() OR is_admin());

DROP POLICY IF EXISTS "Authorized users can insert sessions" ON public.video_sessions;
CREATE POLICY "Authorized users can insert sessions" ON public.video_sessions FOR INSERT WITH CHECK (is_authorized());

-- Activity Logs
DROP POLICY IF EXISTS "Users can view their own logs" ON public.activity_logs;
CREATE POLICY "Users can view their own logs" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Anyone can insert logs" ON public.activity_logs;
CREATE POLICY "Anyone can insert logs" ON public.activity_logs FOR INSERT WITH CHECK (true);

