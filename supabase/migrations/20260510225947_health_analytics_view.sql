CREATE OR REPLACE VIEW barangay_population_health AS
SELECT 
    address as location,
    count(patient_id) as patient_count,
    count(CASE WHEN medical_history ILIKE '%hypertension%' THEN 1 END) as hypertension_cases,
    count(CASE WHEN medical_history ILIKE '%diabetes%' THEN 1 END) as diabetes_cases,
    count(CASE WHEN status = 'critical' THEN 1 END) as active_emergencies
FROM patients
GROUP BY address;
