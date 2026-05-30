import { Pressable, ScrollView, Text, View } from "react-native";

import { CheckCircleIcon } from "@/components/status-icons";
import { formatReward } from "@/features/chores/money";
import type { ChoreStatus } from "@/features/chores/chore-actions";
import { choreyTheme } from "@/theme/chorey-theme";

type DashboardChore = {
  id: string;
  title: string;
  rewardCents: number;
  status: ChoreStatus;
};

type Props = {
  childAccessCode?: string;
  childName?: string;
  chores?: DashboardChore[];
  onApproveChore?: (choreId: string) => void;
  onCreateChore?: () => void;
  onOpenChildAccess?: () => void;
};

function getChoreState(status: ChoreStatus, childName: string) {
  if (status === "submitted") {
    return {
      label: "Needs approval",
      detail: "Parent check needed",
      backgroundColor: choreyTheme.colors.surfaceWarm,
      borderColor: choreyTheme.colors.spend,
      pillColor: choreyTheme.colors.spendSoft,
    };
  }

  if (status === "approved") {
    return {
      label: "Approved",
      detail: "Settled into 40 / 40 / 20",
      backgroundColor: choreyTheme.colors.primarySoft,
      borderColor: choreyTheme.colors.primary,
      pillColor: choreyTheme.colors.surface,
    };
  }

  if (status === "sent_back") {
    return {
      label: "Sent back",
      detail: `${childName} can try again`,
      backgroundColor: choreyTheme.colors.surface,
      borderColor: choreyTheme.colors.danger,
      pillColor: choreyTheme.colors.surfaceWarm,
    };
  }

  return {
    label: "Waiting on child",
    detail: `Ready for ${childName} to complete`,
    backgroundColor: choreyTheme.colors.surface,
    borderColor: choreyTheme.colors.borderMedium,
    pillColor: choreyTheme.colors.primarySoft,
  };
}

export function ParentDashboardScreen({
  childAccessCode,
  childName = "Your child",
  chores = [],
  onApproveChore,
  onCreateChore,
  onOpenChildAccess,
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
      <View style={{ gap: choreyTheme.spacing.sm }}>
        <Text
          selectable
          style={{
            color: choreyTheme.colors.inkMuted,
            fontSize: 13,
            fontWeight: "800",
          }}
        >
          Parent dashboard
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
          {childName} is ready for chores.
        </Text>
        <Text
          selectable
          style={{
            color: choreyTheme.colors.inkMuted,
            fontSize: 16,
            lineHeight: 24,
          }}
        >
          Next you will create chores, approve completed work, and watch each
          reward split into the 40 / 40 / 20 buckets.
        </Text>
      </View>

      <Pressable
        accessibilityLabel="Create chore"
        accessibilityRole="button"
        onPress={onCreateChore}
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
            fontWeight: "800",
          }}
        >
          Create chore
        </Text>
      </Pressable>

      {childAccessCode ? (
        <View
          style={{
            backgroundColor: choreyTheme.colors.surfaceWarm,
            borderColor: choreyTheme.colors.borderMedium,
            borderRadius: choreyTheme.radii.lg,
            borderWidth: 1,
            gap: choreyTheme.spacing.sm,
            padding: choreyTheme.spacing.lg,
            ...choreyTheme.shadows.card,
          }}
        >
          <Text
            style={{
              color: choreyTheme.colors.inkMuted,
              fontSize: 13,
              fontWeight: "800",
            }}
          >
            Child access code
          </Text>
          <Text
            selectable
            style={{
              color: choreyTheme.colors.ink1,
              fontSize: 30,
              fontVariant: ["tabular-nums"],
              fontWeight: "900",
              letterSpacing: 0,
            }}
          >
            {childAccessCode}
          </Text>
          <Pressable
            accessibilityLabel="Test child access"
            accessibilityRole="button"
            onPress={onOpenChildAccess}
            style={({ pressed }) => ({
              alignItems: "center",
              backgroundColor: pressed
                ? choreyTheme.colors.primarySoft
                : choreyTheme.colors.surface,
              borderColor: choreyTheme.colors.borderMedium,
              borderRadius: choreyTheme.radii.pill,
              borderWidth: 1,
              paddingVertical: 13,
            })}
          >
            <Text
              style={{
                color: choreyTheme.colors.ink1,
                fontSize: 15,
                fontWeight: "800",
              }}
            >
              Test child access
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={{ gap: choreyTheme.spacing.md }}>
        {(["spend", "savings", "giving"] as const).map((bucket) => {
          const bucketTheme = choreyTheme.buckets[bucket];

          return (
            <View
              key={bucket}
              style={{
                backgroundColor: bucketTheme.softColor,
                borderColor: choreyTheme.colors.borderMedium,
                borderRadius: choreyTheme.radii.lg,
                borderWidth: 1,
                flexDirection: "row",
                justifyContent: "space-between",
                padding: choreyTheme.spacing.lg,
                ...choreyTheme.shadows.card,
              }}
            >
              <View style={{ gap: choreyTheme.spacing.xs }}>
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
                    color: choreyTheme.colors.inkMuted,
                    fontSize: 14,
                  }}
                >
                  Virtual balance 0.00
                </Text>
              </View>
              <Text
                style={{
                  color: choreyTheme.colors.ink1,
                  fontSize: 20,
                  fontWeight: "900",
                }}
              >
                {bucketTheme.percent}%
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
          Chores
        </Text>

        {chores.length > 0 ? (
          chores.map((chore) => {
            const choreState = getChoreState(chore.status, childName);

            return (
              <View
                key={chore.id}
                style={{
                  backgroundColor: choreState.backgroundColor,
                  borderColor: choreState.borderColor,
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
                        backgroundColor: choreState.pillColor,
                        borderColor: choreState.borderColor,
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
                        {choreState.label}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: choreyTheme.colors.ink1,
                        fontSize: 19,
                        fontWeight: "900",
                        lineHeight: 24,
                      }}
                    >
                      {chore.title}
                    </Text>
                    <Text
                      style={{
                        color: choreyTheme.colors.inkMuted,
                        fontSize: 14,
                        fontWeight: "800",
                      }}
                    >
                      {choreState.detail}
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
                {chore.status === "submitted" ? (
                  <Pressable
                    accessibilityLabel={`Approve ${chore.title}`}
                    accessibilityRole="button"
                    onPress={() => onApproveChore?.(chore.id)}
                    style={({ pressed }) => ({
                      alignItems: "center",
                      backgroundColor: pressed
                        ? choreyTheme.colors.primaryPressed
                        : choreyTheme.colors.primary,
                      borderColor: choreyTheme.colors.primaryPressed,
                      borderRadius: choreyTheme.radii.pill,
                      borderWidth: 1,
                      paddingVertical: 13,
                      ...choreyTheme.shadows.button,
                    })}
                  >
                    <Text
                      style={{
                        color: choreyTheme.colors.cream1,
                        fontSize: 15,
                        fontWeight: "900",
                      }}
                    >
                      Approve
                    </Text>
                  </Pressable>
                ) : null}
                {chore.status === "approved" ? (
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
                        fontSize: 14,
                        fontWeight: "900",
                      }}
                    >
                      Ready for settlement
                    </Text>
                  </View>
                ) : null}
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
