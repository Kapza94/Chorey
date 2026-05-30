import { Pressable, ScrollView, Text, View } from "react-native";

import { CheckCircleIcon } from "@/components/status-icons";
import type { ChildChore } from "@/features/chores/child-chore-actions";
import type { ChoreStatus } from "@/features/chores/chore-actions";
import { BucketBalances, formatReward } from "@/features/chores/money";
import { choreyTheme } from "@/theme/chorey-theme";

type Props = {
  bucketBalances?: BucketBalances;
  childName?: string;
  chores?: ChildChore[];
  onBack?: () => void;
  onSubmitChore?: (choreId: string) => void;
  submittingChoreId?: string | null;
};

function getStatusLabel(status: ChoreStatus) {
  if (status === "assigned") {
    return "Ready to do";
  }

  if (status === "approved") {
    return "Approved";
  }

  if (status === "sent_back") {
    return "Try again";
  }

  return "Done";
}

function getCompletionLabel(status: ChoreStatus) {
  if (status === "approved") {
    return "Approved by parent";
  }

  if (status === "sent_back") {
    return "Parent sent it back";
  }

  return "Waiting for parent";
}

export function ChildDashboardScreen({
  bucketBalances = {
    givingCents: 0,
    savingsCents: 0,
    spendCents: 0,
  },
  childName = "there",
  chores = [],
  onBack,
  onSubmitChore,
  submittingChoreId,
}: Props) {
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
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        onPress={onBack}
        style={{
          alignItems: "center",
          alignSelf: "flex-start",
          borderColor: choreyTheme.colors.borderSoft,
          borderRadius: choreyTheme.radii.pill,
          borderWidth: 1,
          height: 44,
          justifyContent: "center",
          width: 44,
        }}
      >
        <Text
          style={{
            color: choreyTheme.colors.ink1,
            fontSize: 24,
            fontWeight: "700",
            lineHeight: 26,
          }}
        >
          {"<"}
        </Text>
      </Pressable>

      <View style={{ gap: choreyTheme.spacing.sm }}>
        <Text
          selectable
          style={{
            color: choreyTheme.colors.inkMuted,
            fontSize: 13,
            fontWeight: "800",
          }}
        >
          Child dashboard
        </Text>
        <Text
          selectable
          style={{
            color: choreyTheme.colors.ink1,
            fontSize: 34,
            fontWeight: "800",
            letterSpacing: 0,
          }}
        >
          Hi {childName}
        </Text>
        <Text
          selectable
          style={{
            color: choreyTheme.colors.inkMuted,
            fontSize: 16,
            lineHeight: 24,
          }}
        >
          Your chores will appear here. Every approved reward follows the 40 /
          40 / 20 split.
        </Text>
      </View>

      <View style={{ gap: choreyTheme.spacing.md }}>
        {(["spend", "savings", "giving"] as const).map((bucket) => {
          const bucketTheme = choreyTheme.buckets[bucket];
          const balance =
            bucket === "spend"
              ? bucketBalances.spendCents
              : bucket === "savings"
                ? bucketBalances.savingsCents
                : bucketBalances.givingCents;

          return (
            <View
              key={bucket}
              style={{
                backgroundColor: bucketTheme.softColor,
                borderColor: choreyTheme.colors.borderMedium,
                borderRadius: choreyTheme.radii.md,
                borderWidth: 1,
                flexDirection: "row",
                justifyContent: "space-between",
                padding: choreyTheme.spacing.lg,
              }}
            >
              <Text
                style={{
                  color: choreyTheme.colors.ink1,
                  fontSize: 17,
                  fontWeight: "800",
                }}
              >
                {bucketTheme.label}
              </Text>
              <Text
                style={{
                  color: choreyTheme.colors.ink1,
                  fontSize: 20,
                  fontVariant: ["tabular-nums"],
                  fontWeight: "900",
                }}
              >
                {formatReward(balance)}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={{ gap: choreyTheme.spacing.md }}>
        <Text
          style={{
            color: choreyTheme.colors.ink1,
            fontSize: 18,
            fontWeight: "900",
          }}
        >
          My chores
        </Text>

        {chores.length > 0 ? (
          chores.map((chore) => {
            const isAssigned = chore.status === "assigned";
            const isSubmitting = submittingChoreId === chore.id;

            return (
              <View
                key={chore.id}
                style={{
                  backgroundColor: isAssigned
                    ? choreyTheme.colors.surfaceWarm
                    : choreyTheme.colors.primarySoft,
                  borderColor: isAssigned
                    ? choreyTheme.colors.spend
                    : choreyTheme.colors.primary,
                  borderRadius: choreyTheme.radii.lg,
                  borderWidth: 1,
                  gap: choreyTheme.spacing.md,
                  padding: choreyTheme.spacing.lg,
                  ...choreyTheme.shadows.card,
                }}
              >
                <View
                  style={{
                    alignItems: "flex-start",
                    flexDirection: "row",
                    gap: choreyTheme.spacing.md,
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flex: 1, gap: choreyTheme.spacing.sm }}>
                    <View
                      style={{
                        alignSelf: "flex-start",
                        backgroundColor: isAssigned
                          ? choreyTheme.colors.spendSoft
                          : choreyTheme.colors.surface,
                        borderColor: isAssigned
                          ? choreyTheme.colors.spend
                          : choreyTheme.colors.primary,
                        borderRadius: choreyTheme.radii.pill,
                        borderWidth: 1,
                        paddingHorizontal: choreyTheme.spacing.md,
                        paddingVertical: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: choreyTheme.colors.ink1,
                          fontSize: 12,
                          fontWeight: "900",
                        }}
                      >
                        {getStatusLabel(chore.status)}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: choreyTheme.colors.ink1,
                        fontSize: 20,
                        fontWeight: "900",
                        lineHeight: 25,
                      }}
                    >
                      {chore.title}
                    </Text>
                  </View>
                  <View
                    style={{
                      alignItems: "center",
                      backgroundColor: choreyTheme.colors.surface,
                      borderColor: choreyTheme.colors.borderSoft,
                      borderRadius: choreyTheme.radii.md,
                      borderWidth: 1,
                      minWidth: 72,
                      paddingHorizontal: choreyTheme.spacing.md,
                      paddingVertical: choreyTheme.spacing.sm,
                    }}
                  >
                    <Text
                      style={{
                        color: choreyTheme.colors.inkMuted,
                        fontSize: 11,
                        fontWeight: "800",
                      }}
                    >
                      Reward
                    </Text>
                    <Text
                      style={{
                        color: choreyTheme.colors.ink1,
                        fontSize: 17,
                        fontVariant: ["tabular-nums"],
                        fontWeight: "900",
                      }}
                    >
                      {formatReward(chore.rewardCents)}
                    </Text>
                  </View>
                </View>

                {isAssigned ? (
                  <Pressable
                    accessibilityLabel={`Submit ${chore.title}`}
                    accessibilityRole="button"
                    disabled={isSubmitting}
                    onPress={() => onSubmitChore?.(chore.id)}
                    style={({ pressed }) => ({
                      alignItems: "center",
                      backgroundColor: pressed
                        ? choreyTheme.colors.primaryPressed
                        : choreyTheme.colors.primary,
                      borderColor: choreyTheme.colors.primaryPressed,
                      borderRadius: choreyTheme.radii.pill,
                      borderWidth: 1,
                      opacity: isSubmitting ? 0.65 : 1,
                      paddingVertical: 14,
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
                      {isSubmitting ? "Sending..." : "Mark done"}
                    </Text>
                  </Pressable>
                ) : (
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
                        fontSize: 15,
                        fontWeight: "900",
                      }}
                    >
                      {getCompletionLabel(chore.status)}
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <Text
            style={{
              color: choreyTheme.colors.inkMuted,
              fontSize: 15,
              lineHeight: 22,
            }}
          >
            No chores yet.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
