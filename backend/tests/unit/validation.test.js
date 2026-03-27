const {
  validateEmail,
  validatePhoneNumber,
  validatePassword,
  validateRating,
  sanitizeInput,
} = require('../../src/utils/validation');

const {
  isValidKenyanPhone,
  normalizeKenyanPhone,
  validatePhoneOrThrow,
} = require('../../src/utils/phoneValidation');

describe('validation utils', () => {
  test('validateEmail accepts a valid email and rejects invalid email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('bad-email')).toBe(false);
  });

  test('validatePhoneNumber accepts Kenyan local/international format', () => {
    expect(validatePhoneNumber('0712345678')).toBe(true);
    expect(validatePhoneNumber('+254712345678')).toBe(true);
    expect(validatePhoneNumber('712345678')).toBe(false);
  });

  test('validatePassword enforces complexity', () => {
    expect(validatePassword('Strong@123')).toBe(true);
    expect(validatePassword('weakpass')).toBe(false);
  });

  test('validateRating enforces range 1..5', () => {
    expect(validateRating(1)).toBe(true);
    expect(validateRating(5)).toBe(true);
    expect(validateRating(0)).toBe(false);
    expect(validateRating(6)).toBe(false);
  });

  test('sanitizeInput trims and strips angle brackets', () => {
    expect(sanitizeInput('  <script>alert(1)</script>  ')).toBe('scriptalert(1)/script');
    expect(sanitizeInput(123)).toBe(123);
  });
});

describe('phoneValidation utils', () => {
  test('isValidKenyanPhone validates supported formats', () => {
    expect(isValidKenyanPhone('0712345678')).toBe(true);
    expect(isValidKenyanPhone('712345678')).toBe(true);
    expect(isValidKenyanPhone('254712345678')).toBe(true);
    expect(isValidKenyanPhone('12345')).toBe(false);
  });

  test('normalizeKenyanPhone normalizes to 254 format', () => {
    expect(normalizeKenyanPhone('0712345678')).toBe('254712345678');
    expect(normalizeKenyanPhone('712345678')).toBe('254712345678');
    expect(normalizeKenyanPhone('254712345678')).toBe('254712345678');
    expect(normalizeKenyanPhone('abc')).toBeNull();
  });

  test('validatePhoneOrThrow throws for invalid input', () => {
    expect(() => validatePhoneOrThrow('')).toThrow('Phone number is required');
    expect(() => validatePhoneOrThrow('invalid')).toThrow('Invalid Kenyan phone number');
    expect(() => validatePhoneOrThrow('0712345678')).not.toThrow();
  });
});
