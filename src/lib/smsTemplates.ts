export const smsTemplates = {
  criticalVitals: (patientName: string, vitals: string) => 
    `BANTAYAN CARE: Critical vitals for ${patientName}. ${vitals}. Please advise urgently.`,
  routineCheckIn: (patientName: string) => 
    `BANTAYAN CARE: Routine check-in update available for ${patientName}. Please review when available.`,
  consultationRequest: (patientName: string, condition: string) => 
    `BANTAYAN CARE: Requesting consultation for ${patientName} re: ${condition}. Please respond.`,
  offDutyContact: (patientName: string) => 
    `BANTAYAN CARE: Non-urgent message about ${patientName}. Please respond when on duty. Thank you.`,
};
