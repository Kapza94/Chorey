import { Pressable, Text, View } from "react-native";
import { ChevronRight, Sparkles } from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { buckets as bucketTokens } from "@/theme/chorey-theme";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  formatMoneyDelta,
  type CurrencyCode,
} from "@/features/money/currency";
import type { ParentKid } from "@/features/parent-app/parent-primitives";

export function KidCard({
  kid,
  currency = DEFAULT_CURRENCY,
  onTap,
}: {
  kid: ParentKid;
  currency?: CurrencyCode;
  onTap?: () => void;
}) {
  const { scheme, typography, palette, radius } = useChoreyTheme();
  const allowance = bucketTokens.spend.ramp;
  const savings = bucketTokens.savings.ramp;
  const giving = bucketTokens.giving.ramp;
  const tone = bucketTokens[kid.tone === "allowance" ? "spend" : kid.tone].ramp;

  const cadenceWord = kid.cadence === "monthly" ? "month" : "week";
  const cadenceAdj = kid.cadence === "monthly" ? "monthly" : "weekly";
  const budgetPct =
    kid.budgetCents > 0
      ? Math.min(100, Math.round((kid.earnedCents / kid.budgetCents) * 100))
      : 0;
  const over = kid.assignedCents > kid.budgetCents;
  const extraCents = kid.assignedCents - kid.budgetCents;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${kid.name} details`}
      onPress={onTap}
      style={{
        backgroundColor: scheme.bgRaised,
        borderColor: scheme.border,
        borderWidth: 1,
        borderRadius: 18,
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 16,
        gap: 14,
        ...scheme.shadow.xs,
      }}
    >
      {/* Identity row */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.pill,
            backgroundColor: tone[200],
            borderColor: scheme.border,
            borderWidth: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: typography.family.display.semibold,
              fontSize: 22,
              color: tone[800],
            }}
          >
            {kid.name.trim().charAt(0).toUpperCase() || "?"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.text.h3, { color: scheme.fg, fontSize: 16 }]}>
            {kid.name}
          </Text>
          <Text style={[typography.text.caption, { color: scheme.fgFaint }]}>
            {typeof kid.age === "number" ? `${kid.age} years · ` : ""}
            {kid.choresDone} of {kid.choresTotal} chores done
          </Text>
        </View>
        <ChevronRight size={18} color={scheme.fgFaint} strokeWidth={2} />
      </View>

      {/* Earned this period */}
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
        <Text
          style={[
            typography.text.h1,
            { color: scheme.fg, fontSize: 32, fontVariant: ["tabular-nums"] },
          ]}
        >
          {formatMoney(kid.earnedCents, currency)}
        </Text>
        <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>
          this {cadenceWord}
        </Text>
      </View>

      {/* Budget cap meter */}
      <View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <Text style={[typography.text.caption, { color: scheme.fgMuted }]}>
            <Text style={{ color: scheme.fg, fontWeight: "700" }}>
              {formatMoney(kid.earnedCents, currency)}
            </Text>{" "}
            of {formatMoney(kid.budgetCents, currency)} {cadenceAdj} budget
          </Text>
          {over ? (
            <Text
              style={[
                typography.text.caption,
                { color: palette.semantic.warning[600], fontWeight: "700" },
              ]}
            >
              {formatMoneyDelta(extraCents, currency)} extra
            </Text>
          ) : null}
        </View>
        <View
          style={{
            height: 6,
            backgroundColor: scheme.bgSunken,
            borderRadius: radius.pill,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${budgetPct}%`,
              height: "100%",
              borderRadius: radius.pill,
              backgroundColor: budgetPct >= 100 ? giving[400] : allowance[400],
            }}
          />
        </View>
      </View>

      {/* 40/40/20 meter */}
      <View>
        <View style={{ flexDirection: "row", height: 8, borderRadius: radius.pill, overflow: "hidden", gap: 2 }}>
          <View style={{ flex: 40, backgroundColor: allowance[400] }} />
          <View style={{ flex: 40, backgroundColor: savings[400] }} />
          <View style={{ flex: 20, backgroundColor: giving[400] }} />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
          <Text style={[typography.text.caption, { color: scheme.fgMuted }]}>
            <Text style={{ color: allowance[800], fontWeight: "700" }}>
              {formatMoney(kid.allowanceCents, currency)}
            </Text>{" "}
            spend
          </Text>
          <Text style={[typography.text.caption, { color: scheme.fgMuted }]}>
            <Text style={{ color: savings[800], fontWeight: "700" }}>
              {formatMoney(kid.savingsCents, currency)}
            </Text>{" "}
            save
          </Text>
          <Text style={[typography.text.caption, { color: scheme.fgMuted }]}>
            <Text style={{ color: giving[800], fontWeight: "700" }}>
              {formatMoney(kid.givingCents, currency)}
            </Text>{" "}
            give
          </Text>
        </View>
      </View>

      {kid.pendingApprovals > 0 ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: scheme.tint.warning,
            borderRadius: radius.sm,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Sparkles size={14} color={palette.semantic.warning[600]} strokeWidth={2.4} />
          <Text
            style={[
              typography.text.label,
              { color: palette.semantic.warning[600] },
            ]}
          >
            {kid.pendingApprovals} {kid.pendingApprovals === 1 ? "chore" : "chores"} need
            your OK
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
