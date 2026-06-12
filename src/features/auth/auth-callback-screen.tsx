import { ScrollView, Text, View } from "react-native";

import { choreyTheme } from "@/theme/chorey-theme";
import { useChoreyTheme } from "@/theme/use-chorey-theme";

export function AuthCallbackScreen() {
  const { scheme } = useChoreyTheme();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: scheme.bgPage }}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        padding: choreyTheme.spacing.xl,
        gap: choreyTheme.spacing.md,
      }}
    >
      <View
        style={{
          backgroundColor: scheme.bgRaised,
          borderColor: scheme.border,
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
            color: scheme.fg,
            fontSize: 28,
            fontWeight: "800",
          }}
        >
          Finishing sign in
        </Text>
        <Text
          selectable
          style={{
            color: scheme.fgFaint,
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
