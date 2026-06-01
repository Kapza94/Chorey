import { ScrollView, Text, View } from "react-native";

import {
  ParentTabBar,
  type ParentTab,
} from "@/features/parent-navigation/parent-tab-bar";
import { choreyTheme } from "@/theme/chorey-theme";

type Props = {
  currentTab: Exclude<ParentTab, "dashboard">;
  title: string;
  description: string;
  onOpenDashboard?: () => void;
  onOpenChores?: () => void;
  onOpenChildren?: () => void;
  onOpenSettings?: () => void;
};

export function ParentSectionScreen({
  currentTab,
  title,
  description,
  onOpenDashboard,
  onOpenChores,
  onOpenChildren,
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
            {title}
          </Text>
          <Text
            selectable
            style={{
              color: choreyTheme.colors.inkMuted,
              fontSize: 16,
              lineHeight: 24,
            }}
          >
            {description}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: choreyTheme.colors.surface,
            borderColor: choreyTheme.colors.borderSoft,
            borderRadius: choreyTheme.radii.lg,
            borderWidth: 1,
            padding: choreyTheme.spacing.lg,
            ...choreyTheme.shadows.card,
          }}
        >
          <Text
            style={{
              color: choreyTheme.colors.inkMuted,
              fontSize: 15,
              lineHeight: 22,
            }}
          >
            This section is ready for the next workflow.
          </Text>
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
          currentTab={currentTab}
          onOpenChildren={onOpenChildren}
          onOpenChores={onOpenChores}
          onOpenDashboard={onOpenDashboard}
          onOpenSettings={onOpenSettings}
        />
      </View>
    </View>
  );
}
