# Setup & Deployment

## 1. Prerequisites

- Node.js 20+ and pnpm
- A Firebase project (free Spark plan is fine)
- A Vercel account

## 2. Firebase project

1. Firebase console → **Add project**.
2. **Build → Authentication → Sign-in method** → enable **Email/Password**.
3. **Build → Firestore Database** → create database (production mode).
4. **Project settings → General → Your apps** → add a **Web app**. Copy the
   config values into `.env.local` (see below).
5. **Project settings → Cloud Messaging → Web Push certificates** → generate a
   key pair. Copy the key into `VITE_FIREBASE_VAPID_KEY`.
6. **Project settings → Service accounts** → **Generate new private key**.
   Keep the JSON file safe and **never commit it**. Copy `project_id`,
   `client_email` and `private_key` into the server variables.

## 3. Local environment

```bash
cp .env.example .env.local
# fill in the values
pnpm install
pnpm dev
```

`.env.local` is git-ignored. Only `.env.example` (names, no values) is
committed.

`FIREBASE_PRIVATE_KEY` contains line breaks. Paste it on one line with `\n`
between lines, wrapped in double quotes. The server code converts `\n` back.

## 4. Create the first super admin (one time)

```bash
SUPER_ADMIN_PASSWORD='<strong password>' pnpm create-super-admin --email owner@example.com --name "Owner"
```

Re-running it with the same email resets that account's password and makes
sure it is an active super admin.

## 5. Deploy to Vercel

1. Push the repo to GitHub/GitLab and **Import** it in Vercel.
2. Framework preset: **Vite**. Build: `pnpm build`. Output: `dist`.
3. **Settings → Environment Variables** → add every variable from
   `.env.example` for Production (and Preview if wanted).
4. Deploy.
5. Firebase console → **Authentication → Settings → Authorized domains** → add
   the Vercel domain.

`vercel.json` rewrites all non-`/api` paths to `index.html`, so deep links like
`/admin/clients` work on refresh.

## 6. Running the `/api` functions locally

`pnpm dev` serves both the app and the `/api` functions (via a dev-only Vite
middleware), using the server variables in `.env.local`. No Vercel CLI needed.

## 7. Local testing with the Firebase emulators (no real project needed)

Java 11+ and the Firebase CLI (`npm i -g firebase-tools`) are required.

```bash
pnpm test:emulator     # starts Auth + Firestore emulators, runs tests/*.test.mjs, stops them
```

To click around against the emulators instead of a real project:

```bash
pnpm emulators         # terminal 1 — emulator UI at http://localhost:4000
# terminal 2 — these env vars override .env.local for this shell only
export VITE_USE_EMULATORS=true VITE_FIREBASE_PROJECT_ID=demo-investledger \
  VITE_FIREBASE_API_KEY=demo-key VITE_FIREBASE_AUTH_DOMAIN=localhost \
  VITE_FIREBASE_STORAGE_BUCKET=demo VITE_FIREBASE_MESSAGING_SENDER_ID=1 \
  VITE_FIREBASE_APP_ID=1:1:web:1 FIREBASE_PROJECT_ID=demo-investledger \
  FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
SUPER_ADMIN_PASSWORD='Sup3r-secret-pw' pnpm create-super-admin --email owner@example.com
pnpm dev
```

Emulator data is wiped when the emulators stop.

## 8. Deploy Firestore rules

Rules live in `firestore.rules`. Publish them to the real project with:

```bash
firebase deploy --only firestore:rules --project <your-project-id>
```

Do this after every change to the rules (Day 2 changed them).

## 9. Scripts

| Command                                                    | What it does                             |
| ---------------------------------------------------------- | ---------------------------------------- |
| `pnpm dev`                                                 | Start dev server                         |
| `pnpm build`                                               | Production build to `dist/`              |
| `pnpm preview`                                             | Serve the build locally                  |
| `pnpm lint`                                                | ESLint                                   |
| `pnpm format`                                              | Prettier                                 |
| `SUPER_ADMIN_PASSWORD=… pnpm create-super-admin --email …` | Create / reset the super admin           |
| `pnpm emulators`                                           | Start Auth + Firestore emulators         |
| `pnpm test:emulator`                                       | Run the test suite against the emulators |
