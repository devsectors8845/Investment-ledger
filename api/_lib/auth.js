import { adminAuth, adminDb } from './firebaseAdmin.js';
import { HttpError } from './http.js';

/**
 * Verifies the caller's Firebase ID token (Authorization: Bearer <token>)
 * and that their users/{uid} doc is active with the required role.
 * Returns { uid, profile }.
 */
export async function requireRole(req, role) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const match = /^Bearer (.+)$/.exec(header);
  if (!match) throw new HttpError(401, 'Not signed in');

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(match[1], true); // true = reject revoked tokens
  } catch {
    throw new HttpError(401, 'Session expired. Please sign in again.');
  }

  const snap = await adminDb.doc(`users/${decoded.uid}`).get();
  const profile = snap.data();
  if (!profile || profile.status !== 'active' || profile.role !== role) {
    throw new HttpError(403, 'You do not have permission to do this.');
  }
  return { uid: decoded.uid, profile };
}
