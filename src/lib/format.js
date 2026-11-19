/** Firestore Timestamp | Date | null → Date | null */
export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  return null;
}

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
const TIME_FMT = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});

/** "November 12, 2026" */
export function formatDate(value) {
  const d = toDate(value);
  return d ? DATE_FMT.format(d) : '—';
}

/** "09:06:10 PM" */
export function formatTime(value) {
  const d = toDate(value);
  return d ? TIME_FMT.format(d) : '';
}

// ---- Plan expiry dates -------------------------------------------------
// A plan expiry is a calendar date the super admin picks ("YYYY-MM-DD").
// The server stores it as 23:59:59 UTC on that date, so we always display it
// in UTC (shows exactly the picked date) and compare against the viewer's
// local "today".

const DAY_MS = 86_400_000;
const PLAN_DATE_FMT = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});

/** Viewer's local date as "YYYY-MM-DD". */
export function localToday() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "YYYY-MM-DD" + n days → "YYYY-MM-DD" (calendar arithmetic, no timezone drift). */
export function addDays(ymd, n) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + n * DAY_MS).toISOString().slice(0, 10);
}

/** Local today + n days as "YYYY-MM-DD" (for <input type="date">). */
export function inputDateFromNow(days) {
  return addDays(localToday(), days);
}

/** Stored plan expiry → the "YYYY-MM-DD" that was picked. */
export function planDateToInput(value) {
  const d = toDate(value);
  return d ? d.toISOString().slice(0, 10) : null;
}

/** "December 1, 2026" — the picked date, regardless of viewer timezone. */
export function formatPlanDate(value) {
  const d = toDate(value);
  return d ? PLAN_DATE_FMT.format(d) : '—';
}

/** Calendar days from the viewer's today until the plan expiry (negative when past). */
export function planDaysLeft(value) {
  const ymd = planDateToInput(value);
  if (!ymd) return null;
  const toUtc = (s) => Date.UTC(...s.split('-').map((n, i) => Number(n) - (i === 1 ? 1 : 0)));
  return Math.round((toUtc(ymd) - toUtc(localToday())) / DAY_MS);
}
