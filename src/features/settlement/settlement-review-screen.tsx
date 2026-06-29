import { Pressable, ScrollView, Text, View } from "react-native";

import { CheckCircleIcon } from "@/components/status-icons";
import { ToyButton, ToyCard } from "@/components/toybox";
import { BucketBalances, formatReward } from "@/features/chores/money";
import type { SettlementPeriod } from "@/features/settlement/settlement-actions";
import { buckets as bucketTokens, choreyTheme } from "@/theme/chorey-theme";
import { useChoreyTheme } from "@/theme/use-chorey-theme";

type Props = {
  bucketBalances: BucketBalances;
  onBack?: () => void;
  onMarkAllSettled?: (periodId: string) => void;
  settlementPeriod: SettlementPeriod;
};

const settlementRows = [
  {
    bucket: "spend",
    label: "Spend paid to child",
  },
  {
    bucket: "savings",
    label: "Savings set aside",
  },
  {
    bucket: "giving",
    label: "Giving — handed over in real life",
  },
] as const;

export function SettlementReviewScreen({
  bucketBalances,
  onBack,
  onMarkAllSettled,
  settlementPeriod,
}: Props) {
  const { scheme, typography, toybox, isDark, bucketInk } = useChoreyTheme();
  const total =
    bucketBalances.spendCents +
    bucketBalances.savingsCents +
    bucketBalances.givingCents;
  const allSettled = Object.values(settlementPeriod.bucketStatuses).every(
    (status) => status === "settled",
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        padding: choreyTheme.spacing.xl,
        paddingBottom: choreyTheme.spacing.xxl,
        gap: choreyTheme.spacing.lg,
      }}
      style={{ flex: 1, backgroundColor: scheme.bgPage }}
    >
      <View style={{ gap: choreyTheme.spacing.sm }}>
        <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>
          Settlement
        </Text>
        <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 32 }]}>
          Review settlement.
        </Text>
        <Text style={[typography.text.label, { color: scheme.fgMuted }]}>
          {settlementPeriod.frequency === "weekly" ? "Weekly" : "Monthly"}{" "}
          period
        </Text>
        <Text style={[typography.text.caption, { color: scheme.fgFaint }]}>
          {settlementPeriod.startsOn} to {settlementPeriod.endsOn}
        </Text>
      </View>

      <ToyCard style={{ gap: choreyTheme.spacing.lg }}>
        <Text
          style={[typography.text.money, { color: scheme.fg, fontSize: 26 }]}
        >
          {formatReward(total)} total
        </Text>

        {settlementRows.map((row) => {
          const amount =
            row.bucket === "spend"
              ? bucketBalances.spendCents
              : row.bucket === "savings"
                ? bucketBalances.savingsCents
                : bucketBalances.givingCents;
          const ramp = bucketTokens[row.bucket].ramp;

          return (
            <View
              key={row.bucket}
              style={{
                backgroundColor: isDark ? ramp.tintDark : ramp[200],
                borderColor: scheme.toy.border,
                borderRadius: 14,
                borderWidth: toybox.borderWidth,
                flexDirection: "row",
                gap: 10,
                justifyContent: "space-between",
                padding: choreyTheme.spacing.md,
                ...scheme.toy.shadowSm,
              }}
            >
              <Text
                style={[
                  typography.text.label,
                  {
                    color: scheme.fg,
                    flex: 1,
                    fontSize: 14,
                  },
                ]}
              >
                {row.label}
              </Text>
              <Text
                style={[
                  typography.text.money,
                  { color: bucketInk(row.bucket), fontSize: 15 },
                ]}
              >
                {formatReward(amount)}
              </Text>
            </View>
          );
        })}
      </ToyCard>

      {allSettled ? (
        <ToyCard
          style={{
            alignItems: "center",
            flexDirection: "row",
            gap: choreyTheme.spacing.sm,
          }}
        >
          <CheckCircleIcon />
          <Text
            style={[
              typography.text.label,
              { color: scheme.fgMuted, fontSize: 16 },
            ]}
          >
            All settled
          </Text>
        </ToyCard>
      ) : (
        <ToyButton
          accessibilityLabel="Mark all settled"
          onPress={() => onMarkAllSettled?.(settlementPeriod.id)}
        >
          Mark all settled
        </ToyButton>
      )}

      {onBack ? (
        <Pressable
          accessibilityLabel="Back to dashboard"
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => ({
            alignItems: "center",
            backgroundColor: pressed ? scheme.bgSunken : scheme.bgModal,
            borderColor: scheme.toy.border,
            borderRadius: choreyTheme.radii.pill,
            borderWidth: toybox.borderWidth,
            paddingVertical: 14,
            ...(pressed
              ? { transform: [{ translateY: toybox.offset }] }
              : scheme.toy.shadow),
          })}
        >
          <Text
            style={[typography.text.label, { color: scheme.fg, fontSize: 15 }]}
          >
            Back
          </Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
