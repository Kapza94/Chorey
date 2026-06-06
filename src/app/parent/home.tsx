import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { ParentApp } from "@/features/parent-app/parent-app";
import type { ParentKid } from "@/features/parent-app/parent-primitives";
import type {
  PendingApproval,
  PendingGivingSuggestion,
  PendingPurchase,
} from "@/features/parent-app/parent-kids-screen";
import { listHouseholdKids } from "@/features/parent-app/default-parent-kids-actions";
import { getHouseholdSettings } from "@/features/household/default-household-actions";
import { toPayoutHistoryRows } from "@/features/parent-app/payout-history";
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
import {
  approveChoreForHousehold,
  createChoreForHousehold,
  listChoresForHousehold,
  sendBackChoreForHousehold,
} from "@/features/chores/default-chore-actions";
import type { CreatedChore } from "@/features/chores/chore-actions";
import {
  createChoreTemplateForHousehold,
  ensureRecurringInstancesForHousehold,
} from "@/features/chores/default-chore-template-actions";
import { updateChildSettingsForHousehold } from "@/features/children/default-child-actions";
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
  const [purchases, setPurchases] = useState<HouseholdPurchaseRequest[]>([]);
  const [suggestions, setSuggestions] = useState<GivingSuggestion[]>([]);
  const [settlementPeriod, setSettlementPeriod] = useState<SettlementPeriod | null>(null);

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
    ] = await Promise.all([
      listHouseholdKids(householdId),
      getHouseholdSettings(householdId),
      listPayoutsForHousehold(householdId),
      listChoresForHousehold(householdId),
      listPurchaseRequestsForHousehold(householdId),
      listGivingSuggestionsForHousehold(householdId),
      getActiveSettlementPeriod(householdId),
    ]);

    setKids(nextKids);
    setCurrency(settings.currency);
    setSplit(settings.split);
    setPayouts(nextPayouts);
    setChores(nextChores);
    setPurchases(nextPurchases);
    setSuggestions(nextSuggestions);
    setSettlementPeriod(nextPeriod);
  }, [householdId]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const kidsById = new Map(kids.map((kid) => [kid.id, kid]));
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

  const due: DuePayout[] = kids.map((kid) => ({
    id: kid.id,
    name: kid.name,
    tone: kid.tone,
    earnedCents: kid.earnedCents,
    allowanceCents: kid.allowanceCents,
    savingsCents: kid.savingsCents,
    givingCents: kid.givingCents,
    choresDone: kid.choresDone,
    cadence: kid.cadence,
  }));

  return (
    <ParentApp
      subtitle="This week"
      currency={currency}
      split={split}
      kids={kids}
      pendingApprovals={pendingApprovals}
      purchaseRequests={purchaseRequests}
      givingSuggestions={givingSuggestions}
      onApproveChore={async (choreId) => {
        if (!householdId) {
          return;
        }

        await approveChoreForHousehold({ householdId, choreId });
        await reload();
      }}
      onSendBackChore={async (choreId, reason) => {
        if (!householdId) {
          return;
        }

        await sendBackChoreForHousehold({ householdId, choreId, reason });
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
      onAddKid={() =>
        router.push({
          pathname: "/parent/children/new",
          params: { householdId: householdId ?? "" },
        })
      }
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
        setPayouts(await listPayoutsForHousehold(householdId));
      }}
      chores={chores.map((chore) => ({
        id: chore.id,
        name: chore.title,
        valueCents: chore.rewardCents,
        freq: "One-off",
        assignedTo: kidsById.get(chore.childProfileId)?.name ?? "",
      }))}
      assignees={kids.map((kid) => ({ id: kid.id, name: kid.name }))}
      onAddChore={async ({ name, rewardCents, assigneeId, recurrence }) => {
        if (!householdId || !name.trim()) {
          return;
        }

        // "all" fans the chore out to every kid (one instance / template each).
        const targetIds =
          assigneeId === "all" ? kids.map((kid) => kid.id) : [assigneeId];
        const title = name.trim();

        if (recurrence) {
          // Recurring chores are paid-only; the action throws for free/lapsed.
          try {
            await Promise.all(
              targetIds.map((childProfileId) =>
                createChoreTemplateForHousehold({
                  householdId,
                  childProfileId,
                  title,
                  rewardCents,
                  recurrence,
                }),
              ),
            );
            await ensureRecurringInstancesForHousehold(householdId);
          } catch {
            router.push({ pathname: "/parent/upgrade", params: { householdId } });
            return;
          }
        } else {
          await Promise.all(
            targetIds.map((childProfileId) =>
              createChoreForHousehold({
                householdId,
                childProfileId,
                title,
                rewardCents,
              }),
            ),
          );
        }

        await reload();
      }}
    />
  );
}
