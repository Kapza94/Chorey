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
  type ChoreBoardItem,
  type ChoreLibraryItem,
} from "@/features/parent-app/parent-chores-screen";
import { ParentSettingsScreen } from "@/features/parent-app/parent-settings-screen";
import {
  ParentTabBar,
  type ParentKid,
  type ParentTab,
} from "@/features/parent-app/parent-primitives";
import {
  AccountAvatarButton,
  ParentAccountSheet,
  type ParentAccount,
} from "@/features/parent-app/parent-account";
import type { ShareStatsActions } from "@/features/parent-app/share-actions";
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
  onDeleteChore?: (choreId: string) => void;
  onApprovePurchase?: (requestId: string) => void;
  onApproveGivingSuggestion?: (suggestionId: string) => void;
  /** when set, the Kids tab offers a shareable weekly stats card */
  shareStats?: ShareStatsActions;
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
  choreBoard?: ChoreBoardItem[];
  assignees?: ChoreAssignee[];
  recurringLocked?: boolean;
  onAddChore?: (input: {
    name: string;
    rewardCents: number;
    assigneeId: string;
    recurrence?: Recurrence;
  }) => void;
  // Settings
  accessCodes?: { kidId: string; accessCode: string }[];
  subscriptionLabel?: string;
  onManageSubscription?: () => void;
  onChangeBudget?: (kidId: string, budgetCents: number) => void;
  onChangeCadence?: (kidId: string, cadence: SettlementFrequency) => void;
  onChangeSplit?: (split: Split) => void;
  onLogOut?: () => void;
  // Account
  account?: ParentAccount;
  onEditName?: (name: string) => void;
  onManageStoreSubscription?: () => void;
  onSubmitContact?: (message: string) => Promise<void>;
  onSubmitFeedback?: (message: string) => Promise<void>;
  onDeleteAccount?: () => Promise<void> | void;
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
  onDeleteChore,
  onApprovePurchase,
  onApproveGivingSuggestion,
  shareStats,
  due,
  payoutHistory,
  paidThisMonthCents,
  settlementPeriod,
  onMarkPaid,
  onMarkAllSettled,
  chores,
  choreBoard,
  assignees,
  recurringLocked,
  onAddChore,
  accessCodes,
  subscriptionLabel,
  onManageSubscription,
  onChangeBudget,
  onChangeCadence,
  onChangeSplit,
  onLogOut,
  account,
  onEditName,
  onManageStoreSubscription,
  onSubmitContact,
  onSubmitFeedback,
  onDeleteAccount,
  initialTab = "kids",
}: Props) {
  const { scheme } = useChoreyTheme();
  const [tab, setTab] = useState<ParentTab>(initialTab);
  const [accountOpen, setAccountOpen] = useState(false);

  // The same identity affordance rides the top-right of every tab's header.
  const headerRight = account ? (
    <AccountAvatarButton account={account} onPress={() => setAccountOpen(true)} />
  ) : undefined;

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
          shareStats={shareStats}
          headerRight={headerRight}
        />
      ) : tab === "chores" ? (
        <ParentChoresScreen
          currency={currency}
          split={split}
          kids={kids}
          chores={chores}
          board={choreBoard}
          assignees={assignees}
          recurringLocked={recurringLocked}
          onAddChore={onAddChore}
          onApproveChore={onApproveChore}
          onSendBackChore={onSendBackChore}
          onDeleteChore={onDeleteChore}
          headerRight={headerRight}
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
          headerRight={headerRight}
        />
      ) : (
        <ParentSettingsScreen
          currency={currency}
          split={split}
          kids={kids}
          accessCodes={accessCodes}
          subscriptionLabel={subscriptionLabel}
          onManageSubscription={onManageSubscription}
          onChangeBudget={onChangeBudget}
          onChangeCadence={onChangeCadence}
          onChangeSplit={onChangeSplit}
          onLogOut={onLogOut}
          headerRight={headerRight}
        />
      )}

      <ParentTabBar active={tab} onChange={setTab} reviewCount={reviewCount} />

      {account ? (
        <ParentAccountSheet
          visible={accountOpen}
          account={account}
          subscriptionLabel={subscriptionLabel}
          onEditName={onEditName}
          onManageSubscription={() => {
            setAccountOpen(false);
            onManageSubscription?.();
          }}
          onManageStoreSubscription={
            onManageStoreSubscription
              ? () => {
                  setAccountOpen(false);
                  onManageStoreSubscription();
                }
              : undefined
          }
          onSubmitContact={onSubmitContact}
          onSubmitFeedback={onSubmitFeedback}
          onDeleteAccount={onDeleteAccount}
          onSignOut={() => {
            setAccountOpen(false);
            onLogOut?.();
          }}
          onClose={() => setAccountOpen(false)}
        />
      ) : null}
    </View>
  );
}
