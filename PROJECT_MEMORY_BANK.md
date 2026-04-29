# PROJECT MEMORY BANK 🧠

This file serves as the persistent save state and architectural blueprint for the **Bantayan Care System**. It guarantees continuity across all development sessions.

---

## 1. Project Goal
Develop a high-end, webpage-based healthcare monitoring and coordination platform specifically tailored for **Barangay Bantayan**. The system bridges the gap between field Caregivers, remote Medical Practitioners, and overseeing Administrators through real-time telemetry and encrypted communication.

## 2. Technology Stack
*   **Frontend**: React (Vite)
*   **Styling**: Tailwind CSS v4 (Custom dark-mode UI with neon-green/purple aesthetic accents)
*   **Backend & DB**: Supabase (PostgreSQL)
*   **Realtime**: Supabase Realtime (Alerts & Telemetry sync)
*   **Email & Comms**: Resend (via Supabase Edge Functions)

## 3. Database Architecture & Progress
We have organized the system around several core tables to handle different domains of the healthcare flow:
*   **`public.caregivers`**: Curiously named, but currently acts as the **universal profile table** handling all three roles (admin, caregiver, medical_practitioner). Holds connection status and `unique_access_id`.
*   **`public.activity_logs`**: The central nervous system for events. Used for logging authentication flow, system alerts, and standalone `CONSULTATION_NOTE` insertions from the video hub.
*   **`public.emergency_alerts`**: Listens for critical triggers from the field to flash the practitioner's UI.
*   **`public.patient_monitoring_logs`**: Stores the raw telemetry, check-ins, and physical status payloads.

**Triggers & Functions:**
*   **Auth Mirroring (The Ghost User Bug)**: We recognized that the stock Supabase database trigger (`handle_new_user`) was either missing or failing (likely due to FK/Enum constraints) when users signed up. We bypassed this at the application layer by implementing a local provisioning script directly inside `AuthContext.tsx` ➔ `signUp()`.

## 4. Current Environment Credentials
```env
VITE_SUPABASE_URL=https://nipxtcbzqtyajlmcdpmb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pcHh0Y2J6cXR5YWpsbWNkcG1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MDA0MzcsImV4cCI6MjA5MDM3NjQzN30.79OCa5htwYI_i8i33pdhqWLFram2suB57PH1L58PDtU
```
*(These ensure we don't have to hunt for environment variables when reconnecting to the backend).*

## 5. The "User Trio" Module Status
*   **🛡️ Administrator**: *Partially Built*. Features the Fleet Control roster and the "Initialize Credentials" system to approve field units. 
*   **🩺 Caregiver**: *Partially Built*. Focuses on telemetry input, field reports, and sending emergency alerts. Currently gated by an "Approval Pending" screen if not authorized by an Admin.
*   **⚕️ Medical Practitioner**: **[CURRENT ACTIVE FOCUS]**. Features a grid-view Patient Roster, an interactive Clinical Detail View (with Magnify Image Lightbox & timeline Gap Analysis), and an Emergency Consultation Hub with side-by-side video and clinical notes architecture.

## 6. Resolved Architectural Issues
*   **"Ghost User" Trigger Error**: Medical Practitioner registrations were succeeding in Supabase Authentication (`auth.users`) but failing to mirror into the `public.caregivers` table, rendering them invisible to the Admin Dashboard.
*   **"Invalid Credentials" Loop**: Users attempting to log in immediately after registration were blocked by Supabase's underlying requirement for **Email Confirmation**. Because they were "ghosts" in the table configuration, the dashboard feedback was ambiguous.
*   **The Fix**: Rewrote the `AuthContext` registration sequence to immediately explicitly insert the user profile into the `caregivers` DB upon `signUp`, bypassing the database's unreliable trigger.

## 7. Active To-Do List (Next Steps)
- [ ] **Data Pipeline Verification**: Conduct an end-to-end test using the ` medical_practitioner` account to ensure profiles display perfectly in the Admin Roster.
- [ ] **Video Consultation Refinement**: Ensure the `VideoCallModal.tsx` accurately maps the `CONSULTATION_NOTE` action to the selected patient's specific ID in the `activity_logs`.
- [ ] **Caregiver Telemetry Hook**: Connect the Caregiver Dashboard's submission form so it properly feeds the Practitioner's new Patient Grid UI.
- [ ] **Edge Function Linking**: Clean up the Resend Edge Function invocation so welcome emails are seamlessly and reliably dispatched upon Admin Authorization.
