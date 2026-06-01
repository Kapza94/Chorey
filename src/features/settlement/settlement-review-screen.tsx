import { Pressable, ScrollView, Text, View } from "react-native";

import { CheckCircleIcon } from "@/components/status-icons";
import { BucketBalances, formatReward } from "@/features/chores/money";
import type { SettlementPeriod } from "@/features/settlement/settlement-actions";
import { choreyTheme } from "@/theme/chorey-theme";

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
    label: "Giving donated or reserved",
  },
] as const;

export function SettlementReviewScreen({
  bucketBalances,
  onBack,
  onMarkAllSettled,
  settlementPeriod,
}: Props) {
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
        gap: choreyTheme.spacing.xl,
      }}
      style={{ flex: 1, backgroundColor: choreyTheme.colors.cream2 }}
    >
      <View style={{ gap: choreyTheme.spacing.sm }}>
        <Text
          style={{
            color: choreyTheme.colors.inkMuted,
            fontSize: 13,
            fontWeight: "800",
          }}
        >
          Settlement
        </Text>
        <Text
          style={{
            color: choreyTheme.colors.ink1,
            fontSize: 34,
            fontWeight: "800",
            letterSpacing: 0,
          }}
        >
          Review settlement
        </Text>
        <Text
          style={{
            color: choreyTheme.colors.inkMuted,
            fontSize: 14,
            fontWeight: "800",
          }}
        >
          {settlementPeriod.frequency === "weekly" ? "Weekly" : "Monthly"} period
        </Text>
        <Text
          style={{
            color: choreyTheme.colors.inkMuted,
            fontSize: 15,
          }}
        >
          {settlementPeriod.startsOn} to {settlementPeriod.endsOn}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: choreyTheme.colors.surface,
          borderColor: choreyTheme.colors.borderSoft,
          borderRadius: choreyTheme.radii.lg,
          borderWidth: 1,
          gap: choreyTheme.spacing.lg,
          padding: choreyTheme.spacing.lg,
          ...choreyTheme.shadows.card,
        }}
      >
        <Text
          style={{
            color: choreyTheme.colors.ink1,
            fontSize: 26,
            fontVariant: ["tabular-nums"],
            fontWeight: "900",
          }}
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
          const bucketTheme = choreyTheme.buckets[row.bucket];

          return (
            <View
              key={row.bucket}
              style={{
                backgroundColor: bucketTheme.softColor,
                borderColor: choreyTheme.colors.borderMedium,
                borderRadius: choreyTheme.radii.md,
                borderWidth: 1,
                flexDirection: "row",
                justifyContent: "space-between",
                padding: choreyTheme.spacing.md,
              }}
            >
              <Text
                style={{
                  color: choreyTheme.colors.ink1,
                  flex: 1,
                  fontSize: 15,
                  fontWeight: "800",
                }}
              >
                {row.label}
              </Text>
              <Text
                style={{
                  color: choreyTheme.colors.ink1,
                  fontSize: 16,
                  fontVariant: ["tabular-nums"],
                  fontWeight: "900",
                }}
              >
                {formatReward(amount)}
              </Text>
            </View>
          );
        })}
      </View>

      {allSettled ? (
        <View
          style={{
            alignItems: "center",
            flexDirection: "row",
            gap: choreyTheme.spacing.sm,
          }}
        >
          <CheckCircleIcon />
          <Text
            style={{
              color: choreyTheme.colors.ink2,
              fontSize: 16,
              fontWeight: "900",
            }}
          >
            All settled
          </Text>
        </View>
      ) : (
        <Pressable
          accessibilityLabel="Mark all settled"
          accessibilityRole="button"
          onPress={() => onMarkAllSettled?.(settlementPeriod.id)}
          style={({ pressed }) => ({
            alignItems: "center",
            backgroundColor: pressed
              ? choreyTheme.colors.primaryPressed
              : choreyTheme.colors.primary,
            borderColor: choreyTheme.colors.primaryPressed,
            borderRadius: choreyTheme.radii.pill,
            borderWidth: 1,
            paddingVertical: 16,
            ...choreyTheme.shadows.button,
          })}
        >
          <Text
            style={{
              color: choreyTheme.colors.cream1,
              fontSize: 16,
              fontWeight: "900",
            }}
          >
            Mark all settled
          </Text>
        </Pressable>
      )}

      {onBack ? (
        <Pressable
          accessibilityLabel="Back to dashboard"
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => ({
            alignItems: "center",
            backgroundColor: pressed
              ? choreyTheme.colors.primarySoft
              : choreyTheme.colors.surface,
            borderColor: choreyTheme.colors.borderMedium,
            borderRadius: choreyTheme.radii.pill,
            borderWidth: 1,
            paddingVertical: 14,
          })}
        >
          <Text
            style={{
              color: choreyTheme.colors.ink1,
              fontSize: 15,
              fontWeight: "800",
            }}
          >
            Back
          </Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
