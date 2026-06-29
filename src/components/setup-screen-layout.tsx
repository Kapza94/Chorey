import type { ReactNode } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { ChevronLeft } from "lucide-react-native";

import { useKeyboardHeight } from "@/components/use-keyboard-height";
import { choreyTheme } from "@/theme/chorey-theme";
import { useChoreyTheme } from "@/theme/use-chorey-theme";

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
  const { scheme, typography, toybox } = useChoreyTheme();
  const keyboardHeight = useKeyboardHeight();
  // Android resizes the window above the keyboard on its own (default
  // softwareKeyboardLayoutMode: "resize"), so only iOS needs manual lift —
  // padding by keyboardHeight on both would double-count and float the footer.
  const keyboardLift = Platform.OS === "ios" ? keyboardHeight : 0;
  return (
    <View style={{ flex: 1, backgroundColor: scheme.bgPage }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          padding: choreyTheme.spacing.xl,
          paddingBottom:
            keyboardLift > 0
              ? keyboardLift + choreyTheme.spacing.xxl
              : choreyTheme.spacing.lg,
          gap: choreyTheme.spacing.lg,
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
              backgroundColor: pressed ? scheme.bgSunken : scheme.bgRaised,
              borderColor: scheme.toy.border,
              borderRadius: choreyTheme.radii.pill,
              borderWidth: toybox.borderWidth,
              height: 30,
              justifyContent: "center",
              width: 30,
              ...(pressed ? null : scheme.toy.shadowSm),
            })}
          >
            <ChevronLeft size={16} color={scheme.fg} strokeWidth={2.4} />
          </Pressable>
        ) : null}

        <View
          style={{
            backgroundColor: scheme.bgModal,
            borderColor: scheme.toy.border,
            borderRadius: 18,
            borderWidth: toybox.borderWidth,
            gap: choreyTheme.spacing.sm,
            padding: choreyTheme.spacing.lg,
            ...scheme.toy.shadow,
          }}
        >
          <Text
            selectable
            style={[typography.text.overline, { color: scheme.fgFaint }]}
          >
            {eyebrow}
          </Text>
          <Text
            selectable
            style={[typography.text.h1, { color: scheme.fg, fontSize: 32 }]}
          >
            {title}
          </Text>
          <Text
            selectable
            style={[typography.text.body, { color: scheme.fgMuted }]}
          >
            {description}
          </Text>
        </View>

        <View style={{ gap: choreyTheme.spacing.xl }}>{children}</View>
      </ScrollView>

      <View
        style={{
          backgroundColor: scheme.bgPage,
          paddingHorizontal: choreyTheme.spacing.xl,
          paddingTop: choreyTheme.spacing.lg,
          paddingBottom:
            keyboardLift > 0
              ? keyboardLift + choreyTheme.spacing.md
              : choreyTheme.spacing.xxl,
          overflow: "visible",
        }}
      >
        {footer}
      </View>
    </View>
  );
}
