// Day 2 tests — run with `pnpm test:emulator` (starts Auth + Firestore emulators).
// Covers /api/admins/* (auth, permissions, validation, effects) and Firestore rules.
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { initializeApp as initClient, deleteApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where,
} from 'firebase/firestore';

const PROJECT = 'demo-investledger';
process.env.FIREBASE_PROJECT_ID = PROJECT;
assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'run via `pnpm test:emulator`');

const { adminAuth, adminDb } = await import('../api/_lib/firebaseAdmin.js');
const { default: handler } = await import('../api/admins/[action].js');

const SUPER = { email: 'owner@example.com', password: 'Sup3r-secret-pw' };
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST;
const future = (days) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

async function signIn({ email, password }) {
  const res = await fetch(
    `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? 'sign-in failed');
  return data.idToken;
}

/** Calls the API handler the way Vercel would. */
async function call(action, body, token, method = 'POST') {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  const req = { method, headers, body, query: { action } };
  let status;
  let payload;
  const res = {
    statusCode: 200,
    setHeader() {},
    end(text) {
      status = this.statusCode;
      payload = text ? JSON.parse(text) : null;
    },
  };
  await handler(req, res);
  return { status, body: payload };
}

/** A browser-like client SDK instance signed in as `creds` (for rules tests). */
async function clientAs(creds, name) {
  const app = initClient({ apiKey: 'fake', projectId: PROJECT }, name);
  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${AUTH_HOST}`, { disableWarnings: true });
  const db = getFirestore(app);
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
  connectFirestoreEmulator(db, host, Number(port));
  await signInWithEmailAndPassword(auth, creds.email, creds.password);
  return { app, db };
}

let superToken;
const clients = [];

before(async () => {
  // Clean slate
  await fetch(`http://${AUTH_HOST}/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' });
  await fetch(
    `http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`,
    { method: 'DELETE' },
  );
  // Bootstrap script (same command the README documents)
  await promisify(execFile)(process.execPath, [
    'scripts/create-super-admin.mjs',
    '--email',
    SUPER.email,
    '--password',
    SUPER.password,
    '--name',
    'Owner',
  ]);
  superToken = await signIn(SUPER);
});

after(async () => {
  await Promise.all(clients.map((c) => deleteApp(c.app)));
});

describe('bootstrap script', () => {
  test('creates an active superadmin profile', async () => {
    const user = await adminAuth.getUserByEmail(SUPER.email);
    const profile = (await adminDb.doc(`users/${user.uid}`).get()).data();
    assert.equal(profile.role, 'superadmin');
    assert.equal(profile.status, 'active');
  });

  test('re-running keeps the original createdAt and accepts the password via env', async () => {
    const user = await adminAuth.getUserByEmail(SUPER.email);
    const before = (await adminDb.doc(`users/${user.uid}`).get()).data().createdAt;
    await promisify(execFile)(
      process.execPath,
      ['scripts/create-super-admin.mjs', '--', '--email', SUPER.email, '--name', 'Owner'],
      { env: { ...process.env, SUPER_ADMIN_PASSWORD: SUPER.password } },
    );
    const after = (await adminDb.doc(`users/${user.uid}`).get()).data().createdAt;
    assert.ok(before.isEqual(after));
    // resetting the password revokes old sessions — sign in again for later tests
    superToken = await signIn(SUPER);
  });
});

describe('/api/admins — request guards', () => {
  test('rejects missing token with 401', async () => {
    const r = await call('create', {}, null);
    assert.equal(r.status, 401);
  });
  test('rejects a garbage token with 401', async () => {
    const r = await call('create', {}, 'not-a-token');
    assert.equal(r.status, 401);
  });
  test('rejects GET with 405', async () => {
    const r = await call('create', {}, superToken, 'GET');
    assert.equal(r.status, 405);
  });
  test('rejects unknown action with 404', async () => {
    const r = await call('nope', {}, superToken);
    assert.equal(r.status, 404);
  });
  test('rejects prototype-ish action names with 404', async () => {
    const r = await call('constructor', {}, superToken);
    assert.equal(r.status, 404);
  });
  for (const [label, body] of [
    ['malformed JSON', '{"name":'],
    ['JSON null', 'null'],
    ['JSON array', '[1,2]'],
    ['JSON number', '42'],
  ]) {
    test(`400 on ${label} body`, async () => {
      const r = await call('create', body, superToken);
      assert.equal(r.status, 400, JSON.stringify(r.body));
    });
  }
});

describe('/api/admins/create — validation', () => {
  const base = {
    name: 'Valid Name',
    email: 'valid@example.com',
    password: 'abc12345',
    plan: 'Monthly',
    expiresAt: future(30),
  };
  for (const [label, patch] of [
    ['short name', { name: 'A' }],
    ['bad email', { email: 'not-an-email' }],
    ['short password', { password: 'a1' }],
    ['password without digits', { password: 'abcdefghij' }],
    ['unknown plan', { plan: 'Lifetime' }],
    ['past expiry', { expiresAt: '2020-01-01' }],
    ['malformed date', { expiresAt: 'tomorrow' }],
  ]) {
    test(`400 on ${label}`, async () => {
      const r = await call('create', { ...base, ...patch }, superToken);
      assert.equal(r.status, 400, JSON.stringify(r.body));
    });
  }
});

describe('/api/admins — lifecycle', () => {
  const ADMIN = { email: 'trainer.one@example.com', password: 'Trainer123' };
  let adminUid;

  test('super admin creates an admin (Auth user + profile + plan + audit)', async () => {
    const r = await call(
      'create',
      { name: 'Trainer One', ...ADMIN, plan: 'Quarterly', expiresAt: future(90) },
      superToken,
    );
    assert.equal(r.status, 200, JSON.stringify(r.body));
    adminUid = r.body.uid;

    const profile = (await adminDb.doc(`users/${adminUid}`).get()).data();
    assert.equal(profile.role, 'admin');
    assert.equal(profile.status, 'active');
    assert.equal(profile.email, ADMIN.email);

    const plan = (await adminDb.doc(`plans/${adminUid}`).get()).data();
    assert.equal(plan.name, 'Quarterly');

    const audit = await adminDb.collection('auditLog').where('targetId', '==', adminUid).get();
    assert.equal(audit.docs[0].data().action, 'admin.create');
  });

  test('duplicate email → 409', async () => {
    const r = await call(
      'create',
      { name: 'Dup', ...ADMIN, plan: 'Monthly', expiresAt: future(30) },
      superToken,
    );
    assert.equal(r.status, 409);
  });

  test('an admin cannot call super-admin endpoints (403)', async () => {
    const adminToken = await signIn(ADMIN);
    const r = await call(
      'create',
      {
        name: 'Sneaky',
        email: 'x@example.com',
        password: 'abc12345',
        plan: 'Monthly',
        expiresAt: future(5),
      },
      adminToken,
    );
    assert.equal(r.status, 403);
  });

  test('cannot target the super admin account (404)', async () => {
    const owner = await adminAuth.getUserByEmail(SUPER.email);
    const r = await call('block', { uid: owner.uid }, superToken);
    assert.equal(r.status, 404);
  });

  test('block disables login and marks profile blocked', async () => {
    const tokenBefore = await signIn(ADMIN);
    const preBlock = await clientAs(ADMIN, 'admin-pre-block'); // signed in before the block
    clients.push(preBlock);
    const r = await call('block', { uid: adminUid }, superToken);
    assert.equal(r.status, 200);
    assert.equal((await adminAuth.getUser(adminUid)).disabled, true);
    assert.equal((await adminDb.doc(`users/${adminUid}`).get()).data().status, 'blocked');
    await assert.rejects(signIn(ADMIN), /USER_DISABLED/);
    // a token issued before the block is no longer accepted by the API
    const stale = await call('create', {}, tokenBefore);
    assert.equal(stale.status, 401);
    // ...and Firestore rules deny it reading its own profile / plan with that old token
    await assert.rejects(getDoc(doc(preBlock.db, 'users', adminUid)), /permission/i);
    await assert.rejects(getDoc(doc(preBlock.db, 'plans', adminUid)), /permission/i);
  });

  test('blocking an already-blocked admin → 409', async () => {
    const r = await call('block', { uid: adminUid }, superToken);
    assert.equal(r.status, 409);
  });

  test('unblock restores login', async () => {
    const r = await call('unblock', { uid: adminUid }, superToken);
    assert.equal(r.status, 200);
    assert.equal((await adminDb.doc(`users/${adminUid}`).get()).data().status, 'active');
    assert.ok(await signIn(ADMIN));
    const again = await call('unblock', { uid: adminUid }, superToken);
    assert.equal(again.status, 409);
  });

  test('extend-plan updates plan + expiry', async () => {
    const r = await call(
      'extend-plan',
      { uid: adminUid, plan: 'Yearly', expiresAt: future(365) },
      superToken,
    );
    assert.equal(r.status, 200);
    const plan = (await adminDb.doc(`plans/${adminUid}`).get()).data();
    assert.equal(plan.name, 'Yearly');
    assert.ok(plan.expiresAt.toDate() > new Date(Date.now() + 360 * 86_400_000));
  });

  describe('Firestore rules', () => {
    test('admin can read own profile and own plan', async () => {
      const c = await clientAs(ADMIN, 'admin-1');
      clients.push(c);
      assert.equal((await getDoc(doc(c.db, 'users', adminUid))).data().role, 'admin');
      assert.equal((await getDoc(doc(c.db, 'plans', adminUid))).data().name, 'Yearly');
    });

    test('admin cannot list users, read other profiles, audit log, or write', async () => {
      const c = clients.find((x) => x.app.name === 'admin-1');
      await assert.rejects(
        getDocs(query(collection(c.db, 'users'), where('role', '==', 'admin'))),
        /permission/i,
      );
      const owner = await adminAuth.getUserByEmail(SUPER.email);
      await assert.rejects(getDoc(doc(c.db, 'users', owner.uid)), /permission/i);
      await assert.rejects(getDocs(collection(c.db, 'auditLog')), /permission/i);
      await assert.rejects(
        setDoc(doc(c.db, 'users', adminUid), { role: 'superadmin' }, { merge: true }),
        /permission/i,
      );
    });

    test('super admin can list admins, plans and audit log, but not write', async () => {
      const c = await clientAs(SUPER, 'super-1');
      clients.push(c);
      const admins = await getDocs(query(collection(c.db, 'users'), where('role', '==', 'admin')));
      assert.equal(admins.size, 1);
      assert.equal((await getDocs(collection(c.db, 'plans'))).size, 1);
      assert.ok((await getDocs(collection(c.db, 'auditLog'))).size >= 4);
      await assert.rejects(
        setDoc(doc(c.db, 'plans', adminUid), { name: 'Free' }, { merge: true }),
        /permission/i,
      );
    });
  });

  test('delete removes the login and marks profile deleted', async () => {
    const r = await call('delete', { uid: adminUid }, superToken);
    assert.equal(r.status, 200);
    await assert.rejects(adminAuth.getUser(adminUid), /no user record/i);
    assert.equal((await adminDb.doc(`users/${adminUid}`).get()).data().status, 'deleted');
    const again = await call('delete', { uid: adminUid }, superToken);
    assert.equal(again.status, 404);
  });

  test('every action wrote exactly one audit entry', async () => {
    const audit = await adminDb.collection('auditLog').where('targetId', '==', adminUid).get();
    const actions = audit.docs.map((d) => d.data().action).sort();
    assert.deepEqual(actions, [
      'admin.block',
      'admin.create',
      'admin.delete',
      'admin.extend-plan',
      'admin.unblock',
    ]);
  });
});
