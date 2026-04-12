The Prompt for Your Agent
Role: You are an expert Full-Stack Web Developer specializing in healthcare management systems and secure portal design.

Task: Develop the initial architecture and frontend for a healthcare monitoring system titled: "Streamlining Care Coordination: A Webpage-Based System for Automated Caregiver Reporting and On-Time Patient Monitoring in Barangay Bantayan, Dumaguete City."

Objective: Create a secure Login Page and a Create Account Page that serve as the gateway to a system with the following core features:

1. On-Time Patient Monitoring: Real-time dashboard capability.

2. Automated Send Reports: Backend triggers for caregiver data submission.

3. Unique Access ID System: Verification logic where authorized caregivers are linked to specific Patient IDs.

4. Streamlined User Interface: A clean, high-accessibility UI suitable for fast-paced caregiving environments.

5. Activity & History Logs: Audit trails for all user actions.

6. Prompt Alert System: Visual/Audio notification components for emergencies.

7. Image Uploading: UI elements for uploading real-time photos of patient physical status.

8. Emergency Video Conferencing: An interface placeholder for WebRTC/Video integration for medical practitioners.

Technical Requirements for the Login/Signup Pages:

- Authentication: Include fields for Email, Password, and the Unique Caregiver Access ID.

- Validation: Implement strict validation for the Access ID to ensure it matches the authorized patient-caregiver mapping.

- Styling: Use a professional, medical-themed color palette (clean whites, calming blues, and urgent reds for alerts). Ensure the design is mobile-responsive.

- User Experience: On the "Create Account" page, include a role selection (e.g., Caregiver, Medical Practitioner, Administrator).


Deliverable: Please provide the HTML, CSS (or Tailwind), and Javascript (or React/Vue components) for the Login and Registration views, ensuring the UI reflects the streamlined nature of the project.



The Multi-User System Architecture Prompt
Role: You are a Senior Full-Stack Developer and UI/UX Designer.
Task: Develop the comprehensive dashboard layouts and core functional views for the three distinct user roles in the Barangay Bantayan Care Coordination System.

Core System Logic:
Use the Supabase connection to ensure that when a user logs in, they are redirected to their specific dashboard based on their role (Caregiver, Medical Practitioner, or Admin).


1. The Caregiver Dashboard (The "On-The-Ground" View)
Focus: Fast data entry and urgent communication.

- Unique Access ID Verification: A specialized gate that links the Caregiver to their specific assigned Patient.

- Patient Physical Status Update: A streamlined form with an Image Upload component to send "Actual Footage" of the patient.

- On-Time Reporting: A "Submit Report" button that automatically timestamps and logs the caregiver's location and patient status.

- Emergency Video Link: A prominent "Initiate Emergency Call" button to connect with a Medical Practitioner.


2. The Medical Practitioner Dashboard (The "Clinical Oversight" View)
Focus: Data analysis and emergency response.

- Patient Monitoring Feed: A real-time feed of all patient physical status photos and reports submitted by caregivers.

- Prompt Alert Inbox: A high-priority notification center that triggers visual and audio alerts when a caregiver reports an emergency.

- Remote Consultation Hub: A video conferencing interface designed to view the "Actual Footage" or live stream from the caregiver’s device.

- History & Activity Logs: Detailed chronological views of patient progress and past caregiver reports.



3. The Administrator Dashboard (The "System Management" View)
Focus: Security, audit trails, and user management.

- User Management: Interface to authorize new Caregivers and Medical Practitioners and assign Unique Access IDs.

- Master Activity Log: A searchable, filterable table of every action taken in the system for accountability and auditing.

- System Health: Monitoring the "Automated Send Reports" status to ensure the server is successfully delivering notifications.