import { inputDateFromNow } from './format';

export const PLAN_OPTIONS = [
  { value: 'Monthly', days: 30 },
  { value: 'Quarterly', days: 90 },
  { value: 'Yearly', days: 365 },
];

/** Random 12-char temporary password with letters and digits. */
export function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint32Array(12));
  const pwd = Array.from(bytes, (b) => chars[b % chars.length]).join('');
  return /\d/.test(pwd) && /[A-Za-z]/.test(pwd) ? pwd : generatePassword();
}

export function validateAdminForm(form) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = 'Enter at least 2 characters';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email';
  if (form.password.length < 8) errors.password = 'At least 8 characters';
  else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
    errors.password = 'Use letters and numbers';
  if (!form.expiresAt) errors.expiresAt = 'Pick a date';
  else if (form.expiresAt <= inputDateFromNow(0)) errors.expiresAt = 'Must be after today';
  return errors;
}
