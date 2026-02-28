/**
 * Backend Phone Number Validation Utility for Kenya
 */

/**
 * Validates if a phone number is a valid Kenyan format
 * @param {string} phoneNumber - The phone number to validate
 * @returns {boolean} - True if valid Kenyan phone number
 */
const isValidKenyanPhone = (phoneNumber) => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return false;
  }

  const cleaned = phoneNumber.trim().replace(/[\s\-\(\)]/g, '');
  const digitsOnly = cleaned.replace(/^\+/, '');
  
  if (!/^\d+$/.test(digitsOnly)) {
    return false;
  }

  // Valid formats: 07XXXXXXXX, 7XXXXXXXX, 2547XXXXXXXX
  if (/^0[17]\d{8}$/.test(digitsOnly)) return true;
  if (/^[17]\d{8}$/.test(digitsOnly)) return true;
  if (/^254[17]\d{8}$/.test(digitsOnly)) return true;
  
  return false;
};

/**
 * Normalizes a Kenyan phone number to international format (254XXXXXXXXX)
 * @param {string} phoneNumber - The phone number to normalize
 * @returns {string|null} - Normalized phone number or null if invalid
 */
const normalizeKenyanPhone = (phoneNumber) => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return null;
  }

  const cleaned = phoneNumber.trim().replace(/[\s\-\(\)]/g, '');
  const digitsOnly = cleaned.replace(/^\+/, '');

  if (!/^\d+$/.test(digitsOnly)) {
    return null;
  }

  // 0712345678 -> 254712345678
  if (/^0[17]\d{8}$/.test(digitsOnly)) {
    return `254${digitsOnly.slice(1)}`;
  }

  // 712345678 -> 254712345678
  if (/^[17]\d{8}$/.test(digitsOnly)) {
    return `254${digitsOnly}`;
  }

  // Already normalized
  if (/^254[17]\d{8}$/.test(digitsOnly)) {
    return digitsOnly;
  }

  return null;
};

/**
 * Validates phone number and throws error if invalid
 * @param {string} phoneNumber - The phone number to validate
 * @throws {Error} - If phone number is invalid
 */
const validatePhoneOrThrow = (phoneNumber) => {
  if (!phoneNumber || phoneNumber.trim() === '') {
    throw new Error('Phone number is required');
  }

  if (!isValidKenyanPhone(phoneNumber)) {
    throw new Error('Invalid Kenyan phone number. Expected format: 0712345678 or 254712345678');
  }
};

module.exports = {
  isValidKenyanPhone,
  normalizeKenyanPhone,
  validatePhoneOrThrow
};
