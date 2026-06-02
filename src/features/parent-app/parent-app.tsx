import { useState } from "react";
import { Text, View } from "react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { ParentKidsScreen } from "@/features/parent-app/parent-kids-screen";
import {
  ParentTabBar,
  type ParentKid,
  type ParentTab,
} from "@/features/parent-app/parent-primitives";
import type { CurrencyCode } from "@/features/money/currency";

type Props = {
  subtitle?: string;
  currency?: CurrencyCode;
  kids?: ParentKid[];
  onSelectKid?: (id: string) => void;
  onAddKid?: () => void;
  onReviewApprovals?: () => void;
  initialTab?: ParentTab;
};

/**
 * The parent app shell — hosts the Kids / Chores / Pay / Settings tabs and the
 * shared bottom bar. Kids is built; the other tabs land in following phases.
 */
export function ParentApp({
  subtitle,
  currency,
  kids,
  onSelectKid,
  onAddKid,
  onReviewApprovals,
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
