import { useCallback, useEffect, useMemo, useState } from "react";
import { Linking } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { ParentApp } from "@/features/parent-app/parent-app";
import type { ParentKid } from "@/features/parent-app/parent-primitives";
import { LevelUpToast } from "@/components/level-up-toast";
import { levelForPoints, pointsForChore } from "@/features/game/leveling";
import type {
  KidPaymentSummary,
  PendingApproval,
  PendingGivingSuggestion,
  PendingPurchase,
} from "@/features/parent-app/parent-kids-screen";
import { listHouseholdKids } from "@/features/parent-app/default-parent-kids-actions";
import {
  getHouseholdSettings,
  updateHouseholdSplit,
} from "@/features/household/default-household-actions";
import {
  formatPayoutDate,
  toPayoutHistoryRows,
} from "@/features/parent-app/payout-history";
import {
  approvePurchaseRequestForHousehold,
  listPurchaseRequestsForHousehold,
} from "@/features/spend-wishlist/default-spend-wishlist-actions";
import type { HouseholdPurchaseRequest } from "@/features/spend-wishlist/spend-wishlist-actions";
import {
  approveGivingSuggestionForHousehold,
  listGivingSuggestionsForHousehold,
} from "@/features/giving/default-giving-actions";
import type { GivingSuggestion } from "@/features/giving/giving-actions";
import {
  getActiveSettlementPeriod,
  settleAllSettlementBuckets,
} from "@/features/settlement/default-settlement-actions";
import type { SettlementPeriod } from "@/features/settlement/settlement-actions";
import { getHouseholdSubscription } from "@/features/entitlements/default-subscription-actions";
import {
  describeSubscription,
  type HouseholdSubscription,
} from "@/features/entitlements/subscription-actions";
import { isEntitled } from "@/features/entitlements/entitlements";
import {
  configureRevenueCat,
  createRevenueCatGateway,
  getStoreManagementUrl,
} from "@/features/entitlements/default-purchase-actions";
import type { PlanOffer } from "@/features/entitlements/purchases";
import { submitAppFeedback } from "@/features/feedback/default-feedback-actions";
import { shareStatsActions } from "@/features/parent-app/default-share-actions";
import { deleteParentAccount } from "@/features/account/default-account-actions";
import { SubscriptionScreen } from "@/features/subscription/subscription-screen";
import { createDefaultParentAuthActions } from "@/features/auth/default-parent-auth-actions";
import {
  getParentIdentity,
  updateParentDisplayName,
  type ParentIdentity,
} from "@/features/auth/parent-identity-actions";
import { pickAndUploadParentAvatar } from "@/features/account/default-avatar-actions";
import {
  approveChoreForHousehold,
  createChoreForHousehold,
  deleteChoreForHousehold,
  listChoresForHousehold,
  sendBackChoreForHousehold,
  signChorePhotoUrls,
} from "@/features/chores/default-chore-actions";
import type { CreatedChore } from "@/features/chores/chore-actions";
import { isRecurringChoreLate } from "@/features/chores/recurrence";
import { dueAtFromTime } from "@/features/chores/due-time";
import type { ChoreBoardItem } from "@/features/parent-app/parent-chores-screen";
import {
  createChoreTemplateForHousehold,
  ensureRecurringInstancesForHousehold,
} from "@/features/chores/default-chore-template-actions";
import { updateChildSettingsForHousehold } from "@/features/children/default-child-actions";
import { listChildAccessCodes } from "@/features/children/default-child-access-actions";
import {
  listPayoutsForHousehold,
  recordPayoutForHousehold,
} from "@/features/payments/default-payment-actions";
import { payoutsThisMonthCents, type Payout } from "@/features/payments/payment-actions";
import { DEFAULT_SPLIT, type Split } from "@/features/money/split";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/features/money/currency";
import type { DuePayout } from "@/features/parent-app/parent-payments-screen";

/**
 * The redesigned parent app, fed from real Supabase rows for the household the
 * parent just created. Per-kid aggregates come from the `list_household_kids`
 * RPC; currency + split come from the household row; payouts from the `payouts`
 * table.
 */
export default function ParentHomeRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ householdId?: string }>();
  const householdId = Array.isArray(params.householdId)
    ? params.householdId[0]
    : params.householdId;

  const [kids, setKids] = useState<ParentKid[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [split, setSplit] = useState<Split>(DEFAULT_SPLIT);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [chores, setChores] = useState<CreatedChore[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [purchases, setPurchases] = useState<HouseholdPurchaseRequest[]>([]);
  const [suggestions, setSuggestions] = useState<GivingSuggestion[]>([]);
  const [settlementPeriod, setSettlementPeriod] = useState<SettlementPeriod | null>(null);
  const [accessCodes, setAccessCodes] = useState<
    { kidId: string; accessCode: string }[]
  >([]);
  const [subscription, setSubscription] = useState<HouseholdSubscription>({
    status: "trialing",
    plan: null,
    trialEndsAt: null,
    currentPeriodEndsAt: null,
  });
  // Billing: configure RevenueCat for this household and load live store prices
  // so a lapsed parent can resubscribe right from the paused takeover. No-ops
  // cleanly when billing isn't configured yet.
  const billing = useMemo(() => createRevenueCatGateway(), []);
  const [offers, setOffers] = useState<PlanOffer[]>([]);
  // A lapsed household lands on the subscription screen first; dismissing it
  // leaves the parent in the read-only app (data stays readable by design).
  const [pausedTakeoverDismissed, setPausedTakeoverDismissed] = useState(false);
  // A kid just crossed a level via an approval — celebrate for the parent too.
  const [levelUp, setLevelUp] = useState<{ name: string; level: number } | null>(null);
  // The signed-in parent's identity (header avatar + account sheet).
  const [identity, setIdentity] = useState<ParentIdentity | null>(null);
  const [householdName, setHouseholdName] = useState("");

  useEffect(() => {
    void getParentIdentity().then(setIdentity);
  }, []);

  useEffect(() => {
    if (!householdId) {
      return;
    }
    configureRevenueCat(householdId);
    let cancelled = false;
    void billing.loadOffers().then((loaded) => {
      if (!cancelled) {
        setOffers(loaded);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [billing, householdId]);

  const reload = useCallback(async () => {
    if (!householdId) {
      return;
    }

    // Materialize any recurring chores due this period before reading chores.
    await ensureRecurringInstancesForHousehold(householdId);

    const [
      nextKids,
      settings,
      nextPayouts,
      nextChores,
      nextPurchases,
      nextSuggestions,
      nextPeriod,
      nextAccess,
      nextAccessCodes,
    ] = await Promise.all([
      listHouseholdKids(householdId),
      getHouseholdSettings(householdId),
      listPayoutsForHousehold(householdId),
      listChoresForHousehold(householdId),
      listPurchaseRequestsForHousehold(householdId),
      listGivingSuggestionsForHousehold(householdId),
      getActiveSettlementPeriod(householdId),
      getHouseholdSubscription(householdId),
      listChildAccessCodes(householdId),
    ]);

    setKids(nextKids);
    setCurrency(settings.currency);
    setSplit(settings.split);
    setHouseholdName(settings.name);
    setPayouts(nextPayouts);
    setChores(nextChores);

    // Sign URLs only for submitted chores that carry a photo — that's all the
    // approval cards render.
    const photoPaths = nextChores
      .filter((chore) => chore.status === "submitted" && chore.photoPath)
      .map((chore) => chore.photoPath as string);
    setPhotoUrls(await signChorePhotoUrls(photoPaths));

    setPurchases(nextPurchases);
    setSuggestions(nextSuggestions);
    setSettlementPeriod(nextPeriod);
    setSubscription(nextAccess);
    setAccessCodes(
      nextAccessCodes.map((code) => ({
        kidId: code.childProfileId,
        accessCode: code.accessCode,
      })),
    );
  }, [householdId]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const kidsById = new Map(kids.map((kid) => [kid.id, kid]));

  // Lifetime game points per kid, derived from the same chore list the rest
  // of the screen uses — keeps parent-visible levels in lockstep with the
  // kid app without extra queries.
  const pointsByKid = new Map<string, number>();
  for (const chore of chores) {
    if (chore.status === "approved") {
      pointsByKid.set(
        chore.childProfileId,
        (pointsByKid.get(chore.childProfileId) ?? 0) + pointsForChore(chore.rewardCents),
      );
    }
  }
  const leveledKids = kids.map((kid) => ({
    ...kid,
    level: levelForPoints(pointsByKid.get(kid.id) ?? 0),
  }));
  const pendingApprovals: PendingApproval[] = chores
    .filter((chore) => chore.status === "submitted")
    .map((chore) => {
      const kid = kidsById.get(chore.childProfileId);
      return {
        id: chore.id,
        childName: kid?.name ?? "",
        title: chore.title,
        rewardCents: chore.rewardCents,
        tone: kid?.tone ?? "allowance",
        photoUrl: chore.photoPath ? photoUrls[chore.photoPath] : undefined,
      };
    });

  // The Chores-tab board: every live instance, grouped by status downstream,
  // with overdue recurring chores flagged late.
  const choreBoard: ChoreBoardItem[] = chores.map((chore) => {
    const kid = kidsById.get(chore.childProfileId);
    return {
      id: chore.id,
      title: chore.title,
      childName: kid?.name ?? "",
      rewardCents: chore.rewardCents,
      tone: kid?.tone ?? "allowance",
      status: chore.status,
      recurrence: chore.recurrence,
      late: isRecurringChoreLate(chore),
      dueAt: chore.dueAt,
      sentBackReason: chore.sentBackReason,
    };
  });

  const purchaseRequests: PendingPurchase[] = purchases
    .filter((request) => request.status === "pending")
    .map((request) => ({
      id: request.id,
      childName: request.childName,
      itemName: request.itemName,
      targetCents: request.targetCents,
    }));

  const givingSuggestions: PendingGivingSuggestion[] = suggestions
    .filter((suggestion) => suggestion.status === "pending")
    .map((suggestion) => ({
      id: suggestion.id,
      childName: suggestion.childName ?? "",
      name: suggestion.name,
    }));

  // Total already paid out per kid (all time), shown in the payments sheet.
  const paidByKid = new Map<string, number>();
  for (const payout of payouts) {
    paidByKid.set(
      payout.childProfileId,
      (paidByKid.get(payout.childProfileId) ?? 0) + payout.amountCents,
    );
  }

  // Owed = the kid's net Spend balance (payouts and purchases are already
  // deducted in the ledger). Savings and Giving never leave the app as cash.
  const due: DuePayout[] = kids.map((kid) => ({
    id: kid.id,
    name: kid.name,
    tone: kid.tone,
    earnedCents: kid.earnedCents,
    spendCents: kid.allowanceCents,
    savingsCents: kid.savingsCents,
    givingCents: kid.givingCents,
    choresDone: kid.choresDone,
    cadence: kid.cadence,
  }));

  // Per-kid payment summaries for the Kids-tab detail sheet.
  const kidPayments: KidPaymentSummary[] = kids.map((kid) => ({
    kidId: kid.id,
    earnedCents: kid.earnedCents,
    paidCents: paidByKid.get(kid.id) ?? 0,
    spendCents: kid.allowanceCents,
    history: payouts
      .filter((payout) => payout.childProfileId === kid.id)
      .map((payout) => ({
        id: payout.id,
        dateLabel: formatPayoutDate(payout.paidAt),
        method: payout.method,
        detail: payout.note,
        amountCents: payout.amountCents,
      })),
  }));

  // The spec's lapsed behavior: parents land on a clear subscription screen.
  if (subscription.status === "lapsed" && !pausedTakeoverDismissed) {
    return (
      <SubscriptionScreen
        subscription={subscription}
        offers={offers}
        onChoosePlan={async (plan) => {
          await billing.purchase(plan);
          await reload();
        }}
        onRestore={async () => {
          await billing.restore();
          await reload();
        }}
        onClose={() => setPausedTakeoverDismissed(true)}
      />
    );
  }

  return (
    <>
    <ParentApp
      subtitle="This week"
      currency={currency}
      split={split}
      kids={leveledKids}
      pendingApprovals={pendingApprovals}
      purchaseRequests={purchaseRequests}
      givingSuggestions={givingSuggestions}
      payments={kidPayments}
      onApproveChore={async (choreId) => {
        if (!householdId) {
          return;
        }

        // Did this approval push the kid past a level threshold?
        const chore = chores.find((c) => c.id === choreId);
        const prePoints = chore ? (pointsByKid.get(chore.childProfileId) ?? 0) : 0;

        await approveChoreForHousehold({ householdId, choreId });

        if (chore && chore.status !== "approved") {
          const postLevel = levelForPoints(prePoints + pointsForChore(chore.rewardCents));
          if (postLevel > levelForPoints(prePoints)) {
            setLevelUp({
              name: kidsById.get(chore.childProfileId)?.name ?? "Your child",
              level: postLevel,
            });
          }
        }
        await reload();
      }}
      onSendBackChore={async (choreId, reason) => {
        if (!householdId) {
          return;
        }

        await sendBackChoreForHousehold({ householdId, choreId, reason });
        await reload();
      }}
      onDeleteChore={async (choreId) => {
        if (!householdId) {
          return;
        }

        await deleteChoreForHousehold({ householdId, choreId });
        await reload();
      }}
      onApprovePurchase={async (requestId) => {
        if (!householdId) {
          return;
        }

        await approvePurchaseRequestForHousehold({ householdId, requestId });
        await reload();
      }}
      onApproveGivingSuggestion={async (suggestionId) => {
        if (!householdId) {
          return;
        }

        await approveGivingSuggestionForHousehold({ householdId, suggestionId });
        await reload();
      }}
      shareStats={shareStatsActions}
      accessCodes={accessCodes}
      subscriptionLabel={describeSubscription(subscription)}
      onManageSubscription={() =>
        router.push({ pathname: "/parent/subscription", params: { householdId } })
      }
      onChangeBudget={async (kidId, budgetCents) => {
        if (!householdId) {
          return;
        }

        await updateChildSettingsForHousehold({
          householdId,
          childProfileId: kidId,
          budgetCents,
        });
        await reload();
      }}
      onChangeCadence={async (kidId, cadence) => {
        if (!householdId) {
          return;
        }

        await updateChildSettingsForHousehold({
          householdId,
          childProfileId: kidId,
          cadence,
        });
        await reload();
      }}
      onChangeSplit={async (nextSplit) => {
        if (!householdId) {
          return;
        }
        // Optimistic: reflect the new split immediately, then persist.
        setSplit(nextSplit);
        await updateHouseholdSplit(householdId, nextSplit);
      }}
      onAddKid={() =>
        router.push({
          pathname: "/parent/children/new",
          params: { householdId: householdId ?? "" },
        })
      }
      onLogOut={async () => {
        await createDefaultParentAuthActions().signOut();
        router.replace("/");
      }}
      onDeleteAccount={async () => {
        await deleteParentAccount();
        // The account is already gone; a failed sign-out (e.g. offline) must not
        // strand the user on a now-invalid session — sign out best-effort, then
        // always return to the welcome screen.
        try {
          await createDefaultParentAuthActions().signOut();
        } catch {
          // ignore — the session is already invalid server-side
        }
        router.replace("/");
      }}
      account={
        identity
          ? {
              name: identity.name,
              email: identity.email,
              provider: identity.provider,
              avatarUrl: identity.avatarUrl,
              householdName,
            }
          : undefined
      }
      onEditName={async (name) => {
        setIdentity((prev) => (prev ? { ...prev, name } : prev));
        await updateParentDisplayName(name);
      }}
      onChangePhoto={async () => {
        const url = await pickAndUploadParentAvatar();
        if (url) {
          setIdentity((prev) => (prev ? { ...prev, avatarUrl: url } : prev));
        }
      }}
      onManageStoreSubscription={async () => {
        const url = await getStoreManagementUrl();
        await Linking.openURL(url);
      }}
      onSubmitContact={(message) => submitAppFeedback("contact", message, householdId)}
      onSubmitFeedback={(message) => submitAppFeedback("feedback", message, householdId)}
      due={due}
      payoutHistory={toPayoutHistoryRows(payouts, kids)}
      paidThisMonthCents={payoutsThisMonthCents(payouts)}
      settlementPeriod={settlementPeriod}
      onMarkAllSettled={async () => {
        if (!householdId || !settlementPeriod) {
          return;
        }

        await settleAllSettlementBuckets({
          householdId,
          periodId: settlementPeriod.id,
        });
        await reload();
      }}
      onMarkPaid={async (kidId, amountCents, method, detail) => {
        if (!householdId) {
          return;
        }

        await recordPayoutForHousehold(householdId, {
          childProfileId: kidId,
          amountCents,
          method,
          note: detail,
        });
        // Reload everything, not just payouts: the payout deducts the kid's
        // Spend balance in the ledger, so "Ready to pay out" must refetch kids
        // or it keeps showing money that's already been handed over.
        await reload();
      }}
      // The board (To do / Needs you / Done) is the live chores view; the flat
      // library would just duplicate the same instances, so it's left empty.
      choreBoard={choreBoard}
      assignees={kids.map((kid) => ({ id: kid.id, name: kid.name }))}
      recurringLocked={!isEntitled(subscription.status)}
      onAddChore={async ({ name, rewardCents, assigneeId, recurrence, dueTime }) => {
        if (!householdId || !name.trim()) {
          return;
        }

        // "all" fans the chore out to every kid (one instance / template each).
        const targetIds =
          assigneeId === "all" ? kids.map((kid) => kid.id) : [assigneeId];
        const title = name.trim();

        if (recurrence) {
          // Recurring chores are paid-only. The sheet already locks the option
          // for free homes, so this only runs for paid; guard quietly anyway.
          // The template keeps the wall-clock time; the DB stamps each instance's
          // due_at in the household's timezone.
          try {
            await Promise.all(
              targetIds.map((childProfileId) =>
                createChoreTemplateForHousehold({
                  householdId,
                  childProfileId,
                  title,
                  rewardCents,
                  recurrence,
                  dueTime,
                }),
              ),
            );
            await ensureRecurringInstancesForHousehold(householdId);
          } catch {
            return;
          }
        } else {
          // One-off: resolve the chosen time to a concrete instant on the device.
          const dueAt = dueAtFromTime(dueTime ?? null);
          await Promise.all(
            targetIds.map((childProfileId) =>
              createChoreForHousehold({
                householdId,
                childProfileId,
                title,
                rewardCents,
                dueAt,
              }),
            ),
          );
        }

        await reload();
      }}
    />
    {levelUp ? (
      <LevelUpToast
        key={`${levelUp.name}-${levelUp.level}`}
        level={levelUp.level}
        kidName={levelUp.name}
        onDone={() => setLevelUp(null)}
      />
    ) : null}
    </>
  );
}
