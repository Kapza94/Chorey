<!--
Filled in for Luka Kapetanovic (individual, Serbia). Publish at
https://chorey.co/privacy (replacing the waitlist placeholder). Update the
effective date if you go live on a different day. Confirm your Sentry org's
region (US vs EU) and update the processors table if it's EU. Keep this
document in sync with:
  - the Apple App Privacy "nutrition label" and Google Play Data Safety form
  - the SDK list in package.json (Supabase, Sentry, PostHog, RevenueCat, Expo)
  - the retention behavior in code (30-day chore-photo purge, delete_my_account)
-->

# Chorey — Privacy Policy

**Effective date:** 2 July 2026

Chorey is a family chore and allowance tracker made by Luka Kapetanovic, an
individual developer at Jurija Gagarina 197, Belgrade, Serbia ("Chorey",
"we"). We are the data controller for the personal data described here.
Contact: **elkapzlabs@gmail.com**.

The short version: we collect the minimum needed to run a family chore app, we
store it in Europe, we show no ads, we sell nothing, and we never track
children.

## 1. What we collect

**From parents (account holders):**

- Email address and sign-in identity (Apple, Google, or email code)
- Your name and optional profile photo
- Your household setup: country, currency, allowance split, settlement cadence
- Subscription status and purchase history (via RevenueCat and Apple/Google —
  we never see your payment details)
- Messages you send us through the in-app contact and feedback forms
- Crash reports (Sentry) and anonymous usage analytics (PostHog) — see
  Section 4

**About children (entered by their parent, or created while a child uses the
app with a parent-provided access code):**

- First name, and optionally an age
- Chores assigned and completed, rewards, and virtual bucket balances
- Wishlist items and notes, suggested giving causes, and game progress
- An optional photo of a finished chore (deleted automatically after 30 days)
- A push-notification token for the device the child uses, if notifications
  are enabled

Children never provide an email address, phone number, or location, have no
account or password, and cannot make purchases.

## 2. Children's privacy

Chorey is used by families. The **parent is the account holder** and the
gatekeeper of everything about their children:

- Only a parent can create a child profile, and the parent confirms they are
  the child's parent or legal guardian when they do. Children access Chorey
  only through an access code the parent generates and hands over. We rely on
  the parent's consent (given as the holder of parental responsibility) and on
  our contract with the parent as the basis for processing children's data.
- Children's data is used **only to provide Chorey to that family** — never
  for advertising, never for profiling, and it is never sold or shared for
  marketing.
- **Analytics are disabled while the app is in child mode.** Crash reporting
  remains active so the app works reliably, and does not collect personal
  details.
- Parents can review, edit, and delete their children's data at any time in
  the app — edit or remove a child profile, or delete the whole account
  (Section 6). If you believe a child's data reached us without parental
  consent, email elkapzlabs@gmail.com and we will delete it.

## 3. Why we process data (lawful bases)

| Processing | Purpose | Legal basis (GDPR) |
|---|---|---|
| Account, household, chores, ledger | Run the service you signed up for | Contract (Art. 6(1)(b)) |
| Children's profiles and activity | Provide the family service | Contract with the parent + consent authorized by the holder of parental responsibility (Art. 6(1)(a), 8) |
| Chore photos | Let parents verify finished chores | Contract; auto-deleted after 30 days |
| Push notifications | Chore reminders and approvals (never marketing) | Contract / legitimate interest |
| Subscription management | Billing via Apple/Google | Contract |
| Crash reporting | Keep the app working | Legitimate interest (Art. 6(1)(f)) |
| Anonymous usage analytics (parents only) | Improve the app | Legitimate interest |
| Support and feedback | Answer you | Contract / legitimate interest |

## 4. Who processes data for us

We use a small set of service providers under data-processing agreements:

| Provider | What | Where |
|---|---|---|
| Supabase | Database, authentication, file storage — all app data | **EU (Zurich, Switzerland — AWS eu-central-2)** |
| PostHog | Anonymous usage analytics, parents only | EU cloud |
| Sentry | Crash and error reporting | United States (Sentry default — confirm in your Sentry org settings) |
| RevenueCat | Subscription management | US |
| Expo | App infrastructure and push-notification delivery | US |
| Apple / Google | Sign-in, payments, push delivery | Global |

Your data lives in Europe by default. Where a provider processes data outside
the EU/UK, the transfer is protected by the European Commission's Standard
Contractual Clauses (or an adequacy decision) under each provider's data
processing agreement. We do not sell personal information, we do not share it
for advertising, and there are no ad networks or tracking SDKs in the app.

## 5. How long we keep data

- **Chore photos:** deleted automatically **30 days** after upload.
- **Account and household data** (profiles, chores, balances, wishlists):
  kept while your account exists; deleted when you delete your account.
- **Support and feedback messages:** kept while relevant, anonymized when you
  delete your account.
- **Crash and analytics data:** retained per Sentry/PostHog defaults, then
  deleted; none of it identifies your children.

## 6. Your rights

- **Delete everything, self-serve:** Settings → Account → **Delete account**
  permanently removes your household — every child profile, chore, balance,
  access code, photo, and avatar.
- **Review and correct:** edit your profile, household, and child profiles in
  the app at any time.
- **Export:** email elkapzlabs@gmail.com and we will send you a copy of your
  household's data within 30 days.
- Depending on where you live, you also have rights to access, rectification,
  erasure, restriction, portability, and objection, and the right to withdraw
  consent. Exercise any of them via elkapzlabs@gmail.com. You can also complain to
  your local data protection authority.

**Regional notes.** *Serbia:* Chorey is operated from Serbia and complies with
the Serbian Law on Personal Data Protection (ZZPL); our supervisory authority
is the Commissioner for Information of Public Importance and Personal Data
Protection (poverenik.rs). *EEA/UK:* Chorey is operated from outside the EU and
UK. Where the GDPR or UK GDPR applies to our European users, the lawful bases
above apply, those users may contact us directly at elkapzlabs@gmail.com, and they
may complain to their own national data protection authority. *California:* we
do not sell or share personal information as defined by the CCPA/CPRA. *Brazil
(LGPD):* our responsible contact (encarregado) is Luka Kapetanovic,
elkapzlabs@gmail.com. *Canada / Australia:* we handle personal information
consistently with PIPEDA and the Australian Privacy Principles.

## 7. Security

All tables in our database enforce row-level security, so one household can
never read another's data. Data is encrypted in transit. Chore photos live in
a private bucket readable only by the child's own household. Children sign in
with long, randomly generated access codes that a parent can revoke and
regenerate at any time. No system is perfectly secure; if a breach affects
your data we will notify you and the relevant authority as the law requires.

## 8. Changes to this policy

We will post any changes here and, for material changes, notify you in the app
or by email before they take effect. The current version always lives at
https://chorey.co/privacy.

**Contact:** Luka Kapetanovic, Jurija Gagarina 197, Belgrade, Serbia — elkapzlabs@gmail.com
