import { Pressable, Text, View } from "react-native";
import { Home, Settings2, User, Wallet } from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import type { SettlementFrequency } from "@/features/household/household-actions";

export type ParentTab = "kids" | "chores" | "pay" | "settings";

/** A kid as the parent app sees them — aggregates for the period. */
export type ParentKid = {
  id: string;
  name: string;
  age?: number | null;
  /** color swatch — one of the bucket tones */
  tone: "allowance" | "savings" | "giving";
  earnedCents: number;
  allowanceCents: number;
  savingsCents: number;
  givingCents: number;
  choresDone: number;
  choresTotal: number;
  pendingApprovals: number;
  cadence: SettlementFrequency;
  budgetCents: number;
  /** total value of chores assigned this period (may exceed the budget) */
  assignedCents: number;
};

export function ParentHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  const { scheme, typography } = useChoreyTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        paddingHorizontal: 22,
        paddingTop: 12,
        paddingBottom: 14,
      }}
    >
      <View style={{ flex: 1 }}>
        {subtitle ? (
          <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>
            {subtitle}
          </Text>
        ) : null}
        <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 30, marginTop: 2 }]}>
          {title}
        </Text>
      </View>
      {action}
    </View>
  );
}

export function ParentTabBar({
  active,
  onChange,
  reviewCount = 0,
}: {
  active: ParentTab;
  onChange?: (tab: ParentTab) => void;
  /** items waiting for parent review — badges the Kids tab from anywhere. */
  reviewCount?: number;
}) {
  const { scheme, typography, palette } = useChoreyTheme();
  const tabs: { id: ParentTab; label: string; Icon: typeof Home }[] = [
    { id: "kids", label: "Kids", Icon: User },
    { id: "chores", label: "Chores", Icon: Home },
    { id: "pay", label: "Pay", Icon: Wallet },
    { id: "settings", label: "Settings", Icon: Settings2 },
  ];

  return (
    <View
      testID="parent-tab-bar"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: "row",
        justifyContent: "space-around",
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 28,
        backgroundColor: scheme.bgPage,
        borderTopWidth: 1,
        borderTopColor: scheme.border,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        const color = isActive ? palette.accent[600] : scheme.fgFaint;
        const badged = tab.id === "kids" && reviewCount > 0;

        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={
              badged
                ? `${tab.label} tab, ${reviewCount} waiting for review`
                : `${tab.label} tab`
            }
            onPress={() => onChange?.(tab.id)}
            style={{ alignItems: "center", gap: 3, paddingHorizontal: 10, paddingVertical: 4 }}
          >
            <View>
              <tab.Icon size={22} color={color} strokeWidth={isActive ? 2.4 : 2} />
              {badged ? (
                <View
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -10,
                    minWidth: 17,
                    height: 17,
                    paddingHorizontal: 4,
                    borderRadius: 999,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: palette.accent[600],
                  }}
                >
                  <Text
                    style={{
                      color: palette.cream[4],
                      fontFamily: typography.family.body.bold,
                      fontSize: 10,
                    }}
                  >
                    {reviewCount > 9 ? "9+" : reviewCount}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={[typography.text.caption, { color, fontWeight: "700" }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
