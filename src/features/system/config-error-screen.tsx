import { Text, View } from "react-native";

import { choreyTheme } from "@/theme/chorey-theme";

/**
 * Shown at startup when required configuration (e.g. Supabase keys) is missing
 * from the build. Replaces the previous behavior where a missing env var threw
 * at import time and hard-crashed the app on launch. Pure component — no props,
 * no side effects — so it renders even when nothing else is wired up.
 */
export function ConfigErrorScreen() {
  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: choreyTheme.colors.cream2,
        flex: 1,
        gap: choreyTheme.spacing.md,
        justifyContent: "center",
        padding: choreyTheme.spacing.xl,
      }}
    >
      <Text
        accessibilityRole="header"
        style={{
          color: choreyTheme.colors.ink1,
          fontFamily: choreyTheme.typography.family.display.bold,
          fontSize: 28,
          textAlign: "center",
        }}
      >
        Chorey can&apos;t start
      </Text>
      <Text
        style={{
          color: choreyTheme.colors.inkMuted,
          fontFamily: choreyTheme.typography.family.body.regular,
          fontSize: 16,
          lineHeight: 24,
          textAlign: "center",
        }}
      >
        This build is missing some required setup. Please make sure you&apos;re on
        the latest version of the app, or contact support if it keeps happening.
      </Text>
    </View>
  );
}
