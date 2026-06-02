import { Pressable, ScrollView, Text, View } from "react-native";
import { ChevronRight, Plus, Sparkles } from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { buckets as bucketTokens } from "@/theme/chorey-theme";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  type CurrencyCode,
} from "@/features/money/currency";
import { KidCard } from "@/features/parent-app/kid-card";
import { ParentHeader, type ParentKid } from "@/features/parent-app/parent-primitives";

type Props = {
  subtitle?: string;
  currency?: CurrencyCode;
  kids?: ParentKid[];
  onSelectKid?: (id: string) => void;
  onAddKid?: () => void;
  onReviewApprovals?: () => void;
};

export function ParentKidsScreen({
  subtitle,
  currency = DEFAULT_CURRENCY,
  kids = [],
  onSelectKid,
  onAddKid,
  onReviewApprovals,
}: Props) {
  const { scheme, typography, palette, radius } = useChoreyTheme();
  const allowance = bucketTokens.spend.ramp;
  const savings = bucketTokens.savings.ramp;
  const giving = bucketTokens.giving.ramp;

  const totalPending = kids.reduce((sum, kid) => sum + kid.pendingApprovals, 0);
  const sum = (pick: (kid: ParentKid) => number) =>
    kids.reduce((total, kid) => total + pick(kid), 0);

  return (
    <View style={{ flex: 1, backgroundColor: scheme.bgPage }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} style={{ flex: 1 }}>
        <ParentHeader
          subtitle={subtitle}
          title="Kids."
          action={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add kid"
              onPress={onAddKid}
              style={{
                width: 36,
                height: 36,
                borderRadius: radius.pill,
                backgroundColor: scheme.bgRaised,
                alignItems: "center",
                justifyContent: "center",
                ...scheme.shadow.xs,
              }}
            >
              <Plus size={18} color={scheme.fg} strokeWidth={2.2} />
            </Pressable>
          }
        />

        {totalPending > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Review approvals"
            onPress={onReviewApprovals}
            style={{
              marginHorizontal: 18,
              marginBottom: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              backgroundColor: scheme.tint.warning,
              borderRadius: radius.md,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Sparkles size={20} color={palette.semantic.warning[600]} strokeWidth={2.2} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.text.h3, { color: scheme.fg, fontSize: 13 }]}>
                {totalPending} {totalPending === 1 ? "chore" : "chores"} need your approval
              </Text>
              <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 1 }]}>
                Tap a kid to review.
              </Text>
            </View>
            <ChevronRight size={16} color={palette.semantic.warning[600]} strokeWidth={2} />
          </Pressable>
        ) : null}

        <View style={{ gap: 12, paddingHorizontal: 18 }}>
          {kids.map((kid) => (
            <KidCard
              key={kid.id}
              kid={kid}
              currency={currency}
              onTap={() => onSelectKid?.(kid.id)}
            />
          ))}
        </View>

        {/* Household total */}
        <Text
          style={[
            typography.text.overline,
            { color: scheme.fgFaint, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 8 },
          ]}
        >
          This week, all kids
        </Text>
        <View
          style={{
            marginHorizontal: 18,
            paddingHorizontal: 18,
            paddingVertical: 16,
            backgroundColor: scheme.bgRaised,
            borderColor: scheme.border,
            borderWidth: 1,
            borderRadius: 16,
          }}
        >
          <Text
            style={[
              typography.text.h1,
              { color: scheme.fg, fontSize: 36, fontVariant: ["tabular-nums"] },
            ]}
          >
            {formatMoney(sum((kid) => kid.earnedCents), currency)}
          </Text>
          <View style={{ flexDirection: "row", gap: 18, marginTop: 14 }}>
            <TotalCell label="To spend" cents={sum((k) => k.allowanceCents)} color={allowance[800]} currency={currency} />
            <TotalCell label="To save" cents={sum((k) => k.savingsCents)} color={savings[800]} currency={currency} />
            <TotalCell label="To give" cents={sum((k) => k.givingCents)} color={giving[800]} currency={currency} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function TotalCell({
  label,
  cents,
  color,
  currency,
}: {
  label: string;
  cents: number;
  color: string;
  currency: CurrencyCode;
}) {
  const { typography, scheme } = useChoreyTheme();

  return (
    <View>
      <Text style={[typography.text.overline, { color: scheme.fgFaint, fontSize: 10 }]}>
        {label}
      </Text>
      <Text style={[typography.text.money, { color, fontSize: 15, marginTop: 2 }]}>
        {formatMoney(cents, currency)}
      </Text>
    </View>
  );
}
