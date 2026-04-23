# BantayanCare System Personas & Testing Rules

## Role-Based Credentials
Use these to verify UI consistency, data fetching, and access control:

### 1. Caregiver Persona
- **Email:** gajilomojowail@gmail.com
- **Password:** p@ssw0rd
- **Access ID:** NJLVNU
- **Focus:** Mobile BottomNav, Patient Reporting, History.

### 2. Medical Practitioner Persona
- **Email:** joelgajilomo07+1@gmail.com
- **Password:** p@ssw0rd123
- **Access ID:** CG-2024-002
- **Focus:** Alerts, Telemetry Console, Feed.

### 3. Administrator Persona
- **Email:** jvgajilomo.student@asiancollege.edu.ph
- **Password:** 772004gajilomo
- **Access ID:** ADMIN-001
- **Focus:** Analytics, User Management, Audit Logs, Feedback.

## UI/UX Deployment Standards
- **Primary Palette:** Azure Blue / Navy Dark Mode.
- **Motion:** Surgical Vertical Slide (Y-axis).
- **Security:** Logout via Mobile Header only.

## Instruction for the AI Agent
Whenever you perform a code change, reference this rules.md. If I ask you to "Test the login flow," use these credentials to ensure that the redirect logic sends the user to the correct dashboard based on their Role and Access ID.
