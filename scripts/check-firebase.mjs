#!/usr/bin/env node
// Verifies .env.local can reach Firebase. Prints only pass/fail — never values.
// Usage: pnpm check:firebase
const results = [];
const ok = (label, pass, hint = '') => {
  results.push(pass);
  console.log(`${pass ? '✔' : '✖'} ${label}${!pass && hint ? ` — ${hint}` : ''}`);
};
/** Error text without anything that could be a secret (long tokens are masked). */
const safe = (err) =>
  `${err.code ?? err.name ?? 'error'}: ${String(err.message ?? '')
    .split('\n')[0]
    .replace(/[A-Za-z0-9+/=_-]{24,}/g, '[…]')
    .slice(0, 160)}`;

const env = process.env;
const REQUIRED = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

console.log('Environment');
for (const name of REQUIRED) ok(name, Boolean(env[name]?.trim()), 'missing or empty');
console.log(
  `${env.VITE_FIREBASE_VAPID_KEY?.trim() ? '✔' : '•'} VITE_FIREBASE_VAPID_KEY (optional until Day 6)`,
);
ok(
  'Browser and server project IDs match',
  env.VITE_FIREBASE_PROJECT_ID === env.FIREBASE_PROJECT_ID,
  'VITE_FIREBASE_PROJECT_ID and FIREBASE_PROJECT_ID differ',
);
const rawKey = env.FIREBASE_PRIVATE_KEY ?? '';
console.log(
  `${rawKey.replace(/\\n/g, '\n').includes('-----BEGIN PRIVATE KEY-----') ? '✔' : '•'} Private key format ${
    rawKey.includes('-----BEGIN')
      ? '(full PEM)'
      : '(body only — BEGIN/END lines added automatically)'
  }`,
);
ok(
  'Client email looks like a service account',
  /@.+\.iam\.gserviceaccount\.com$/.test(env.FIREBASE_CLIENT_EMAIL ?? ''),
  'use "client_email" from the JSON',
);

if (env.FIREBASE_AUTH_EMULATOR_HOST || env.FIRESTORE_EMULATOR_HOST) {
  console.log(
    '\n✖ Emulator variables are set in this shell — unset them to check the real project.',
  );
  process.exit(1);
}

console.log('\nFirebase connection');
let adminAuth;
let adminDb;
try {
  ({ adminAuth, adminDb } = await import('../api/_lib/firebaseAdmin.js'));
  ok('Server credentials load', true);
} catch (err) {
  ok('Server credentials load', false, safe(err));
}

if (adminAuth) {
  try {
    await adminAuth.listUsers(1);
    ok('Service account accepted by Firebase Auth', true);
  } catch (err) {
    ok('Service account accepted by Firebase Auth', false, safe(err));
  }
  try {
    await adminDb.doc('users/healthcheck-probe').get();
    ok('Firestore database reachable', true);
  } catch (err) {
    ok('Firestore database reachable', false, safe(err));
  }
}

if (env.VITE_FIREBASE_API_KEY) {
  // Sign-in attempt with a random non-existent account: the *kind* of error tells us
  // whether Email/Password sign-in is enabled. Creates nothing.
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(env.VITE_FIREBASE_API_KEY)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `healthcheck-${process.pid}@example.invalid`,
          password: 'not-a-real-password-1',
          returnSecureToken: true,
        }),
      },
    );
    const msg = (await res.json()).error?.message ?? '';
    if (/OPERATION_NOT_ALLOWED|PASSWORD_LOGIN_DISABLED/.test(msg)) {
      ok('Email/Password sign-in enabled', false, 'enable it in Authentication → Sign-in method');
    } else if (/API_KEY|API key/i.test(msg)) {
      ok('Browser API key valid', false, msg.split(':')[0]);
    } else {
      ok('Browser API key valid', true);
      ok('Email/Password sign-in enabled', true);
    }
  } catch (err) {
    ok('Auth REST reachable', false, safe(err));
  }
}

const failed = results.filter((r) => !r).length;
console.log(failed ? `\n${failed} check(s) need attention.` : '\nAll checks passed.');
process.exit(failed ? 1 : 0);
