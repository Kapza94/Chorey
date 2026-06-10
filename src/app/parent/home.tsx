import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { ParentApp } from "@/features/parent-app/parent-app";
import type { ParentKid } from "@/features/parent-app/parent-primitives";
import type {
  KidPaymentSummary,
  PendingApproval,
  PendingGivingSuggestion,
  PendingPurchase,
} from "@/features/parent-app/parent-kids-screen";
import { listHouseholdKids } from "@/features/parent-app/default-parent-kids-actions";
import { getHouseholdSettings } from "@/features/household/default-household-actions";
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
import { getHouseholdAccess } from "@/features/entitlements/default-entitlement-actions";
import type { HouseholdAccess } from "@/features/entitlements/entitlements";
import { createDefaultParentAuthActions } from "@/features/auth/default-parent-auth-actions";
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
  const [purchases, setPurchases] = useState<HouseholdPurchaseRequest[]>([]);
  const [suggestions, setSuggestions] = useState<GivingSuggestion[]>([]);
  const [settlementPeriod, setSettlementPeriod] = useState<SettlementPeriod | null>(null);
  const [accessCodes, setAccessCodes] = useState<
    { kidId: string; accessCode: string }[]
  >([]);
  const [access, setAccess] = useState<HouseholdAccess>("free");

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
      getHouseholdAccess(householdId),
      listChildAccessCodes(householdId),
    ]);

    setKids(nextKids);
    setCurrency(settings.currency);
    setSplit(settings.split);
    setPayouts(nextPayouts);
    setChores(nextChores);
    setPurchases(nextPurchases);
    setSuggestions(nextSuggestions);
    setSettlementPeriod(nextPeriod);
    setAccess(nextAccess);
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

  return (
    <ParentApp
      subtitle="This week"
      currency={currency}
      split={split}
      kids={kids}
      pendingApprovals={pendingApprovals}
      purchaseRequests={purchaseRequests}
      givingSuggestions={givingSuggestions}
      payments={kidPayments}
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
      accessCodes={accessCodes}
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
      onLogOut={async () => {
        await createDefaultParentAuthActions().signOut();
        router.replace("/");
      }}
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
      recurringLocked={access !== "paid"}
      onAddChore={async ({ name, rewardCents, assigneeId, recurrence }) => {
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
