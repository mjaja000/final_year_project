/**
 * Kenya Phone Number Validation Utility
 */

export const isValidKenyanPhone = (phoneNumber: string): boolean => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return false;
  }

  const cleaned = phoneNumber.trim().replace(/[\s\-\(\)]/g, '');
  const digitsOnly = cleaned.replace(/^\+/, '');
  
  if (!/^\d+$/.test(digitsOnly)) {
    return false;
  }

  // 0712345678, 712345678, 254712345678
  if (/^0[17]\d{8}$/.test(digitsOnly)) return true;
  if (/^[17]\d{8}$/.test(digitsOnly)) return true;
  if (/^254[17]\d{8}$/.test(digitsOnly)) return true;
  
  return false;
};

export const normalizeKenyanPhone = (phoneNumber: string): string | null => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return null;
  }

  const cleaned = phoneNumber.trim().replace(/[\s\-\(\)]/g, '');
  const digitsOnly = cleaned.replace(/^\+/, '');

  if (!/^\d+$/.test(digitsOnly)) {
    return null;
  }

  if (/^0[17]\d{8}$/.test(digitsOnly)) {
    return `254${digitsOnly.slice(1)}`;
  }

  if (/^[17]\d{8}$/.test(digitsOnly)) {
    return `254${digitsOnly}`;
  }

  if (/^254[17]\d{8}$/.test(digitsOnly)) {
    return digitsOnly;
  }

  return null;
};

export const formatKenyanPhone = (phoneNumber: string): string => {
  const normalized = normalizeKenyanPhone(phoneNumber);
  
  if (!normalized) {
    return phoneNumber;
  }

  if (normalized.startsWith('254')) {
    const localFormat = `0${normalized.slice(3)}`;
    return `${localFormat.slice(0, 4)} ${localFormat.slice(4, 7)} ${localFormat.slice(7)}`;
  }

  return phoneNumber;
};

export const getPhoneValidationError = (phoneNumber: string): string | null => {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return 'Phone number is required';
  }

  const cleaned = phoneNumber.trim().replace(/[\s\-\(\)\+]/g, '');
  
  if (!/^\d+$/.test(cleaned)) {
    return 'Phone number must contain only digits';
  }

  if (!isValidKenyanPhone(phoneNumber)) {
    return 'Please enter a valid Kenyan phone number (e.g., 0712345678)';
  }

  return null;
};
