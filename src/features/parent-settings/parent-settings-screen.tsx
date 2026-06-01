import { Pressable, ScrollView, Text, View } from "react-native";

import { ParentTabBar } from "@/features/parent-navigation/parent-tab-bar";
import { choreyTheme } from "@/theme/chorey-theme";

type Props = {
  childName?: string;
  householdId?: string;
  onOpenChildren?: () => void;
  onOpenChores?: () => void;
  onOpenDashboard?: () => void;
  onOpenUpgrade?: () => void;
};

export function ParentSettingsScreen({
  childName = "Your child",
  householdId = "Active household",
  onOpenChildren,
  onOpenChores,
  onOpenDashboard,
  onOpenUpgrade,
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
            Settings
          </Text>
          <Text
            selectable
            style={{
              color: choreyTheme.colors.inkMuted,
              fontSize: 16,
              lineHeight: 24,
            }}
          >
            Household details, plan options, and parent controls.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: choreyTheme.colors.surface,
            borderColor: choreyTheme.colors.borderSoft,
            borderRadius: choreyTheme.radii.lg,
            borderWidth: 1,
            gap: choreyTheme.spacing.md,
            padding: choreyTheme.spacing.lg,
            ...choreyTheme.shadows.card,
          }}
        >
          <Text
            style={{
              color: choreyTheme.colors.ink1,
              fontSize: 20,
              fontWeight: "900",
            }}
          >
            Household
          </Text>
          <View style={{ gap: choreyTheme.spacing.xs }}>
            <Text
              style={{
                color: choreyTheme.colors.inkMuted,
                fontSize: 13,
                fontWeight: "800",
              }}
            >
              Household ID
            </Text>
            <Text
              selectable
              style={{
                color: choreyTheme.colors.ink1,
                fontSize: 15,
                fontWeight: "800",
              }}
            >
              {householdId}
            </Text>
          </View>
          <View style={{ gap: choreyTheme.spacing.xs }}>
            <Text
              style={{
                color: choreyTheme.colors.inkMuted,
                fontSize: 13,
                fontWeight: "800",
              }}
            >
              Current child
            </Text>
            <Text
              style={{
                color: choreyTheme.colors.ink1,
                fontSize: 15,
                fontWeight: "800",
              }}
            >
              {childName}
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: choreyTheme.colors.surfaceWarm,
            borderColor: choreyTheme.colors.borderMedium,
            borderRadius: choreyTheme.radii.lg,
            borderWidth: 1,
            gap: choreyTheme.spacing.md,
            padding: choreyTheme.spacing.lg,
            ...choreyTheme.shadows.card,
          }}
        >
          <Text
            style={{
              color: choreyTheme.colors.ink1,
              fontSize: 20,
              fontWeight: "900",
            }}
          >
            Plan
          </Text>
          <Text
            style={{
              color: choreyTheme.colors.inkMuted,
              fontSize: 15,
              lineHeight: 22,
            }}
          >
            Free households include one child. Plus unlocks multiple children
            and paid household features.
          </Text>
          <Pressable
            accessibilityLabel="Open upgrade options"
            accessibilityRole="button"
            onPress={onOpenUpgrade}
            style={({ pressed }) => ({
              alignItems: "center",
              backgroundColor: pressed
                ? choreyTheme.colors.primaryPressed
                : choreyTheme.colors.primary,
              borderColor: choreyTheme.colors.primaryPressed,
              borderRadius: choreyTheme.radii.pill,
              borderWidth: 1,
              paddingVertical: 14,
              ...choreyTheme.shadows.button,
            })}
          >
            <Text
              style={{
                color: choreyTheme.colors.cream1,
                fontSize: 15,
                fontWeight: "800",
              }}
            >
              View upgrade options
            </Text>
          </Pressable>
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
          currentTab="settings"
          onOpenChildren={onOpenChildren}
          onOpenChores={onOpenChores}
          onOpenDashboard={onOpenDashboard}
        />
      </View>
    </View>
  );
}
