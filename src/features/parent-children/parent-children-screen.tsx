import { Pressable, ScrollView, Text, View } from "react-native";

import { ParentTabBar } from "@/features/parent-navigation/parent-tab-bar";
import { choreyTheme } from "@/theme/chorey-theme";

type Props = {
  childAccessCode?: string;
  childName?: string;
  onAddChild?: () => void;
  onOpenChildAccess?: () => void;
  onOpenChores?: () => void;
  onOpenDashboard?: () => void;
  onOpenSettings?: () => void;
};

export function ParentChildrenScreen({
  childAccessCode,
  childName = "Your child",
  onAddChild,
  onOpenChildAccess,
  onOpenChores,
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
            Children
          </Text>
          <Text
            selectable
            style={{
              color: choreyTheme.colors.inkMuted,
              fontSize: 16,
              lineHeight: 24,
            }}
          >
            Manage child profiles and access codes from one place.
          </Text>
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
            {childName}
          </Text>

          {childAccessCode ? (
            <View style={{ gap: choreyTheme.spacing.sm }}>
              <Text
                style={{
                  color: choreyTheme.colors.inkMuted,
                  fontSize: 13,
                  fontWeight: "800",
                }}
              >
                Access code
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
            </View>
          ) : null}

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

        <Pressable
          accessibilityLabel="Add child"
          accessibilityRole="button"
          onPress={onAddChild}
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
            Add child
          </Text>
        </Pressable>
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
          currentTab="children"
          onOpenChores={onOpenChores}
          onOpenDashboard={onOpenDashboard}
          onOpenSettings={onOpenSettings}
        />
      </View>
    </View>
  );
}
