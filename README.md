# InvestLedger — Practice Edition

A trading-practice platform with three panels:

- **Super Admin** (`/super`): creates, blocks, deletes and lists admin accounts.
- **Admin** (`/admin`): manages clients, invite links, read-only trade monitoring and notifications.
- **User** (`/app`): registers only through an admin's referral link. Has a dashboard, live
  market, practice contracts and assets.

All balances are **virtual** (USDT-P). No deposits, withdrawals or payments exist.

**Stack:** React + Vite, Tailwind CSS v4 (purple / dark theme), Firebase Auth + Firestore +
Cloud Messaging, Vercel (hosting + serverless `/api`).

## Quick start

```bash
cp .env.example .env.local   # fill in Firebase values
pnpm install
pnpm dev
```

## Documentation

| Doc                                                  | What's in it                                                |
| ---------------------------------------------------- | ----------------------------------------------------------- |
| [docs/PLAN.md](docs/PLAN.md)                         | 7-day delivery plan with a client demo each day             |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)         | Stack, folder structure, env vars, data model, flows, theme |
| [docs/SETUP.md](docs/SETUP.md)                       | Firebase setup, local env, Vercel deployment                |
| [docs/SCOPE-EXCLUSIONS.md](docs/SCOPE-EXCLUSIONS.md) | Features from the reference design that we skipped, and why |

## Status

- **Day 1 ✅** foundation: theme, `src/firebase.js`, env handling, routing, role-based guards,
  panel layouts and logins.
- **Day 2 ✅** super admin panel: create / block / unblock / extend plan / delete admins via
  `/api/admins/*`, admins table, bootstrap script, Firestore rules, emulator test suite
  (`pnpm test:emulator`).

Screens for later days show a "Scheduled for Day N" card.
