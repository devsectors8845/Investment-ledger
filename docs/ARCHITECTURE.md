# Architecture — InvestLedger (Practice Edition)

## 1. Overview

A single React app with three panels, sharing one Firebase project and
deployed as one Vercel project.

| Panel       | URL prefix | Who                                 | How they get an account                                 |
| ----------- | ---------- | ----------------------------------- | ------------------------------------------------------- |
| Super Admin | `/super`   | Platform owner (1–2 people)         | Created once with a setup script                        |
| Admin       | `/admin`   | Admins (e.g. trainers / desk leads) | Created by the super admin                              |
| User        | `/app`     | Users (practice traders)            | Self-register **only** through an admin's referral link |

```
Browser (React + Tailwind)
   │  Firebase Web SDK (Auth, Firestore, Messaging)
   ▼
Firebase  ◄──── Vercel Serverless Functions (/api/*, firebase-admin SDK)
   ▲                 │
   │                 └── Public price feed (Coinbase Exchange API)
   └── Firestore security rules enforce roles
```

**Why Vercel functions?** Some actions must not run in the browser:
creating/blocking/deleting other users' logins, opening and settling trades
with a trusted price, changing balances, and sending push notifications. Those need the Firebase **Admin SDK** with a
service-account key, which must stay on the server. Vercel functions in `/api`
do this without needing Firebase's paid Blaze plan.

**One function per group.** Each group is a single dynamic route
(`api/admins/[action].js` serves `/api/admins/create`, `/api/admins/block`, …).
Vercel's free Hobby plan allows 12 functions per deployment; grouping keeps us
at about 4.

**Local development.** `pnpm dev` serves `/api/*` from the same files through a
small Vite dev-only middleware (`vite.config.js`), so the Vercel CLI is not
needed locally. Production uses Vercel's own runtime.

## 2. Tech stack

| Layer    | Choice                                                       |
| -------- | ------------------------------------------------------------ |
| UI       | React 19 + Vite                                              |
| Styling  | Tailwind CSS v4 (theme tokens in `src/index.css`)            |
| Routing  | React Router                                                 |
| Icons    | lucide-react                                                 |
| Auth     | Firebase Authentication (email + password)                   |
| Database | Cloud Firestore                                              |
| Push     | Firebase Cloud Messaging (FCM)                               |
| Server   | Vercel Serverless Functions (`/api`, Node, `firebase-admin`) |
| Prices   | Coinbase Exchange public API (no key needed)                 |
| Hosting  | Vercel                                                       |

## 3. Folder structure

Target structure at the end of Day 7. Items tagged with a day are added on
that day; untagged items exist from Day 1.

```
Investment-ledger/
├── api/                        # Vercel serverless functions (server only)
│   ├── _lib/firebaseAdmin.js   # Admin SDK init from env
│   ├── _lib/auth.js            # Verify caller's ID token + role
│   ├── _lib/http.js            # POST-only wrapper, JSON errors
│   ├── _lib/validate.js        # Input validation
│   ├── admins/[action].js      # Super admin: create/block/unblock/delete/extend-plan (Day 2)
│   ├── clients/[action].js     # Admin: block / unblock / reset balance / delete (Day 3)
│   ├── trades/open.js          # Open a practice trade at the server-fetched price (Day 5)
│   ├── trades/settle.js        # Settle expired practice trades at real price  (Day 5)
│   └── notifications/send.js   # Admin → users push notification               (Day 6)
├── docs/                       # This documentation
├── public/
│   └── firebase-messaging-sw.js
├── scripts/
│   └── create-super-admin.mjs  # One-time bootstrap
├── src/
│   ├── firebase.js             # ← ALL Firebase client config lives here
│   ├── main.jsx / App.jsx      # Entry + routes
│   ├── index.css               # Tailwind + purple/dark theme tokens
│   ├── context/AuthContext.jsx # Current user + role
│   ├── components/
│   │   ├── layout/             # Sidebar, Topbar, PanelLayout
│   │   ├── ui/                 # Button, Card, Badge, Toggle, Modal, Toast…
│   │   └── table/DataTable.jsx # Show N entries / search / sort / paginate
│   ├── routes/ProtectedRoute.jsx
│   └── pages/
│       ├── auth/               # Admin login, Super login, User login, Register
│       ├── super/              # Admins list
│       ├── admin/              # Dashboard, Clients, Trades, Running, Plan, Notifications
│       └── user/               # Dashboard, Market, Contract, Assets
├── firestore.rules
├── firestore.indexes.json
├── .env.example                # Every variable name, no values
└── vercel.json
```

## 4. Environment variables

All values live in `.env.local` (local) and the Vercel project settings
(production). `.env*` files are git-ignored; `.env.example` lists the names.

| Variable                            | Used by       | Secret? |
| ----------------------------------- | ------------- | ------- |
| `VITE_FIREBASE_API_KEY`             | browser       | No*     |
| `VITE_FIREBASE_AUTH_DOMAIN`         | browser       | No*     |
| `VITE_FIREBASE_PROJECT_ID`          | browser       | No*     |
| `VITE_FIREBASE_STORAGE_BUCKET`      | browser       | No*     |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | browser       | No*     |
| `VITE_FIREBASE_APP_ID`              | browser       | No*     |
| `VITE_FIREBASE_VAPID_KEY`           | browser (FCM) | No*     |
| `FIREBASE_PROJECT_ID`               | `/api`        | —       |
| `FIREBASE_CLIENT_EMAIL`             | `/api`        | **Yes** |
| `FIREBASE_PRIVATE_KEY`              | `/api`        | **Yes** |

\* Anything prefixed `VITE_` is bundled into the browser JavaScript. Firebase
web config is **designed** to be public — it identifies the project, it does
not grant access. Access is controlled by Firestore security rules and Auth.
It's still kept in env so nothing is hard-coded and environments can be
swapped. The service-account values (no `VITE_` prefix) **never** reach the
browser.

## 5. Firestore data model

```
users/{uid}
  role: "superadmin" | "admin" | "user"
  name, email, phone?
  status: "active" | "blocked" | "deleted"   # anything but "active" is signed out
  adminId?            # users only: which admin referred them
  createdAt, updatedAt

plans/{adminUid}                # set by super admin
  name: "Monthly" | "Quarterly" | "Yearly"
  startsAt, expiresAt

referralCodes/{code}            # code = random 8 chars
  adminId, active: bool, uses: number, createdAt

practiceAccounts/{userUid}
  balance: number               # virtual, starts at 10000
  currency: "USDT-P"
  updatedAt

trades/{tradeId}
  userId, adminId
  pair: "BTC-USD" | "ETH-USD" | "DOGE-USD"
  direction: "up" | "down"
  amount, durationSec (30/60/120/300), payoutPct (fixed per duration)
  entryPrice, exitPrice?
  status: "open" | "settled"
  result?: "win" | "loss" | "draw"
  createdAt, expiresAt, settledAt?

notifications/{id}
  adminId, target: "all" | userUid
  title, body, createdAt

fcmTokens/{uid}
  tokens: string[]

auditLog/{id}
  actorId, action, targetId, at
```

## 6. Key flows

### 6.1 Super admin creates an admin

1. Super admin fills _name, email, temporary password, plan_.
2. Browser calls `POST /api/admins/create` with its Firebase ID token.
3. Function verifies the token **and** `users/{uid}.role == "superadmin"`.
4. Admin SDK creates the Auth user, writes `users/{uid}` (role `admin`) and
   `plans/{uid}`.
5. Block = disable the Auth user + `status: blocked`. Delete = delete Auth user
   - `status: deleted`. Both write an `auditLog` entry.

### 6.2 Admin invites a user (referral flow)

1. Admin clicks **Invite a client** → a code is written to `referralCodes`.
2. Admin copies the link: `https://<domain>/register?ref=<code>`.
3. `/register` without a valid, active `ref` shows "Invitation required" — no
   form.
4. With a valid code, the user registers (name, email, phone, password).
   Their `users` doc gets `role: "user"`, `adminId` from the code, and a
   `practiceAccounts` doc with 10,000 USDT-P.

### 6.3 Practice trade (Contract page)

1. User picks pair, direction (up/down), amount, duration.
2. Browser calls `POST /api/trades/open` with those choices only — **never a
   price**.
3. The function checks the user is active and has enough practice balance,
   fetches the live price from Coinbase as `entryPrice`, and in one
   transaction creates `trades/{id}` (`status: open`) and deducts the amount.
4. When `expiresAt` passes, the client calls `POST /api/trades/settle`
   (any client can trigger it; the server ignores trades not yet expired).
5. The function fetches the real price from Coinbase as `exitPrice`, decides
   win/loss/draw, and updates the trade and balance in a transaction.

The browser **cannot write to `trades` or `practiceAccounts` at all** — both
prices and every balance change come from the server.

### 6.4 Admin client actions

Block / unblock / reset practice balance / delete go through
`POST /api/clients/{block|unblock|reset-balance|delete}`. The function checks
the caller is an active admin **and** that the client's `adminId` is the
caller. Block disables the Auth user + sets `status: blocked`; delete deletes
the Auth user + sets `status: deleted`. Every action writes an `auditLog`
entry (actor, action, target, time). Super admin actions on admins (§6.1)
are logged the same way.

### 6.5 Notifications

1. Admin writes title/body, target = all clients or one client.
2. `POST /api/notifications/send` stores it in `notifications` and sends FCM
   pushes to the stored tokens.
3. User sees a push (if allowed) and the bell list in the top bar.

## 7. Security rules (summary)

- Every user can read their own `users` doc; admins can read their own
  clients; super admin can read all.
- Only the server (Admin SDK) can change `role`, `status`, `plans`.
- `trades`, `practiceAccounts` and `auditLog` are server-write-only; users can
  read their own trades/account, admins can read their clients'.
- `referralCodes` are readable by `get` (for the register page) but not
  `list`.

## 8. Theme

Purple / dark design tokens in `src/index.css`:

| Token                            | Use                         | Value                             |
| -------------------------------- | --------------------------- | --------------------------------- |
| `bg`                             | page                        | `#0B0814`                         |
| `sidebar`                        | sidebar & mobile bottom nav | `#0F0A1C`                         |
| `surface`                        | cards                       | `#151024`                         |
| `surface-2`                      | inputs, hovers              | `#1E1733`                         |
| `border`                         | lines                       | `#2C2347`                         |
| `primary`                        | buttons, active nav         | `#8B5CF6` (violet-500)            |
| `primary-strong`                 | hover                       | `#7C3AED`                         |
| `accent`                         | highlights                  | `#C084FC`                         |
| `success` / `danger` / `warning` | status                      | `#22C55E` / `#F43F5E` / `#F59E0B` |
| `text` / `muted`                 | copy                        | `#EDE9FE` / `#A79BC8`             |
