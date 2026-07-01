# Chorey — launch compliance & liability checklist

> **This is an engineering checklist, not legal advice.** Chorey stores
> **children's data** and sells **auto-renewing subscriptions** — two of the
> most regulated areas in consumer apps. Have a lawyer review your Terms,
> Privacy Policy, and children's-data handling before public launch. The cost
> of a one-time review is far below the cost of getting COPPA/GDPR-K wrong.

The goal of "limiting liability fully" is really three layers working together:
**(1) a legal entity** between you and the world, **(2) contracts** (Terms) that
disclaim and cap liability, and **(3) doing the compliance things** that stop
problems happening in the first place. No single step does it alone.

---

## 1. Put an entity between you and liability (do this first)

- [ ] **Form a company** (LLC in the US, Ltd in the UK/EU equivalent). This is
      the single biggest liability shield: claims hit the company, not your
      personal assets. Ship the app under the company, not your personal name.
- [ ] Open a **business bank account**; don't commingle funds.
- [ ] Put the Apple/Google developer accounts and the domain under the company.
- [ ] Consider **tech E&O / general liability insurance** once you have users —
      cheap relative to what it covers.

## 2. The two documents Apple/Google require in-app

Both stores reject apps that create accounts or sell subscriptions without
functional **Terms of Service (EULA)** and **Privacy Policy** links.

- [x] In-app links wired (`src/features/legal/legal.ts`) and shown at sign-up
      via `LegalConsent`.
- [ ] **Publish the actual pages** at `chorey.co/terms` and `chorey.co/privacy`
      — the in-app links 404 until you do, which is an automatic rejection.
- [ ] Add the same two URLs to **App Store Connect** and **Play Console**
      metadata fields.
- [ ] Add `LegalConsent` to the **subscription paywall** too (see §4).

**Terms of Service should contain** (lawyer to draft/review):
- Limitation of liability + liability **cap** (e.g., fees paid in last 12 months).
- "AS IS" / no-warranty disclaimer.
- Indemnification clause.
- Governing law + dispute resolution (arbitration clause is common).
- **Explicit statement that balances are a virtual ledger — not real money,
  not a bank account, not financial advice, no funds are held or transmitted.**
  This is important: it keeps you clear of money-transmitter regulation.
- Eligibility (account holder must be 18+, the parent/guardian).

## 3. Children's data — COPPA (US) & GDPR-K (EU)

Your architecture is already COPPA-friendly: **children never create accounts or
enter email/passwords**; the parent (an adult account holder) creates child
profiles. Lean into that. Steps:

- [ ] Treat the **parent's account creation as verifiable parental consent**, and
      say so in the Privacy Policy. The parent consents on the child's behalf.
- [ ] **Data minimisation**: only store what a chore tracker needs (first name,
      age band, ledger). No precise location, no contacts, no child email.
- [ ] **No third-party advertising or behavioural tracking aimed at children.**
- [ ] Let parents **review and delete** their children's data (covered by §5).
- [ ] **Decide your App Store age category deliberately.** The Apple **Kids
      Category** has strict extra rules (no third-party analytics/ads, a
      parental gate). Because parents are the actual users here, you can
      reasonably ship as a general **4+ / family** app and *not* opt into the
      Kids Category — simpler and fewer constraints. Confirm with your lawyer.
- [ ] If you have EU users, GDPR-K applies (parental consent under the age of
      13–16 depending on country) — your parent-consent model already covers it.

## 4. Subscription / billing compliance (App Store §3.1.2, Play equivalent)

- [ ] On the **paywall**, before purchase, clearly show: title, length, price
      per period, and that it **auto-renews until cancelled**. (Your paywall has
      fine print — confirm the auto-renew sentence and price/period are explicit.)
- [ ] Show **Terms + Privacy links on the paywall** (reuse `LegalConsent` with
      `action="subscribing"`).
- [ ] Provide an in-app path to **manage/cancel** — done via the store
      management deep link ("Cancel or manage billing").
- [ ] Prices come from the store (RevenueCat) — never hard-code them. (Already
      enforced in code.)
- [ ] Restore Purchases is present. (Already in the paywall.)

## 5. Account & data deletion (hard Apple requirement)

Apple requires any app that supports **account creation** to also support
**in-app account deletion** (not just deactivation).

- [x] "Delete account" flow in the parent account sheet — `delete_my_account()`
      RPC deletes the household, child profiles, ledger, codes, and the auth
      user (`supabase/migrations/20260614150000_delete_my_account.sql`), and
      storage objects (avatars + chore photos) are erased too
      (`20260702110000_delete_account_storage_cleanup.sql`).
- [x] Contact path for deletion requests (in-app contact form + self-serve
      delete button).

## 6. Privacy Policy must disclose your processors

You share data with third parties — list them and link their policies:

- [ ] **Supabase** (database/auth/hosting), **RevenueCat** (billing),
      **Expo / EAS** (builds + push), **Apple/Google** (sign-in + payments).
- [ ] Describe: what's collected, why, retention, the parental-consent basis,
      and how to request access/deletion. Include a contact (`hello@chorey.co`).
- [ ] Complete Apple's **App Privacy "nutrition label"** and Play's **Data
      Safety** form to match the policy.

## 7. Security hygiene (mostly done — keep it)

- [x] Row-Level Security on all tables; writes via security-definer RPCs.
- [x] Access codes are non-brute-forceable (`Chorey-XXXXXXXX`).
- [x] Secrets in env / Supabase secrets, never committed.
- [ ] Confirm no PII or tokens are written to logs.

---

### The short answer to "how do we limit liability fully?"
You can't make liability *zero*, but you de-risk it to near-nothing by stacking:
**LLC** (shields personal assets) → **lawyer-reviewed Terms with a liability cap
+ "virtual ledger, not real money" language** → **COPPA-clean children's-data
handling** → **the required in-app legal links, deletion flow, and subscription
disclosures**. Items 1, 2, 3, and 5 are the ones that actually move the needle.
