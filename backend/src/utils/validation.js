const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhoneNumber = (phone) => {
  const phoneRegex = /^(\+254|0)[0-9]{9}$/;
  return phoneRegex.test(phone);
};

const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const validateRegistrationNumber = (regNumber) => {
  // Kenya registration format
  const regRegex = /^[A-Z]{3}[-\s]?[0-9]{3}[A-Z]{1}|[A-Z]{2}[-\s]?[0-9]{2}[-\s]?[A-Z]{3}$/;
  return regRegex.test(regNumber);
};

const validateRating = (rating) => {
  return rating >= 1 && rating <= 5;
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

module.exports = {
  validateEmail,
  validatePhoneNumber,
  validatePassword,
  validateRegistrationNumber,
  validateRating,
  sanitizeInput,
};
