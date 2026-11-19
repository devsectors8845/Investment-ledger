// Super admin → admin account management.
// POST /api/admins/create | block | unblock | delete | extend-plan
// One dynamic route = one Vercel function (Hobby plan allows 12 per deploy).
//
// Consistency rules:
// - Every Firestore change and its auditLog entry are written atomically
//   (same batch / transaction).
// - Status changes run in a transaction that checks the expected current
//   status, so concurrent block / unblock / delete calls cannot contradict
//   each other.
// - Auth and Firestore can't share a transaction, so each action orders its
//   steps so a partial failure always leaves the account LESS accessible
//   (Firestore status is what the app and API check), and a retry completes it.
import { adminAuth, adminDb, FieldValue } from '../_lib/firebaseAdmin.js';
import { requireRole } from '../_lib/auth.js';
import { HttpError, postHandler } from '../_lib/http.js';
import {
  requireEmail,
  requireFutureDate,
  requirePassword,
  requirePlan,
  requireString,
  requireUid,
} from '../_lib/validate.js';

const now = () => FieldValue.serverTimestamp();

/** Adds an audit entry to a batch or transaction. */
function audit(writer, actorId, action, targetId, extra = {}) {
  writer.set(adminDb.collection('auditLog').doc(), {
    actorId,
    action,
    targetId,
    ...extra,
    at: now(),
  });
}

/** Reads an admin's profile inside a transaction; 404 unless it's a non-deleted admin. */
async function getAdmin(tx, uid) {
  const ref = adminDb.doc(`users/${uid}`);
  const data = (await tx.get(ref)).data();
  if (!data || data.role !== 'admin' || data.status === 'deleted') {
    throw new HttpError(404, 'Admin not found');
  }
  return { ref, data };
}

const notFoundToConflict = (err) => {
  if (err.code === 'auth/user-not-found') {
    throw new HttpError(409, 'This admin’s login no longer exists. Delete them to finish cleanup.');
  }
  throw err;
};

const ACTIONS = {
  async create(actor, body) {
    const name = requireString(body.name, 'Name', { min: 2, max: 80 });
    const email = requireEmail(body.email);
    const password = requirePassword(body.password);
    const plan = requirePlan(body.plan);
    const expiresAt = requireFutureDate(body.expiresAt);

    let authUser;
    try {
      authUser = await adminAuth.createUser({ email, password, displayName: name });
    } catch (err) {
      if (err.code === 'auth/email-already-exists') {
        throw new HttpError(409, 'An account with this email already exists');
      }
      throw err;
    }

    try {
      const batch = adminDb.batch();
      batch.set(adminDb.doc(`users/${authUser.uid}`), {
        role: 'admin',
        name,
        email,
        status: 'active',
        createdBy: actor.uid,
        createdAt: now(),
        updatedAt: now(),
      });
      batch.set(adminDb.doc(`plans/${authUser.uid}`), {
        name: plan,
        startsAt: now(),
        expiresAt,
        updatedAt: now(),
      });
      audit(batch, actor.uid, 'admin.create', authUser.uid, { email, plan });
      await batch.commit();
    } catch (err) {
      await adminAuth.deleteUser(authUser.uid).catch(() => {}); // roll back the login
      throw err;
    }
    return { uid: authUser.uid };
  },

  // Firestore first (app + API lock out immediately), then disable the login.
  async block(actor, body) {
    const uid = requireUid(body.uid);
    await adminDb.runTransaction(async (tx) => {
      const { ref, data } = await getAdmin(tx, uid);
      if (data.status !== 'active') throw new HttpError(409, 'Admin is already blocked');
      tx.update(ref, { status: 'blocked', updatedAt: now() });
      audit(tx, actor.uid, 'admin.block', uid);
    });
    await adminAuth.updateUser(uid, { disabled: true }).catch(notFoundToConflict);
    await adminAuth.revokeRefreshTokens(uid);
    return {};
  },

  // Enable the login first, then flip Firestore only if still blocked
  // (a concurrent delete/unblock makes the transaction refuse).
  async unblock(actor, body) {
    const uid = requireUid(body.uid);
    const current = await adminDb.runTransaction((tx) => getAdmin(tx, uid));
    if (current.data.status !== 'blocked') throw new HttpError(409, 'Admin is not blocked');
    await adminAuth.updateUser(uid, { disabled: false }).catch(notFoundToConflict);
    await adminDb.runTransaction(async (tx) => {
      const { ref, data } = await getAdmin(tx, uid);
      if (data.status !== 'blocked') throw new HttpError(409, 'Admin status changed — refresh');
      tx.update(ref, { status: 'active', updatedAt: now() });
      audit(tx, actor.uid, 'admin.unblock', uid);
    });
    return {};
  },

  // Delete the login first; if the Firestore step then fails, retrying
  // delete finishes it (the missing Auth user is ignored).
  async delete(actor, body) {
    const uid = requireUid(body.uid);
    await adminDb.runTransaction((tx) => getAdmin(tx, uid)); // 404 early if not deletable
    await adminAuth.deleteUser(uid).catch((err) => {
      if (err.code !== 'auth/user-not-found') throw err;
    });
    await adminDb.runTransaction(async (tx) => {
      const { ref } = await getAdmin(tx, uid);
      tx.update(ref, { status: 'deleted', deletedAt: now(), updatedAt: now() });
      audit(tx, actor.uid, 'admin.delete', uid);
    });
    return {};
  },

  async 'extend-plan'(actor, body) {
    const uid = requireUid(body.uid);
    const plan = requirePlan(body.plan);
    const expiresAt = requireFutureDate(body.expiresAt);
    await adminDb.runTransaction(async (tx) => {
      const { ref } = await getAdmin(tx, uid);
      tx.set(
        adminDb.doc(`plans/${uid}`),
        { name: plan, expiresAt, updatedAt: now() },
        { merge: true },
      );
      tx.update(ref, { updatedAt: now() });
      audit(tx, actor.uid, 'admin.extend-plan', uid, { plan, expiresAt });
    });
    return {};
  },
};

export default postHandler(async (req, body) => {
  const action = req.query?.action;
  const run = Object.hasOwn(ACTIONS, action) ? ACTIONS[action] : null;
  if (!run) throw new HttpError(404, 'Unknown action');
  const actor = await requireRole(req, 'superadmin');
  return run(actor, body);
});
