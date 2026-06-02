import { useState } from "react";
import { Text, View } from "react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { ParentKidsScreen } from "@/features/parent-app/parent-kids-screen";
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
import {
  ParentTabBar,
  type ParentKid,
  type ParentTab,
} from "@/features/parent-app/parent-primitives";
import type { CurrencyCode } from "@/features/money/currency";
import type { PayoutMethod } from "@/features/payments/payment-actions";
import type { Split } from "@/features/money/split";

type Props = {
  subtitle?: string;
  currency?: CurrencyCode;
  split?: Split;
  kids?: ParentKid[];
  onSelectKid?: (id: string) => void;
  onAddKid?: () => void;
  onReviewApprovals?: () => void;
  // Payments
  due?: DuePayout[];
  payoutHistory?: PayoutHistoryRow[];
  paidThisMonthCents?: number;
  onMarkPaid?: (kidId: string, amountCents: number, method: PayoutMethod) => void;
  // Chores
  chores?: ChoreLibraryItem[];
  assignees?: ChoreAssignee[];
  onAddChore?: (input: { name: string; rewardCents: number; assigneeId: string }) => void;
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
  onSelectKid,
  onAddKid,
  onReviewApprovals,
  due,
  payoutHistory,
  paidThisMonthCents,
  onMarkPaid,
  chores,
  assignees,
  onAddChore,
  initialTab = "kids",
}: Props) {
  const { scheme } = useChoreyTheme();
  const [tab, setTab] = useState<ParentTab>(initialTab);

  return (
    <View style={{ flex: 1, backgroundColor: scheme.bgPage }}>
      {tab === "kids" ? (
        <ParentKidsScreen
          subtitle={subtitle}
          currency={currency}
          kids={kids}
          onSelectKid={onSelectKid}
          onAddKid={onAddKid}
          onReviewApprovals={onReviewApprovals}
        />
      ) : tab === "chores" ? (
        <ParentChoresScreen
          currency={currency}
          split={split}
          kids={kids}
          chores={chores}
          assignees={assignees}
          onAddChore={onAddChore}
        />
      ) : tab === "pay" ? (
        <ParentPaymentsScreen
          currency={currency}
          due={due}
          history={payoutHistory}
          thisMonthCents={paidThisMonthCents}
          onMarkPaid={onMarkPaid}
        />
      ) : (
        <ComingSoon tab={tab} />
      )}

      <ParentTabBar active={tab} onChange={setTab} />
    </View>
  );
}

function ComingSoon({ tab }: { tab: ParentTab }) {
  const { scheme, typography } = useChoreyTheme();

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Text style={[typography.text.h3, { color: scheme.fgFaint, textTransform: "capitalize" }]}>
        {tab}
      </Text>
    </View>
  );
}
