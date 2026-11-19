#!/usr/bin/env node
// One-time bootstrap: creates (or promotes) the super admin account.
// Usage (recommended — keeps the password out of shell history and `ps`):
//   SUPER_ADMIN_PASSWORD='<strong>' pnpm create-super-admin --email owner@example.com --name "Owner"
// `--password` also works but is visible to other local processes.
// Reads server credentials from .env.local (via `node --env-file-if-exists`).
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  // tolerate `pnpm create-super-admin -- --email …` (npm-style separator)
  args: process.argv.slice(2).filter((a, i) => !(i === 0 && a === '--')),
  options: {
    email: { type: 'string' },
    password: { type: 'string' },
    name: { type: 'string', default: 'Super Admin' },
  },
});

values.password ??= process.env.SUPER_ADMIN_PASSWORD;

if (!values.email || !values.password) {
  console.error(
    'Usage: SUPER_ADMIN_PASSWORD=<password> pnpm create-super-admin --email <email> [--name <name>]',
  );
  process.exit(1);
}
if (values.password.length < 10) {
  console.error('Password must be at least 10 characters.');
  process.exit(1);
}

const { adminAuth, adminDb, FieldValue } = await import('../api/_lib/firebaseAdmin.js');

const email = values.email.trim().toLowerCase();
let user;
try {
  user = await adminAuth.getUserByEmail(email);
  await adminAuth.updateUser(user.uid, {
    password: values.password,
    displayName: values.name,
    disabled: false,
  });
  console.log(`Existing account found — promoting ${email} to super admin.`);
} catch (err) {
  if (err.code !== 'auth/user-not-found') throw err;
  user = await adminAuth.createUser({ email, password: values.password, displayName: values.name });
  console.log(`Created account ${email}.`);
}

const ref = adminDb.doc(`users/${user.uid}`);
const existing = await ref.get();
await ref.set(
  {
    role: 'superadmin',
    name: values.name,
    email,
    status: 'active',
    ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    updatedAt: FieldValue.serverTimestamp(),
  },
  { merge: true },
);
console.log(`Done. Sign in at /super/login (uid ${user.uid}).`);
process.exit(0);
