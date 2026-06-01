import { Pressable, ScrollView, Text, View } from "react-native";

import { choreyTheme } from "@/theme/chorey-theme";

type Props = {
  onClose?: () => void;
};

const features = [
  {
    title: "Multiple children",
    description: "Add each child in the household without losing one shared 40 / 40 / 20 view.",
  },
  {
    title: "Recurring chores",
    description: "Automate daily, weekly, and monthly chores once recurrence ships.",
  },
  {
    title: "Photo proof",
    description: "Require temporary proof for chores that need parent review.",
  },
];

export function UpgradeScreen({ onClose }: Props) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        gap: choreyTheme.spacing.xxl,
        padding: choreyTheme.spacing.xl,
      }}
      style={{ flex: 1, backgroundColor: choreyTheme.colors.cream2 }}
    >
      <View
        style={{
          backgroundColor: choreyTheme.colors.surfaceWarm,
          borderColor: choreyTheme.colors.borderSoft,
          borderRadius: choreyTheme.radii.lg,
          borderWidth: 1,
          gap: choreyTheme.spacing.md,
          padding: choreyTheme.spacing.lg,
          ...choreyTheme.shadows.card,
        }}
      >
        <Text
          selectable
          style={{
            color: choreyTheme.colors.inkMuted,
            fontSize: 13,
            fontWeight: "800",
          }}
        >
          Parent plan
        </Text>
        <Text
          selectable
          style={{
            color: choreyTheme.colors.ink1,
            fontSize: 40,
            fontWeight: "800",
            letterSpacing: 0,
          }}
        >
          Chorey Plus
        </Text>
        <Text
          selectable
          style={{
            color: choreyTheme.colors.inkMuted,
            fontSize: 16,
            lineHeight: 24,
          }}
        >
          Plus unlocks household scale and convenience. Children never see billing
          or upgrade prompts.
        </Text>
      </View>

      <View style={{ gap: choreyTheme.spacing.md }}>
        {features.map((feature) => (
          <View
            key={feature.title}
            style={{
              backgroundColor: choreyTheme.colors.surface,
              borderColor: choreyTheme.colors.borderSoft,
              borderRadius: choreyTheme.radii.lg,
              borderWidth: 1,
              gap: choreyTheme.spacing.sm,
              padding: choreyTheme.spacing.lg,
            }}
          >
            <Text
              selectable
              style={{
                color: choreyTheme.colors.ink1,
                fontSize: 17,
                fontWeight: "800",
              }}
            >
              {feature.title}
            </Text>
            <Text
              selectable
              style={{
                color: choreyTheme.colors.inkMuted,
                fontSize: 14,
                lineHeight: 20,
              }}
            >
              {feature.description}
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityLabel="Close upgrade options"
        accessibilityRole="button"
        onPress={onClose}
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
          Back to dashboard
        </Text>
      </Pressable>
    </ScrollView>
  );
}
