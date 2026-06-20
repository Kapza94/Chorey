import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { choreyTheme } from "@/theme/chorey-theme";

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  onBack?: () => void;
};

export function SetupScreenLayout({
  eyebrow,
  title,
  description,
  children,
  footer,
  onBack,
}: Props) {
  return (
    // Lift the pinned footer (and scrollable fields) above the keyboard so the
    // submit button and lower inputs never end up hidden underneath it.
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: choreyTheme.colors.cream2 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          padding: choreyTheme.spacing.xl,
          paddingBottom: choreyTheme.spacing.lg,
          gap: choreyTheme.spacing.xxl,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        style={{ flex: 1 }}
      >
        {onBack ? (
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={onBack}
            style={({ pressed }) => ({
              alignItems: "center",
              alignSelf: "flex-start",
              backgroundColor: pressed
                ? choreyTheme.colors.primarySoft
                : choreyTheme.colors.surface,
              borderColor: choreyTheme.colors.borderMedium,
              borderRadius: choreyTheme.radii.pill,
              borderWidth: 1,
              height: 44,
              justifyContent: "center",
              width: 44,
            })}
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
        ) : null}

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
              color: choreyTheme.colors.inkMuted,
              fontSize: 13,
              fontWeight: "800",
            }}
          >
            {eyebrow}
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

        <View style={{ gap: choreyTheme.spacing.xl }}>{children}</View>
      </ScrollView>

      <View
        style={{
          backgroundColor: choreyTheme.colors.cream1,
          borderColor: choreyTheme.colors.borderSoft,
          borderTopWidth: 1,
          paddingHorizontal: choreyTheme.spacing.xl,
          paddingTop: choreyTheme.spacing.md,
          paddingBottom: choreyTheme.spacing.xl,
        }}
      >
        {footer}
      </View>
    </KeyboardAvoidingView>
  );
}
