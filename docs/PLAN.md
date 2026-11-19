# 7-Day Delivery Plan — InvestLedger (Practice Edition)

Each day ends with a **client demo** of something working in the browser.
Day 1 starts 2026-11-20. Each day assumes about 8 focused hours.

| Day | Theme                         | Client demo at end of day                                      |
| --- | ----------------------------- | -------------------------------------------------------------- |
| 1   | Foundation & theme            | Themed app shell for all 3 panels, working logins              |
| 2   | Super admin panel             | Create / block / delete admins live                            |
| 3   | Admin panel core              | Admin dashboard, clients table, invite links                   |
| 4   | User onboarding & market      | Register via referral link, user dashboard, live market        |
| 5   | Practice trading              | Place a contract, watch it settle at real price, admin sees it |
| 6   | Notifications, plan, security | Push notification end-to-end, plan banner, rules locked down   |
| 7   | QA, deploy, handover          | Production URL on Vercel, full walkthrough                     |

---

## Day 1 — Foundation & theme ✅ (done 2026-11-19)

**Build**

- Vite + React + Tailwind v4 project, purple/dark theme tokens.
- `src/firebase.js` — single place for Firebase init, reads `VITE_*` env.
- `.env.example`, `.gitignore` for env files, `vercel.json` SPA rewrites.
- Reusable UI kit: Button, Card, Badge, Toggle, Input, Modal, Toast.
- `PanelLayout` with collapsible sidebar, top bar, avatar menu (matches design).
- Routing for `/super`, `/admin`, `/app`, `/login`, `/register`.
- `AuthContext` (current user + role) and `ProtectedRoute` (role-based).
- Login pages for super admin and admin (email + password).

**Demo:** open each panel's login, sign in, see the themed layout and sidebar
collapse; wrong role is redirected.

**Done when:** `pnpm build` passes, `pnpm lint` clean, logins work against the
Firebase project.

---

## Day 2 — Super admin panel ✅ (done 2026-11-19)

**Build**

- `/api/_lib` (Admin SDK init, token + role check).
- `POST /api/admins/create`, `/block`, `/unblock`, `/delete`.
- Admins page: DataTable (show N entries, search, sort, pagination), status
  badge, actions dropdown, "Are you sure?" confirm modal, success toast.
- Create admin modal: name, email, temp password, plan + expiry.
- `scripts/create-super-admin.mjs` bootstrap.

**Demo:** super admin creates an admin → admin logs in in another window →
super admin blocks them → admin is signed out and cannot log back in.

---

## Day 3 — Admin panel core

**Build**

- Admin dashboard: 3 coin cards (BTC/ETH/DOGE live price, same pastel card
  layout re-themed) + market overview card replacing Buy/Sell.
- Clients page: same table design — Name, Username/Email, Phone, Practice
  balance, Open trades, Status, Updated on, Actions (View trades, Block /
  Unblock, Reset practice balance, Delete) with confirm modal.
- `POST /api/clients/{block,unblock,reset-balance,delete}` — checks the client
  belongs to the calling admin; writes an `auditLog` entry for each action.
- "Invite a client" → generate referral code, copy-link modal, list of codes
  with active toggle.

**Demo:** admin generates an invite link, clients table with search /
pagination / actions on seeded fictional users.

---

## Day 4 — User onboarding & market

**Build**

- `/register?ref=CODE` — validates code; without it shows "Invitation
  required".
- Registration creates user + practice account (10,000 USDT-P).
- User login, user panel layout (Dashboard, Market, Contract, Assets + bottom
  nav on mobile, matching the design).
- Market page: live prices table (pair, price, 24h change), click → detail with
  line chart.
- User dashboard: practice balance chart, recent activity (own trades), stats.

**Demo:** open admin's invite link in incognito, register, land on dashboard,
browse live market. Admin's clients table shows the new user.

---

## Day 5 — Practice trading

**Build**

- Contract page: pair, Up/Down, amount, duration (30s/60s/120s/300s), payout %,
  countdown, open positions list.
- `POST /api/trades/open` — server fetches the live Coinbase price as the entry
  price, checks balance, creates the trade and deducts the amount in one
  transaction. The browser never sends a price.
- `POST /api/trades/settle` — real price from Coinbase at expiry, win/loss/draw,
  balance update in a transaction.
- Assets page: practice balance, available / in open trades, trade history.
- Admin **Trades** (all closed trades) and **Running Trades** (open trades) —
  same table layout, **read-only**, with Refresh button.

**Demo:** user places a 30-second contract, countdown, settles at real price;
admin sees it in Running Trades, then in Trades.

---

## Day 6 — Notifications, plan, security

**Build**

- FCM setup: service worker, permission prompt, token storage.
- Admin Notifications page: send to all / one client; history table.
- User bell icon with unread list.
- Admin **Plan** page + red expiry banner (from `plans/{adminUid}`); super admin
  can extend plan.
- Finalise `firestore.rules` and indexes; rules tests with the emulator.
- Help page (static FAQ + support email link) linked from both panels' sidebars.
- Responsive pass (phone, tablet, desktop).

**Demo:** admin sends a notification → it pops up on the user's device; plan
banner shows when the expiry date is near.

---

## Day 7 — QA, deploy, handover

**Build / do**

- End-to-end test of every flow (checklist written to `docs/QA-CHECKLIST.md` on Day 7).
- Deploy to Vercel, set env vars, add domain to Firebase Auth allowed domains.
- Seed fictional demo data.
- Final docs pass (README, SETUP, ARCHITECTURE).

**Demo:** full walkthrough on the production URL: super admin → admin →
invite → user registers → trade → notification.

---

## Risks and how we handle them

| Risk                                                    | Mitigation                                                                  |
| ------------------------------------------------------- | --------------------------------------------------------------------------- |
| Coinbase API unreachable from a region                  | Price source is wrapped in one module; can switch to CoinGecko              |
| FCM not supported in a browser (e.g. some iOS versions) | In-app bell list always works                                               |
| Firebase free (Spark) plan limits                       | Server work runs on Vercel, not Cloud Functions; Spark is enough for a demo |
| Scope creep toward excluded features                    | See `docs/SCOPE-EXCLUSIONS.md` — those are out of scope by agreement        |
