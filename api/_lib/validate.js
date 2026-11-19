import { HttpError } from './http.js';

export const PLANS = ['Monthly', 'Quarterly', 'Yearly'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function requireString(value, field, { min = 1, max = 200 } = {}) {
  if (typeof value !== 'string') throw new HttpError(400, `${field} is required`);
  const v = value.trim();
  if (v.length < min || v.length > max) {
    throw new HttpError(400, `${field} must be ${min}–${max} characters`);
  }
  return v;
}

export function requireEmail(value) {
  const v = requireString(value, 'Email', { max: 254 }).toLowerCase();
  if (!EMAIL_RE.test(v)) throw new HttpError(400, 'Email is not valid');
  return v;
}

export function requirePassword(value) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 128) {
    throw new HttpError(400, 'Password must be 8–128 characters');
  }
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    throw new HttpError(400, 'Password must contain letters and numbers');
  }
  return value;
}

export function requirePlan(value) {
  if (!PLANS.includes(value)) throw new HttpError(400, `Plan must be one of ${PLANS.join(', ')}`);
  return value;
}

/** Accepts "YYYY-MM-DD"; returns a Date at the end of that day (UTC), must be in the future. */
export function requireFutureDate(value, field = 'Expiry date') {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HttpError(400, `${field} must be a date (YYYY-MM-DD)`);
  }
  const date = new Date(`${value}T23:59:59.000Z`);
  if (Number.isNaN(date.getTime())) throw new HttpError(400, `${field} is not a valid date`);
  if (date.getTime() <= Date.now()) throw new HttpError(400, `${field} must be in the future`);
  return date;
}

export function requireUid(value) {
  return requireString(value, 'Admin id', { max: 128 });
}
