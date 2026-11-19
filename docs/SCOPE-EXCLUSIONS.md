# Scope Exclusions — What We Skipped and Why

**Project:** InvestLedger (Practice Edition)
**Date:** 2026-11-19
**Status:** Agreed with the project owner before development started

---

## 1. Why this document exists

The original reference screenshots showed a crypto "exchange" with three
panels (super admin, admin, user). We are building a **trading-practice
platform** that keeps the three-panel structure, the look and feel (with a new
purple / dark theme), the tables, filters and actions — but with several
features removed or changed.

This document lists every feature we did **not** build, and the reason, so the
client knows exactly what to expect in the demo and why.

The short version: **the reference design gave an operator control over what
users win, lose and can take out. A legitimate platform cannot work that way,
so those controls are gone. Everything else is kept or replaced with a safe
equivalent.**

---

## 2. Summary table

| #   | Reference feature                                                                                     | Decision                                                                                           | Reason category             |
| --- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------- |
| 1   | Per-client "Always win" toggle                                                                        | **Removed**                                                                                        | Outcome manipulation        |
| 2   | "Run pending trades" / "Run trades forcefully" buttons                                                | **Removed**                                                                                        | Outcome manipulation        |
| 3   | Admin-editable trade result / "Action" column on running trades                                       | **Removed** — admins see trades read-only                                                          | Outcome manipulation        |
| 4   | "Withdraw Channel" on/off toggle per client                                                           | **Removed**                                                                                        | Withholding funds           |
| 5   | "Freezing balance"                                                                                    | **Removed**                                                                                        | Withholding funds           |
| 6   | "Reputation" score per client                                                                         | **Removed**                                                                                        | Withholding funds           |
| 7   | Withdrawals page (admin) and Withdraw Request form (user)                                             | **Removed**                                                                                        | Financial data & real money |
| 8   | Bank name / account holder / account number / IFSC fields                                             | **Removed**                                                                                        | Financial data collection   |
| 9   | "Withdrawal password"                                                                                 | **Removed**                                                                                        | Financial data & real money |
| 10  | Deposits / "Make Payment" (Buy / Sell widget on admin dashboard)                                      | **Replaced** with a live market overview (no payments)                                             | Real money                  |
| 11  | Real-money balances (USDT / INR / ETH)                                                                | **Replaced** with a single virtual practice balance                                                | Real money                  |
| 12  | Fabricated dashboard data (fake activity list, "GPUs mining", "Team members", fake transaction chart) | **Replaced** with the user's own real practice data                                                | Misleading content          |
| 13  | CoinDCX name / logo                                                                                   | **Replaced** with our own brand "InvestLedger"                                                     | Brand impersonation         |
| 14  | Subscription "Licensing Notice" / Billings page that sells panels to operators                        | **Changed** — kept as a simple _account plan_ status set by the super admin, no payment collection | Real money                  |
| 15  | Real people's names / emails / phone numbers seen in the screenshots                                  | **Not used** — all seed data is fictional                                                          | Privacy                     |

---

## 3. Details

### 3.1 Outcome manipulation (items 1–3)

**What it was:** Admins could decide whether a specific client's trades win,
and force trades to settle on demand.

**Why it's removed:** If the operator decides results, the "market" is fake
and users are being deceived. This is the core feature we cannot ship in any
form, including a demo, because a working version is exactly what would be
reused.

**What replaces it:** Every practice trade is opened **and** settled **on the
server**, using the real market price (at open and at expiry) from a public
price feed. The browser never supplies a price.
Nobody — not the admin, not the super admin — can change an outcome. Admins
get a read-only **Trades** and **Running Trades** view so they can still
monitor activity (same table layout as the design).

### 3.2 Withholding funds (items 4–6)

**What it was:** Per-client switches to block withdrawals, "freeze" part of a
balance, and a reputation score that could be lowered to justify refusing a
payout.

**Why it's removed:** These only make sense as tools to stop people getting
their money back.

**What replaces it:** Admins can **block / unblock** a client account (login
access only) and **reset a practice balance** to the starting amount. Both are
logged with the admin's ID and time.

### 3.3 Real money and financial data (items 7–11, 14)

**What it was:** Withdrawal requests with bank details and a withdrawal
password, deposit / "Make Payment" flows, multi-currency real balances, and a
paid licence for each admin panel.

**Why it's removed:**

- Handling real money requires payment licensing, KYC/AML compliance and a
  payment provider. None of that is in scope for a one-week build.
- Collecting bank details (account number, IFSC) means storing sensitive
  financial data. We don't need it, so we don't collect it.

**What replaces it:**

- One **virtual practice balance** per user (default 10,000 USDT-P,
  "practice USDT"). It is labelled "Practice" everywhere it appears.
- The admin dashboard Buy/Sell card becomes a **live market overview**
  (BTC, ETH, DOGE prices) — same card layout, no payment button.
- The Billings page becomes **Plan** — shows the plan name, start and expiry
  date set by the super admin. The red banner still appears near expiry
  (same design), but there is no payment step; renewal is done by the super
  admin.

### 3.4 Misleading content (item 12)

**What it was:** The user dashboard showed blurred "other users'" wallets,
mining widgets and transaction counts that weren't real.

**Why it's removed:** Fake activity makes a platform look busier and more
profitable than it is.

**What replaces it:** The same card layout filled with the user's **own**
practice data: practice balance chart, recent practice trades, win/loss
stats, open contracts.

### 3.5 Brand impersonation (item 13)

The screenshots use CoinDCX's name and logo. CoinDCX is a real exchange; using
its branding would be impersonation. We use our own brand **InvestLedger**
with the new purple / dark theme.

### 3.6 Privacy (item 15)

The reference screenshots contain what appear to be real people's names,
emails and phone numbers. None of that data is copied into the project. All
demo / seed data is fictional (e.g. `demo.user1@example.com`).

---

## 4. Other (non-security) exclusions for the 1-week timeline

These are skipped only for time, and could be added later.

| Feature                                      | Reason                                                                                                                        | Possible later                       |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Native mobile apps                           | Timeline — web app is fully responsive instead                                                                                | Yes (PWA first)                      |
| Multi-language (i18n)                        | Timeline                                                                                                                      | Yes                                  |
| Advanced charting (candlesticks, indicators) | Timeline — simple line chart of live price                                                                                    | Yes (TradingView Lightweight Charts) |
| Email notifications                          | Push + in-app notifications cover the need                                                                                    | Yes (via a mail provider)            |
| "Help & Support" chat                        | Timeline — replaced with a static help page + support email link (Day 6)                                                      | Yes                                  |
| Audit-log UI for super admin                 | Audit entries are written to Firestore by every admin/client action endpoint (Days 2–3); a screen to browse them is not built | Yes                                  |

---

## 5. Labelling rules (must be visible in the product)

1. A **"Practice mode — virtual funds only"** badge appears in the top bar of
   the user panel and on every balance.
2. The registration page states that no real money is used or accepted.
3. Terms page states: no deposits, no withdrawals, no real-money value.
