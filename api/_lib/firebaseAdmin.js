// Firebase Admin SDK — SERVER ONLY. Never import this from src/.
// Credentials come from server env vars (no VITE_ prefix), see .env.example.
// When FIREBASE_AUTH_EMULATOR_HOST / FIRESTORE_EMULATOR_HOST are set (local
// tests), the SDK talks to the emulators and no service account is needed.
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

/**
 * Accepts the service-account private key in the formats people end up pasting:
 * with real or escaped (\\n) newlines, wrapped in stray quotes/spaces, or as the
 * bare base64 body without the BEGIN/END lines. Returns a PEM string.
 */
export function normalizePrivateKey(raw) {
  if (!raw) return raw;
  let key = raw
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\\n/g, '\n')
    .trim();
  if (!key.includes('-----BEGIN')) {
    const body = key.replace(/\s+/g, '');
    const lines = body.match(/.{1,64}/g) ?? [];
    key = ['-----BEGIN PRIVATE KEY-----', ...lines, '-----END PRIVATE KEY-----'].join('\n');
  }
  return `${key}\n`;
}

function init() {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const usingEmulators =
    process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST;

  if (usingEmulators) {
    // In emulator mode the SDK accepts unsigned tokens — never allow it on Vercel.
    if (process.env.VERCEL) {
      throw new Error('Emulator env vars must not be set in a Vercel deployment');
    }
    return initializeApp({ projectId });
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Server Firebase credentials missing: set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY',
    );
  }
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

const app = init();
export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
export { FieldValue };
