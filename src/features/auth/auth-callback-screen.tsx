import { ScrollView, Text, View } from "react-native";

import { choreyTheme } from "@/theme/chorey-theme";

export function AuthCallbackScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: choreyTheme.colors.cream2 }}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        padding: choreyTheme.spacing.xl,
        gap: choreyTheme.spacing.md,
      }}
    >
      <View
        style={{
          backgroundColor: choreyTheme.colors.surfaceWarm,
          borderColor: choreyTheme.colors.borderSoft,
          borderRadius: choreyTheme.radii.lg,
          borderWidth: 1,
          gap: choreyTheme.spacing.sm,
          padding: choreyTheme.spacing.lg,
          ...choreyTheme.shadows.card,
        }}
      >
        <Text
          selectable
          style={{
            color: choreyTheme.colors.ink1,
            fontSize: 28,
            fontWeight: "800",
          }}
        >
          Finishing sign in
        </Text>
        <Text
          selectable
          style={{
            color: choreyTheme.colors.inkMuted,
            fontSize: 16,
            lineHeight: 24,
          }}
        >
          Chorey is checking your parent session.
        </Text>
      </View>
    </ScrollView>
  );
}
