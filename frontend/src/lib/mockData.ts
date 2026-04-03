// Vehicle number validation
export function validateVehicleNumber(vehicleNumber: string): boolean {
  if (!vehicleNumber) return false;
  
  // Kenyan vehicle registration format: KXX XXXZ or KXXX XXXZ
  // K = Letter (usually K for Kenya)
  // X = Letter or Number
  // Z = Letter
  const pattern = /^K[A-Z]{2}\s?\d{3}[A-Z]$/i;
  
  return pattern.test(vehicleNumber.trim().toUpperCase());
}

// Phone number validation (Kenyan format)
export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return false;
  
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Valid formats:
  // 07XXXXXXXX (10 digits)
  // 2547XXXXXXXX (12 digits)
  // 7XXXXXXXX (9 digits)
  
  if (digitsOnly.startsWith('254') && digitsOnly.length === 12) return true;
  if (digitsOnly.startsWith('0') && digitsOnly.length === 10) return true;
  if (digitsOnly.startsWith('7') && digitsOnly.length === 9) return true;
  
  return false;
}

// Normalize phone number to international format (254...)
export function normalizePhoneNumber(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.startsWith('254')) return digitsOnly;
  if (digitsOnly.startsWith('0')) return `254${digitsOnly.slice(1)}`;
  if (digitsOnly.startsWith('7')) return `254${digitsOnly}`;
  
  return digitsOnly;
}
