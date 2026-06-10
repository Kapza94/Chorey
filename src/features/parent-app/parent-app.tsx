import { useState } from "react";
import { View } from "react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import {
  ParentKidsScreen,
  type KidPaymentSummary,
  type PendingApproval,
  type PendingGivingSuggestion,
  type PendingPurchase,
} from "@/features/parent-app/parent-kids-screen";
import {
  ParentPaymentsScreen,
  type DuePayout,
  type PayoutHistoryRow,
} from "@/features/parent-app/parent-payments-screen";
import {
  ParentChoresScreen,
  type ChoreAssignee,
  type ChoreLibraryItem,
} from "@/features/parent-app/parent-chores-screen";
import { ParentSettingsScreen } from "@/features/parent-app/parent-settings-screen";
import {
  ParentTabBar,
  type ParentKid,
  type ParentTab,
} from "@/features/parent-app/parent-primitives";
import type { CurrencyCode } from "@/features/money/currency";
import type { PayoutMethod } from "@/features/payments/payment-actions";
import type { Split } from "@/features/money/split";
import type { SettlementFrequency } from "@/features/household/household-actions";
import type { SettlementPeriod } from "@/features/settlement/settlement-actions";
import type { Recurrence } from "@/features/chores/recurrence";

type Props = {
  subtitle?: string;
  currency?: CurrencyCode;
  split?: Split;
  kids?: ParentKid[];
  pendingApprovals?: PendingApproval[];
  purchaseRequests?: PendingPurchase[];
  givingSuggestions?: PendingGivingSuggestion[];
  payments?: KidPaymentSummary[];
  onSelectKid?: (id: string) => void;
  onAddKid?: () => void;
  onReviewApprovals?: () => void;
  onApproveChore?: (choreId: string) => void;
  onSendBackChore?: (choreId: string, reason: string) => void;
  onApprovePurchase?: (requestId: string) => void;
  onApproveGivingSuggestion?: (suggestionId: string) => void;
  // Payments
  due?: DuePayout[];
  payoutHistory?: PayoutHistoryRow[];
  paidThisMonthCents?: number;
  settlementPeriod?: SettlementPeriod | null;
  onMarkPaid?: (
    kidId: string,
    amountCents: number,
    method: PayoutMethod,
    detail?: string,
  ) => void;
  onMarkAllSettled?: () => void;
  // Chores
  chores?: ChoreLibraryItem[];
  assignees?: ChoreAssignee[];
  recurringLocked?: boolean;
  onAddChore?: (input: {
    name: string;
    rewardCents: number;
    assigneeId: string;
    recurrence?: Recurrence;
  }) => void;
  // Settings
  onChangeBudget?: (kidId: string, budgetCents: number) => void;
  onChangeCadence?: (kidId: string, cadence: SettlementFrequency) => void;
  onLogOut?: () => void;
  initialTab?: ParentTab;
};

/**
 * The parent app shell — hosts the Kids / Chores / Pay / Settings tabs and the
 * shared bottom bar. Kids is built; the other tabs land in following phases.
 */
export function ParentApp({
  subtitle,
  currency,
  split,
  kids,
  pendingApprovals,
  purchaseRequests,
  givingSuggestions,
  payments,
  onSelectKid,
  onAddKid,
  onReviewApprovals,
  onApproveChore,
  onSendBackChore,
  onApprovePurchase,
  onApproveGivingSuggestion,
  due,
  payoutHistory,
  paidThisMonthCents,
  settlementPeriod,
  onMarkPaid,
  onMarkAllSettled,
  chores,
  assignees,
  recurringLocked,
  onAddChore,
  onChangeBudget,
  onChangeCadence,
  onLogOut,
  initialTab = "kids",
}: Props) {
  const { scheme } = useChoreyTheme();
  const [tab, setTab] = useState<ParentTab>(initialTab);

  // Approving is the parent's most frequent job — surface what's waiting from
  // every tab, not just inside Kids.
  const reviewCount =
    (pendingApprovals?.length ?? 0) +
    (purchaseRequests?.length ?? 0) +
    (givingSuggestions?.length ?? 0);

  return (
    <View style={{ flex: 1, backgroundColor: scheme.bgPage }}>
      {tab === "kids" ? (
        <ParentKidsScreen
          subtitle={subtitle}
          currency={currency}
          kids={kids}
          pendingApprovals={pendingApprovals}
          purchaseRequests={purchaseRequests}
          givingSuggestions={givingSuggestions}
          payments={payments}
          onSelectKid={onSelectKid}
          onAddKid={onAddKid}
          onReviewApprovals={onReviewApprovals}
          onApproveChore={onApproveChore}
          onSendBackChore={onSendBackChore}
          onApprovePurchase={onApprovePurchase}
          onApproveGivingSuggestion={onApproveGivingSuggestion}
        />
      ) : tab === "chores" ? (
        <ParentChoresScreen
          currency={currency}
          split={split}
          kids={kids}
          chores={chores}
          assignees={assignees}
          recurringLocked={recurringLocked}
          onAddChore={onAddChore}
        />
      ) : tab === "pay" ? (
        <ParentPaymentsScreen
          currency={currency}
          due={due}
          history={payoutHistory}
          thisMonthCents={paidThisMonthCents}
          settlementPeriod={settlementPeriod}
          onMarkPaid={onMarkPaid}
          onMarkAllSettled={onMarkAllSettled}
        />
      ) : (
        <ParentSettingsScreen
          currency={currency}
          split={split}
          kids={kids}
          onChangeBudget={onChangeBudget}
          onChangeCadence={onChangeCadence}
          onLogOut={onLogOut}
        />
      )}

      <ParentTabBar active={tab} onChange={setTab} reviewCount={reviewCount} />
    </View>
  );
}
