# Graph Report - Chorey  (2026-06-08)

## Corpus Check
- 178 files · ~81,914 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 887 nodes · 1502 edges · 69 communities (63 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bed6fecf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 67|Community 67]]

## God Nodes (most connected - your core abstractions)
1. `useChoreyTheme()` - 74 edges
2. `formatMoney()` - 30 edges
3. `Chorey Product Specification` - 21 edges
4. `Chorey Build Plan` - 20 edges
5. `supabase` - 17 edges
6. `CurrencyCode` - 14 edges
7. `expo` - 13 edges
8. `Visual foundations` - 13 edges
9. `ParentKid` - 12 edges
10. `buckets` - 12 edges

## Surprising Connections (you probably didn't know these)
- `SpringCheckbox()` --calls--> `useChoreyTheme()`  [EXTRACTED]
  src/features/kid-home/kid-home-screen.tsx → src/theme/use-chorey-theme.ts
- `SuggestCauseSheet()` --calls--> `useChoreyTheme()`  [EXTRACTED]
  src/features/kid-home/kid-you-screen.tsx → src/theme/use-chorey-theme.ts
- `ApprovalsReviewSheet()` --calls--> `useChoreyTheme()`  [EXTRACTED]
  src/features/parent-app/parent-kids-screen.tsx → src/theme/use-chorey-theme.ts
- `SplitDot()` --calls--> `useChoreyTheme()`  [EXTRACTED]
  src/features/parent-app/parent-payments-screen.tsx → src/theme/use-chorey-theme.ts
- `BudgetCard()` --calls--> `useChoreyTheme()`  [EXTRACTED]
  src/features/parent-app/parent-settings-screen.tsx → src/theme/use-chorey-theme.ts

## Import Cycles
- None detected.

## Communities (69 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (37): emptyBalances, emptyBalances, ChildChore, createChildChoreActions(), RpcClient, ChoreStatus, listChoresForChild(), submitChoreForChild() (+29 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (43): currencyForCountry(), BudgetAmountField(), CAUSE_PICKS, CHORE_LIBRARY, ColorSwatch(), COUNTRIES, Country, INITIAL (+35 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (27): ChoreClient, createChoreActions(), CreateChoreInput, CreatedChore, approveChoreForHousehold(), createChoreForHousehold(), listChoresForHousehold(), sendBackChoreForHousehold() (+19 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (28): ChildClient, createChildActions(), CreateChildInput, CreatedChild, createChildForHousehold(), updateChildSettingsForHousehold(), createChoreTemplateActions(), CreateChoreTemplateInput (+20 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (17): ChildAccessScreen(), Props, ChildAccessClient, ChildAccessCode, createChildAccessActions(), normalizeAccessCode(), ResolvedChildAccess, createAccessCodeForChild() (+9 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (18): RootLayout(), DevRoleSwitcher(), createHouseholdForSignedInParent, getHouseholdSettings(), getPrimaryHouseholdId(), CreatedHousehold, createHouseholdActions(), CreateHouseholdInput (+10 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (21): CreateChorePayload, CreateChoreScreen(), getPreviewSplit(), Props, formatReward(), parseRewardCents(), splitRewardCents(), CheckCircleIcon() (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (25): CurrencyCode, Split, ParentApp(), Props, AssignedVsCap(), ChoreAssignee, ChoreLibraryItem, ParentChoresScreen() (+17 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (29): Animation, Backgrounds & textures, Borders & shadows, Budgets, cadence, and off-app payments, Card anatomy, Casing, Caveats, Chorey — Design System (+21 more)

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (30): dependencies, expo, expo-auth-session, expo-constants, expo-font, @expo-google-fonts/bricolage-grotesque, @expo-google-fonts/jetbrains-mono, @expo-google-fonts/plus-jakarta-sans (+22 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (25): accent, allowance, border, ChoreyShadow, cream, darkScheme, fg, fgDark (+17 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (17): BucketCard(), ChoreRow(), KidChoreState, KidHomeScreen(), Props, SpringCheckbox(), WEEKDAYS, COUNTRY_TO_CURRENCY (+9 more)

### Community 12 - "Community 12"
Cohesion: 0.13
Nodes (12): IndexRoute(), createDefaultParentAuthActions(), createParentAuthActions(), OAuthProvider, ParentAuthClient, noopActions, ParentSignInActions, ParentSignInScreen() (+4 more)

### Community 13 - "Community 13"
Cohesion: 0.13
Nodes (17): KidApp(), Props, KidTab, KidTabBar(), KidWish, KidWishlistScreen(), Props, KidYouScreen() (+9 more)

### Community 14 - "Community 14"
Cohesion: 0.09
Nodes (21): A. Onboarding (12 screens, branching), About the design files, Assets, B. Kid app — 3 tabs (Home · Wishlist · You), C. Parent app — 4 tabs (Kids · Chores · Pay · Settings), Color — neutrals (never pure #FFF / #000), Color — the 40/40/20 trio (brand DNA — load-bearing, never decorative), Design tokens (+13 more)

### Community 15 - "Community 15"
Cohesion: 0.10
Nodes (20): backgroundColor, adaptiveIcon, package, typedRoutes, expo, android, experiments, ios (+12 more)

### Community 16 - "Community 16"
Cohesion: 0.10
Nodes (20): Build Principles, Chorey Build Plan, Current Progress, Future/Post-MVP, Phase 0: Project Foundation, Phase 10: Photo Proof, Phase 11: Secret Chores, Phase 12: Milestones (+12 more)

### Community 17 - "Community 17"
Cohesion: 0.16
Nodes (15): CURRENCIES, balanceSplit(), clamp(), DEFAULT_SPLIT, isValidSplit(), splitCents(), AddChoreSheet(), BudgetCapField() (+7 more)

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (6): CHARITY_PICKS, CHORE_PICKS, OBParentDone(), useMounted(), OBIdea(), OBWelcome()

### Community 19 - "Community 19"
Cohesion: 0.16
Nodes (12): DueCard(), DuePayout, METHODS, OTHER_PRESETS, owedCents(), ParentPaymentsScreen(), PERIOD_MONTHS, periodDay() (+4 more)

### Community 20 - "Community 20"
Cohesion: 0.15
Nodes (11): Architecture, Commands, Database / RLS, Directory structure, Environment, Git workflow, Money / ledger, Product overview (+3 more)

### Community 21 - "Community 21"
Cohesion: 0.24
Nodes (6): ChildSetupScreen(), CreateChildPayload, Props, Props, SetupScreenLayout(), ChoreyTheme

### Community 22 - "Community 22"
Cohesion: 0.18
Nodes (11): scripts, android, db:reset, db:test, ios, lint, start, test (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.20
Nodes (9): jest, moduleNameMapper, preset, setupFilesAfterEnv, main, ^@/(.*)$, name, private (+1 more)

### Community 24 - "Community 24"
Cohesion: 0.20
Nodes (10): devDependencies, eslint, eslint-config-expo, jest, jest-expo, react-test-renderer, @testing-library/react-native, @types/jest (+2 more)

### Community 25 - "Community 25"
Cohesion: 0.20
Nodes (9): 10. Spend Wishlist, 12. Secret Chores, 13. Reminders and Notifications, 14. Milestones and Gamification, 18. Design Direction, 1. Product Summary, 20. Future Improvements, 2. Core Product Principles (+1 more)

### Community 26 - "Community 26"
Cohesion: 0.20
Nodes (9): compilerOptions, baseUrl, ignoreDeprecations, paths, strict, types, extends, include (+1 more)

### Community 27 - "Community 27"
Cohesion: 0.22
Nodes (8): Chorey Handover — resume point, Follow-ups (not blocking), How the round-trip was verified (✅ done — kept for reference), How to bring the stack back up (after a Docker/Metro restart), ✅ The folder rename is DONE, ⚠️ The trailing-space folder gotcha (why the app errored), TL;DR of where we are, What shipped today (committed)

### Community 28 - "Community 28"
Cohesion: 0.22
Nodes (9): 15. Monetization, Buyer, Entitlements, Free Tier: Try the Habit, Lapsed Subscription Behavior, Model, Paid Tier: Run the Household, Paywall Timing (+1 more)

### Community 29 - "Community 29"
Cohesion: 0.22
Nodes (9): 16. Technical Stack, Auth, Backend, Build and Release, Mobile App, Notifications, Observability and Analytics, Photo Storage (+1 more)

### Community 30 - "Community 30"
Cohesion: 0.25
Nodes (7): Chorey Design Context, Color, Components, Layout, Motion, Typography, Visual Direction

### Community 31 - "Community 31"
Cohesion: 0.25
Nodes (7): Chorey Morning Handover, ⏰ FIRST THING TOMORROW (before building anything), Gotchas, How the preview wiring works (so you don't get confused), Smaller follow-ups (do alongside the wiring), ⚠️ The big thing left: "make it real" (the wiring), Where everything stands

### Community 34 - "Community 34"
Cohesion: 0.43
Nodes (5): canReadChildProfile(), getMemberRole(), HouseholdMember, HouseholdRole, members

### Community 36 - "Community 36"
Cohesion: 0.38
Nodes (3): features, Props, UpgradeScreen()

### Community 37 - "Community 37"
Cohesion: 0.29
Nodes (6): Anti-References, Chorey Product Context, Product Purpose, Strategic Principles, Tone, Users

### Community 38 - "Community 38"
Cohesion: 0.29
Nodes (7): 5. Chore Model, Chore Checklists, Chore Types, Multi-Child Assignment, One-Off Chores, Recurring Chores, Reward Amounts

### Community 39 - "Community 39"
Cohesion: 0.33
Nodes (5): 1. Think Before Coding, 2. Simplicity First, 3. Surgical Changes, 4. Goal-Driven Execution, Agent Principles

### Community 40 - "Community 40"
Cohesion: 0.33
Nodes (5): Caveats, Component map, How a kid uses it, Kid UI kit, Screens

### Community 41 - "Community 41"
Cohesion: 0.33
Nodes (5): Caveats, Component map, How a parent uses it, Parent UI kit, Screens

### Community 42 - "Community 42"
Cohesion: 0.33
Nodes (6): 7. Photo Proof, Audit Metadata, Deletion Rules, Parent Controls, Review Rules, Upload Rules

### Community 43 - "Community 43"
Cohesion: 0.50
Nodes (4): computeTotals(), KidApp(), STARTING_CHORES, STARTING_TOTALS

### Community 46 - "Community 46"
Cohesion: 0.40
Nodes (4): Build-order checklist (for your own tracking), Claude Code kickoff — Chorey design adoption, Project context (already true in this repo), THE PROMPT (paste this)

### Community 48 - "Community 48"
Cohesion: 0.40
Nodes (5): 9. Settlement, History, Settlement Confirmation, Settlement Flow, Settlement Frequency

### Community 51 - "Community 51"
Cohesion: 0.50
Nodes (4): 17. Security, Privacy, and Compliance Notes, Legal, Photo Privacy, RLS

### Community 52 - "Community 52"
Cohesion: 0.50
Nodes (4): 4. Household and Account Model, Child Accounts, Household, Parent Accounts

### Community 53 - "Community 53"
Cohesion: 0.50
Nodes (4): 8. Ledger and 40 / 40 / 20 Split, Balance Timing, Display, Fixed Split

### Community 57 - "Community 57"
Cohesion: 0.67
Nodes (3): 11. Giving, Giving Options, Monthly/Weekly Giving Choice

### Community 58 - "Community 58"
Cohesion: 0.67
Nodes (3): 19. MVP Scope, In MVP, Out of MVP

### Community 59 - "Community 59"
Cohesion: 0.67
Nodes (3): 3. User Types, Children, Parents

### Community 60 - "Community 60"
Cohesion: 0.67
Nodes (3): 6. Chore Completion and Approval Flow, Approval, Send Back

## Knowledge Gaps
- **367 isolated node(s):** `allow`, `name`, `slug`, `version`, `orientation` (+362 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useChoreyTheme()` connect `Community 1` to `Community 6`, `Community 7`, `Community 11`, `Community 13`, `Community 17`, `Community 19`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `supabase` connect `Community 3` to `Community 0`, `Community 2`, `Community 4`, `Community 5`, `Community 6`, `Community 12`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `ChoreyTheme` connect `Community 21` to `Community 4`, `Community 5`, `Community 6`, `Community 36`, `Community 10`, `Community 12`, `Community 13`, `Community 49`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `allow`, `name`, `slug` to the rest of the system?**
  _367 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06144393241167435 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07653061224489796 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08888888888888889 - nodes in this community are weakly interconnected._