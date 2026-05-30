# Chorey Product Specification

## 1. Product Summary

Chorey is a family chore and allowance app for parents and children. Parents create chores, children complete them, parents approve the work, and Chorey tracks earnings in a virtual family ledger.

Chorey's core principle is a fixed 40 / 40 / 20 split:

- 40% Spend
- 40% Savings
- 20% Giving

The app does not move real money in v1. It teaches financial responsibility by helping families track chores, approvals, balances, settlements, saving habits, spending wishes, and giving choices.

The design direction should be clean, warm, trustworthy, and family-friendly. The provided design handoff uses the placeholder brand "Sprout"; all product naming should be updated to Chorey.

## 2. Core Product Principles

- Chorey is a virtual family ledger, not a banking product.
- Parents pay for and manage the app.
- Children never see billing, upgrade prompts, or subscription messaging.
- The 40 / 40 / 20 split is fixed and central to the brand.
- Giving should stay human and should not be meaningfully paywalled.
- Paid features should monetize household scale, automation, proof, and convenience.
- The app should reduce parent mental load without becoming noisy or over-gamified.
- Privacy is central, especially around children and temporary photo proof.

## 3. User Types

### Parents

Parents can:

- Create and manage a household.
- Add child accounts.
- Invite additional parent admins on paid plans.
- Create paid and unpaid chores.
- Create one-off chores.
- Create recurring chores on paid plans.
- Assign chores to one or more children.
- Review completed chores.
- Approve chores or send them back with a reason.
- Manage Spend, Savings, and Giving balances.
- Configure household settlement frequency.
- Confirm settlements bucket by bucket.
- Manage Giving options.
- Review wishlist purchase requests.
- Manage subscription and billing.

### Children

Children can:

- Log in through a parent-linked child account.
- View their own chores.
- Mark chores as done.
- Complete required checklist steps before submission.
- Attach photo proof where required on paid plans.
- Add an optional submission note.
- See their own Spend, Savings, and Giving balances.
- Add Spend wishlist items.
- Request a Spend wishlist purchase.
- Choose Giving destinations from parent-approved options.
- Suggest new Giving options.
- View private milestones.

Children cannot:

- See billing or upgrade prompts.
- See sibling earnings by default.
- Access general parent settings.
- Move real money.
- Approve their own chores.

## 4. Household and Account Model

### Household

- One household contains parent admins and children.
- One child belongs to one household in v1.
- Multi-household children are out of scope for MVP.
- The data model may leave room for multi-household support later.

### Parent Accounts

- Parents use Supabase Auth.
- Supported parent sign-in methods:
  - Google authentication
  - Apple authentication
  - OTP / magic link
- Google and Apple buttons should use standard recognizable platform styling.
- Free households support one parent admin.
- Paid households support multiple parent admins.
- All parent admins have equal permissions in v1.

### Child Accounts

- Child accounts are parent-linked.
- Children should not need email/password in v1.
- Child login should use simple child-friendly access such as username + PIN, family code, or parent-approved device access.
- Parent remains the guardian/account owner layer.

## 5. Chore Model

### Chore Types

Chorey supports:

- Paid chores
- Unpaid chores
- Secret chores on paid plans

Paid chores contribute to the 40 / 40 / 20 ledger after parent approval.

Unpaid chores are labeled clearly as family chores or no-reward chores. They can still be assigned, completed, and tracked, but do not affect balances.

### One-Off Chores

- Available on free and paid plans.
- Parent creates a one-off chore and assigns it to one or more children.
- Separate chore instances are created per child.

### Recurring Chores

- Paid-only.
- Parent creates a recurring chore template.
- Supported recurrence in v1:
  - Daily
  - Weekly
  - Monthly
- Chorey generates dated task instances from the template.
- Each child receives their own instance.
- Approval, history, and earnings are tracked per instance.

### Multi-Child Assignment

- A chore template can be assigned to multiple children.
- Each assigned child gets a separate task instance.
- Completion, approval, earnings, and history are tracked per child.

### Reward Amounts

- Each paid chore has a default reward amount.
- Parent can adjust the reward amount during approval.
- Chorey stores both the original amount and final approved amount when adjusted.
- The 40 / 40 / 20 split is calculated from the final approved amount.
- Children can see the reward amount before doing the chore.

### Chore Checklists

- Chores can have optional lightweight checklist items.
- If checklist items are present, the child must complete all checklist items before submitting.
- Checklist items do not pay separately.
- The chore still has one approval state and one reward amount.

## 6. Chore Completion and Approval Flow

1. Child views assigned chore.
2. Child completes any required checklist items.
3. Child optionally adds a short note.
4. If photo proof is required, child attaches one proof photo.
5. Child marks chore as done.
6. Chore moves to waiting for approval.
7. Parent reviews the chore.
8. Parent explicitly approves or sends back.

### Approval

On approval:

- Paid chore earnings are added immediately to virtual balances.
- Amount is split 40 / 40 / 20.
- If a proof photo exists, it is deleted immediately.
- Chore enters approved history.

### Send Back

When sending back:

- Parent must provide a reason.
- Parent can use quick reasons such as:
  - Needs another try
  - Not finished
  - Wrong chore
- Parent can add an optional note.
- If a proof photo exists, it is deleted immediately.
- Child can resubmit with fresh information/proof.

No general in-app chat exists in MVP. Communication is limited to submission notes and send-back notes attached to chore instances.

## 7. Photo Proof

Photo proof is paid-only and opt-in per chore.

### Parent Controls

- Each chore can have Photo required on or off.
- Default is off.
- Parent enables it only for chores where visual proof helps.

### Upload Rules

- One photo per chore submission.
- Client-side compression and resizing before upload.
- Upload via AWS S3 presigned upload URLs.
- No original full-size images should be stored.
- No gallery, archive, or social sharing.

### Review Rules

- Photo is evidence, not a decision.
- Parent must explicitly approve or send back.

### Deletion Rules

- If approved, delete photo immediately.
- If sent back, delete photo immediately.
- If abandoned, delete via scheduled expiry.
- Recommended hard expiry: 7 or 14 days.

### Audit Metadata

Store a small metadata audit trail only:

- chore_instance_id
- uploaded_at
- reviewed_at
- deleted_at
- deletion_reason: approved, sent_back, expired, admin_cleanup

Do not retain:

- image file
- thumbnail
- public URL
- permanent proof archive

Suggested privacy positioning:

"Proof photos are only used to help confirm chores. Chorey deletes them after review."

Avoid broad legal claims such as "GDPR compliant" until legal/privacy review is complete.

## 8. Ledger and 40 / 40 / 20 Split

### Fixed Split

Every approved paid chore always splits:

- 40% Spend
- 40% Savings
- 20% Giving

There are no v1 overrides:

- No household custom percentages.
- No per-child custom percentages.
- No per-chore split overrides.

The split is Chorey's core selling point.

### Balance Timing

- Approved earnings update the child's virtual bucket balances immediately.
- Settlement is separate from earning.
- Settlement records the real-world handoff outside the app.

### Display

- Dashboard emphasizes total bucket balances.
- Chore rows show reward amounts simply.
- Per-chore split can be available in detail views, but should not clutter the main chore list.

## 9. Settlement

Chorey does not move real money. Parents settle outside the app.

### Settlement Frequency

Parents choose one household-level settlement frequency:

- Weekly
- Monthly

Frequency changes apply only to future periods. The current active period keeps its existing schedule.

### Settlement Flow

At the end of each settlement period:

1. Chorey generates a settlement summary.
2. Parent reviews the period.
3. Parent manually confirms each bucket separately:
   - Spend paid to child
   - Savings set aside
   - Giving donated/given/reserved
4. Once buckets are settled, the period becomes part of settlement history.

### Bucket-by-Bucket Settlement

Buckets settle independently. For example, a parent may mark Spend as paid while leaving Giving pending until the family chooses a destination.

### History

- Paid users get full settlement history and statements.
- Free users get limited history.
- Recommended free limit: current active period plus one previous settled period.

## 10. Spend Wishlist

Wishlist applies only to the Spend bucket.

Children can:

- Add Spend wishlist items.
- See progress toward wishlist items.
- Request to buy an item if Spend balance is sufficient.

Parents can:

- View, edit, or remove wishlist items.
- Confirm purchase requests.

On confirmed purchase:

- Amount is deducted from the virtual Spend bucket.
- Purchase history records item, amount, date, child, and approving parent.

Free tier:

- Limited active wishlist items, recommended 3 per child.

Paid tier:

- Unlimited wishlist items.

Savings does not have a wishlist. Savings is framed as future money and financial responsibility.

## 11. Giving

Giving is central to Chorey and should not be meaningfully paywalled.

### Giving Options

- Parents maintain approved Giving destinations.
- Destinations can include charities, people in need, family causes, community causes, or other parent-approved options.
- Children can suggest Giving options.
- Parent approval is required before a suggested option becomes selectable.

### Monthly/Weekly Giving Choice

- Child chooses a Giving destination during settlement.
- Parent reviews/confirms before marking Giving as settled.
- Giving should feel like a family reflection ritual.

Free and paid users should both have access to meaningful Giving behavior.

## 12. Secret Chores

Secret chores are paid-only.

Rules:

- Parent creates secret chore.
- Parent chooses reveal time.
- Eligible kids see it at the same time.
- Reward amount is visible when revealed.
- First child whose work is parent-approved wins.
- Marking as done first does not guarantee the reward.

Secret chores provide light competition without leaderboards.

## 13. Reminders and Notifications

Reminders are paid-only.

Paid reminder features:

- General daily reminder per child.
- Optional due-time reminder per chore.
- Chore submission notifications for parents.
- Approval/send-back notifications for children where appropriate.

Tone:

- Calm and practical.
- No nagging loops.
- No streak pressure.

Implementation:

- Expo Notifications for push notifications.
- Supabase scheduled jobs / Edge Functions for backend scheduling logic.

## 14. Milestones and Gamification

Chorey should include light gamification only.

Allowed:

- Private personal milestones.
- Secret chores.
- Calm monthly/weekly highlights.

Not allowed in MVP:

- Sibling leaderboards.
- Public rankings.
- Levels.
- XP systems.
- Loot/reward unlocks.
- Heavy streak mechanics.
- Family challenges.

Milestones:

- Recognition only.
- No unlocks or rewards.
- Visible to child and parents.

Free tier:

- Basic milestones.

Paid tier:

- Richer milestone history and progress timeline.

Family challenges are post-MVP.

## 15. Monetization

### Buyer

Parents pay. Children never see billing.

### Model

Freemium plus one paid household subscription.

No launch:

- Lifetime purchase
- One-time unlock
- Paid add-ons
- Multiple paid tiers
- Referral discounts
- Promo code strategy

### Subscription Plans

Paid plan options:

- Monthly
- Yearly

No weekly plan.

Yearly should be materially discounted versus 12 monthly payments, recommended 30-40% off.

Free trial:

- Standard free trial.
- Recommended 7 days.
- Parent chooses monthly or yearly upfront.
- Trial converts automatically unless cancelled.
- Use App Store / Google Play standard subscription behavior via RevenueCat.

### Free Tier: Try the Habit

Free tier includes:

- 1 child
- 1 parent admin
- 5 active chore templates
- Manual one-off chores
- Basic approval flow
- Basic 40 / 40 / 20 dashboard
- Spend wishlist with limited active items, recommended 3
- Giving options and child Giving suggestions
- Basic private milestones
- Current active settlement period
- Limited history, recommended current plus one previous period

Free tier excludes:

- Recurring chores
- Reminders
- Multiple children
- Multiple parent admins
- Photo proof
- Secret chores
- Full settlement history
- Full statements
- Unlimited wishlist items
- Rich milestone history

### Paid Tier: Run the Household

Paid tier includes:

- Multiple children
- Multiple parent admins
- Unlimited chores
- Recurring chores
- Scheduled reminders
- Photo proof
- Secret chores
- Full settlement history
- Weekly/monthly statements
- Unlimited Spend wishlist items
- Richer private milestone history
- Full household automation

Paid positioning:

"Free helps you try Chorey. Paid lets Chorey run the household rhythm."

### Paywall Timing

No hard paywall at launch.

Parent should be able to:

- Create account
- Create household
- Add first child
- Use the basic 40 / 40 / 20 flow

Show contextual paywalls when parent tries paid features:

- Add second child
- Create recurring chore
- Enable reminders
- Require photo proof
- Create secret chore
- View full history
- Add parent co-admin

Also provide a central Upgrade screen in parent settings.

Child app never shows paywalls or upgrade prompts.

### Lapsed Subscription Behavior

If a subscription lapses:

- Historical data remains visible.
- Existing household data is not deleted.
- Paid actions are disabled.
- Recurring generation stops or pauses.
- All children remain visible.
- Parent chooses one active child for free-tier ongoing use.
- Other children become read-only until subscription renews.

If a free household upgrades:

- Existing data carries forward.
- Paid features unlock on top of current household.

### Entitlements

- Purchase is made by a parent account.
- Entitlement applies to the household.
- All parent admins in that household get paid access.
- RevenueCat purchase state maps to household entitlement in Supabase.

## 16. Technical Stack

### Mobile App

- React Native
- Expo
- Expo Router
- TypeScript
- iOS and Android support

### Backend

- Supabase
- Supabase Auth
- Postgres
- Row Level Security
- Supabase Edge Functions
- Supabase Cron / scheduled jobs

### Auth

Parent auth:

- Google
- Apple
- OTP / magic link

Child auth:

- Parent-linked account
- Simple child login model to be designed

### Photo Storage

- AWS S3
- Presigned upload URLs
- Client-side compression before upload
- Backend deletion after approval/send-back/expiry
- Metadata stored in Supabase

### Notifications

- Expo Notifications

### Purchases

- RevenueCat
- App Store subscriptions
- Google Play subscriptions
- Household entitlement sync to Supabase

### Observability and Analytics

- Sentry if free/cheap enough at launch
- PostHog for product analytics

Analytics should avoid sensitive child content. Track events such as:

- chore_created
- chore_submitted
- chore_approved
- chore_sent_back
- settlement_completed
- wishlist_item_requested
- photo_proof_required
- subscription_started
- trial_started

Do not track:

- chore proof images
- child notes
- private free-text content where avoidable
- sensitive home/family content

### Build and Release

- EAS Build
- EAS Submit
- EAS Update

## 17. Security, Privacy, and Compliance Notes

### RLS

Every exposed Supabase table should have RLS enabled.

Policy goals:

- Parents can access their household.
- Children can access only their own child-facing data.
- Children cannot see sibling earnings by default.
- Billing/admin actions are parent-only.
- Service-role operations happen only in backend functions.

### Photo Privacy

- Temporary proof only.
- Delete after review.
- Hard expiry for abandoned photos.
- Metadata audit only.
- No permanent home-photo archive.

### Legal

Before launch, Chorey needs:

- Privacy policy
- Terms of service
- Child data handling posture
- Photo retention policy
- Data processor list
- Subscription terms
- App Store and Play Store compliance review

Marketing should avoid unsupported legal claims such as "GDPR compliant" until properly reviewed.

## 18. Design Direction

Use the provided design handoff as the starting point, but rename Sprout to Chorey throughout.

Design principles:

- Clean, warm, family-friendly.
- Parent surface: calm, factual, modern.
- Child surface: warm, slightly larger, quietly satisfying.
- No noisy gamification.
- No emoji as product UI icons.
- 40 / 40 / 20 buckets are visual anchors.
- Bucket colors should remain consistent:
  - Spend / Allowance color
  - Savings color
  - Giving color
- Money should always be clear and formatted with two decimal places.

The existing dashboard direction in the handoff is approved as a strong baseline.

## 19. MVP Scope

### In MVP

- Parent auth
- Parent-linked child accounts
- Household creation
- One household per child
- Free and paid tiers
- RevenueCat subscription entitlement
- One-off chores
- Paid and unpaid chores
- Recurring chores on paid
- Checklist support
- Approval/send-back flow
- Required send-back reason
- Fixed 40 / 40 / 20 ledger
- Weekly/monthly settlement frequency
- Bucket-by-bucket settlement confirmation
- Spend wishlist
- Giving options and suggestions
- Secret chores on paid
- Photo proof on paid
- Reminders on paid
- Basic and rich milestones
- S3 temporary photo lifecycle
- Push notifications
- PostHog
- Sentry if viable

### Out of MVP

- Real money movement
- Bank integrations
- Real charity integrations
- In-app chat
- Sibling leaderboards
- Family challenges
- Multiple paid tiers
- Lifetime purchase
- Referral discounts
- Promo strategy
- Multi-household children
- Built-in age-based chore recommendations
- PDF/export summaries

## 20. Future Improvements

Potential post-MVP features:

- PDF or exportable weekly/monthly summaries
- Printable chore summaries
- Family challenge mode
- Optional template packs
- School/community/family plan promotions
- More advanced analytics for parents
- Real charity integrations
- Real financial account integrations
- Multi-household support
- More granular parent permissions

