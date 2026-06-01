import { Pressable, ScrollView, Text, View } from "react-native";

import type { CreatedChore, ChoreStatus } from "@/features/chores/chore-actions";
import { formatReward } from "@/features/chores/money";
import { ParentTabBar } from "@/features/parent-navigation/parent-tab-bar";
import { choreyTheme } from "@/theme/chorey-theme";

type Props = {
  childName?: string;
  chores?: CreatedChore[];
  onCreateChore?: () => void;
  onOpenChildren?: () => void;
  onOpenDashboard?: () => void;
  onOpenSettings?: () => void;
};

function getChoreState(status: ChoreStatus, childName: string) {
  if (status === "submitted") {
    return "Needs approval";
  }

  if (status === "approved") {
    return "Approved";
  }

  if (status === "sent_back") {
    return `${childName} can try again`;
  }

  return "Waiting on child";
}

export function ParentChoresScreen({
  childName = "Your child",
  chores = [],
  onCreateChore,
  onOpenChildren,
  onOpenDashboard,
  onOpenSettings,
}: Props) {
  return (
    <View style={{ flex: 1, backgroundColor: choreyTheme.colors.cream2 }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          gap: choreyTheme.spacing.xl,
          padding: choreyTheme.spacing.xl,
          paddingBottom: choreyTheme.spacing.xxl,
        }}
        style={{ flex: 1 }}
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
            Chores
          </Text>
          <Text
            selectable
            style={{
              color: choreyTheme.colors.inkMuted,
              fontSize: 16,
              lineHeight: 24,
            }}
          >
            Review chore work, add new chores, and keep the household routine
            moving.
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

        <View style={{ gap: choreyTheme.spacing.md }}>
          {chores.length > 0 ? (
            chores.map((chore) => (
              <View
                key={chore.id}
                style={{
                  backgroundColor: choreyTheme.colors.surface,
                  borderColor: choreyTheme.colors.borderSoft,
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
                    fontSize: 12,
                    fontWeight: "900",
                  }}
                >
                  {getChoreState(chore.status, childName)}
                </Text>
                <View
                  style={{
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    gap: choreyTheme.spacing.md,
                  }}
                >
                  <Text
                    style={{
                      color: choreyTheme.colors.ink1,
                      flex: 1,
                      fontSize: 19,
                      fontWeight: "900",
                      lineHeight: 24,
                    }}
                  >
                    {chore.title}
                  </Text>
                  <Text
                    style={{
                      color: choreyTheme.colors.ink1,
                      fontSize: 18,
                      fontVariant: ["tabular-nums"],
                      fontWeight: "900",
                    }}
                  >
                    {formatReward(chore.rewardCents)}
                  </Text>
                </View>
              </View>
            ))
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

      <View
        testID="parent-bottom-nav"
        style={{
          backgroundColor: choreyTheme.colors.cream1,
          borderTopWidth: 0,
          paddingBottom: choreyTheme.spacing.xl,
          paddingHorizontal: choreyTheme.spacing.lg,
          paddingTop: choreyTheme.spacing.sm,
        }}
      >
        <ParentTabBar
          currentTab="chores"
          onOpenChildren={onOpenChildren}
          onOpenDashboard={onOpenDashboard}
          onOpenSettings={onOpenSettings}
        />
      </View>
    </View>
  );
}
