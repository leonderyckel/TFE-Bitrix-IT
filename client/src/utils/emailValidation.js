// Custom email validation function that accepts .co.za domains and is case-insensitive
export const validateEmail = (email) => {
  if (!email) return false;
  
  // Convert to lowercase for validation
  const emailLower = email.toLowerCase();
  
  // Basic email format validation (case-insensitive)
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  if (!emailRegex.test(emailLower)) {
    return false;
  }
  
  // Additional validation for specific domains like .co.za
  const domainPart = emailLower.split('@')[1];
  if (!domainPart) return false;
  
  // Allow common TLDs and multi-part domains like .co.za
  const validDomainRegex = /^[a-z0-9.-]+\.([a-z]{2,}|[a-z]{2}\.[a-z]{2})$/;
  return validDomainRegex.test(domainPart);
};

// Yup test function for email validation
export const emailValidationTest = function(value) {
  if (!value) return true; // Let required() handle empty values
  return validateEmail(value);
}; 