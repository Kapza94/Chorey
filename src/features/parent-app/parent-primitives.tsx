import { Pressable, Text, View } from "react-native";
import { Home, Plus, Settings2, User, Wallet } from "lucide-react-native";

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
  /** lifetime game level (1..100), derived from approved chores */
  level?: number;
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
        <Text
          style={{
            fontFamily: typography.family.display.extra,
            fontSize: 32,
            letterSpacing: -0.8,
            color: scheme.fg,
            marginTop: 2,
          }}
        >
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
  onAdd,
  badges,
}: {
  active: ParentTab;
  onChange?: (tab: ParentTab) => void;
  /** Center dock action — the raised "+" that opens the New Chore sheet.
   *  Hidden when omitted (e.g. tests that don't wire adding). */
  onAdd?: () => void;
  /** per-tab count of things waiting for review — badges that tab from anywhere.
   *  Chore approvals badge Chores; purchase/giving requests badge Children. */
  badges?: Partial<Record<ParentTab, number>>;
}) {
  const { scheme, typography, palette, toybox, radius, isDark } = useChoreyTheme();
  const spendRamp = palette.allowance;
  const tabs: { id: ParentTab; label: string; Icon: typeof Home }[] = [
    { id: "kids", label: "Children", Icon: User },
    { id: "chores", label: "Chores", Icon: Home },
    { id: "pay", label: "Pay", Icon: Wallet },
    { id: "settings", label: "Settings", Icon: Settings2 },
  ];

  const renderTab = (tab: (typeof tabs)[number]) => {
    const isActive = tab.id === active;
    const color = isActive ? (isDark ? spendRamp[200] : spendRamp[800]) : scheme.fgFaint;
    const tabCount = badges?.[tab.id] ?? 0;
    const badged = tabCount > 0;

    return (
      <Pressable
        key={tab.id}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={
          badged
            ? `${tab.label} tab, ${tabCount} waiting for review`
            : `${tab.label} tab`
        }
        onPress={() => onChange?.(tab.id)}
        style={{
          flex: 1,
          alignItems: "center",
          gap: 3,
          paddingVertical: 8,
          borderRadius: radius.pill,
          backgroundColor: isActive
            ? isDark
              ? spendRamp.tintDark
              : spendRamp[200]
            : "transparent",
          borderWidth: isActive ? toybox.borderWidth : 0,
          borderColor: scheme.toy.border,
        }}
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
                borderWidth: 1.5,
                borderColor: scheme.toy.border,
              }}
            >
              <Text
                style={{
                  color: palette.cream[4],
                  fontFamily: typography.family.body.bold,
                  fontSize: 10,
                }}
              >
                {tabCount > 9 ? "9+" : tabCount}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={[typography.text.caption, { color, fontWeight: "700" }]}>
          {tab.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      testID="parent-tab-bar"
      style={{
        position: "absolute",
        left: 14,
        right: 14,
        bottom: 24,
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        padding: 5,
        backgroundColor: scheme.bgModal,
        borderColor: scheme.toy.border,
        borderWidth: toybox.borderWidth,
        borderRadius: radius.pill,
        ...scheme.toy.shadow,
      }}
    >
      {renderTab(tabs[0])}
      {renderTab(tabs[1])}
      {/* Raised "+" — adding a chore is the parent's most frequent action, so
          it gets the biggest, most thumb-reachable target, bulging out of the
          dock centre. Absolute so it lifts without changing the bar height. */}
      {onAdd ? (
        <View style={{ width: 60, alignItems: "center" }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="New chore"
            onPress={onAdd}
            style={({ pressed }) => ({
              position: "absolute",
              top: -28,
              width: 58,
              height: 58,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? palette.accent[800] : palette.accent[600],
              borderWidth: toybox.borderWidth,
              borderColor: scheme.toy.border,
              ...scheme.toy.shadow,
            })}
          >
            <Plus size={28} color={palette.cream[4]} strokeWidth={2.8} />
          </Pressable>
        </View>
      ) : null}
      {renderTab(tabs[2])}
      {renderTab(tabs[3])}
    </View>
  );
}
