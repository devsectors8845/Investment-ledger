// Firebase client configuration — the single place the app initialises Firebase.
// Values come from VITE_* env vars (see .env.example). Firebase web config
// identifies the project; access is enforced by Auth + Firestore security rules.
// Server-only secrets (service account) are NOT here — they live in /api.
import { initializeApp, getApps } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missing = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const isFirebaseConfigured = missing.length === 0;

if (!isFirebaseConfigured) {
  console.warn(
    `[firebase] Missing env values: ${missing.join(', ')}. Copy .env.example to .env.local and fill it in.`,
  );
}

// When config is missing, Firebase is not initialised (getAuth would throw and
// white-screen the app). Consumers must handle null auth/db — the login pages
// then show a "Firebase is not configured" notice instead.
export const app = isFirebaseConfigured ? (getApps()[0] ?? initializeApp(firebaseConfig)) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

// Local development / tests against the Firebase Emulator Suite (`pnpm emulators`).
export const usingEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';
if (app && usingEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

export const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Messaging is not available in every browser (e.g. some iOS versions),
// so it is created lazily and returns null when unsupported.
let messagingPromise;
export function getMessagingIfSupported() {
  messagingPromise ??= app
    ? isSupported().then((ok) => (ok ? getMessaging(app) : null))
    : Promise.resolve(null);
  return messagingPromise;
}
