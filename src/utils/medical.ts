/**
 * Calculates a person's age based on their Date of Birth.
 * @param dob - ISO Date string or Date object
 * @returns Formatted string e.g. "45 Years Old" or "N/A"
 */
export const calculateAge = (dob: string | null | undefined) => {
  if (!dob) return "N/A";
  const birthDate = new Date(dob);
  const today = new Date();
  
  // Basic validation for invalid date strings
  if (isNaN(birthDate.getTime())) return "N/A";

  const years = today.getFullYear() - birthDate.getFullYear();
  const months = today.getMonth() - birthDate.getMonth();
  
  if (years === 0) {
    const totalMonths = months + (today.getDate() < birthDate.getDate() ? -1 : 0);
    if (totalMonths <= 0) return "Newborn";
    return `${totalMonths} Months Old`;
  }
  
  let age = years;
  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // Handle case where years > 0 but age calculation result is 0 (just before 1st birthday)
  if (age === 0) {
    const totalMonths = 12 + months + (today.getDate() < birthDate.getDate() ? -1 : 0);
    return `${totalMonths} Months Old`;
  }

  return `${age} Years Old`;
};
