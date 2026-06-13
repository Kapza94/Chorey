import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import type { ResolvedChildAccess } from "@/features/children/child-access-actions";
import { choreyTheme } from "@/theme/chorey-theme";
import { useChoreyTheme } from "@/theme/use-chorey-theme";

type Props = {
  onBack?: () => void;
  onChildAccess?: (child: ResolvedChildAccess) => void;
  onResolveAccessCode?: (code: string) => Promise<ResolvedChildAccess>;
};

const noopResolve = async (code: string): Promise<ResolvedChildAccess> => ({
  accessCode: code,
  childProfileId: "preview-child",
  childName: "Child",
  householdId: "preview-household",
  currency: "USD",
  paused: false,
});

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Access code could not be checked.";
}

export function ChildAccessScreen({
  onBack,
  onChildAccess,
  onResolveAccessCode = noopResolve,
}: Props) {
  const { scheme, palette } = useChoreyTheme();
  const [accessCode, setAccessCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAccess() {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const child = await onResolveAccessCode(accessCode);
      onChildAccess?.(child);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: scheme.bgPage }}
      contentContainerStyle={{
        padding: choreyTheme.spacing.xl,
        paddingBottom: choreyTheme.spacing.xxl,
        gap: choreyTheme.spacing.xl,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        onPress={onBack}
        style={({ pressed }) => ({
          alignItems: "center",
          alignSelf: "flex-start",
          backgroundColor: pressed
            ? scheme.tint.allowance
            : scheme.bgModal,
          borderColor: scheme.borderHover,
          borderRadius: choreyTheme.radii.pill,
          borderWidth: 1,
          height: 44,
          justifyContent: "center",
          width: 44,
        })}
      >
        <Text
          style={{
            color: scheme.fg,
            fontSize: 24,
            fontWeight: "700",
            lineHeight: 26,
          }}
        >
          {"<"}
        </Text>
      </Pressable>

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
            fontSize: 34,
            fontWeight: "800",
          }}
        >
          Child access
        </Text>
        <Text
          selectable
          style={{
            color: scheme.fgFaint,
            fontSize: 16,
            lineHeight: 24,
          }}
        >
          Enter the code your parent gave you.
        </Text>
      </View>

      <View
        style={{
          backgroundColor: scheme.bgModal,
          borderColor: scheme.border,
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
            color: scheme.fgFaint,
            fontSize: 13,
            fontWeight: "900",
          }}
        >
          Parent-linked access only
        </Text>
        <Text
          selectable
          style={{
            color: scheme.fg,
            fontSize: 14,
            fontWeight: "800",
          }}
        >
          Access code
        </Text>
        <TextInput
          accessibilityLabel="Access code"
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          onChangeText={setAccessCode}
          placeholder="CHOREY-XXXXXXXX"
          placeholderTextColor={scheme.fgFaint}
          style={{
            borderRadius: choreyTheme.radii.md,
            borderColor: scheme.border,
            borderWidth: 1,
            backgroundColor: scheme.bgModal,
            color: scheme.fg,
            fontSize: 20,
            letterSpacing: 1,
            paddingHorizontal: choreyTheme.spacing.lg,
            paddingVertical: 15,
          }}
        />
      </View>

      {errorMessage ? (
        <Text
          accessibilityRole="alert"
          style={{
            color: scheme.fgFaint,
            fontSize: 14,
            lineHeight: 20,
          }}
        >
          {errorMessage}
        </Text>
      ) : null}

      <Pressable
        accessibilityLabel="Continue as child"
        accessibilityRole="button"
        disabled={isSubmitting}
        onPress={handleAccess}
        style={({ pressed }) => ({
          alignItems: "center",
          backgroundColor: pressed
            ? palette.accent[800]
            : palette.accent[600],
          borderColor: palette.accent[800],
          borderRadius: choreyTheme.radii.pill,
          borderWidth: 1,
          opacity: isSubmitting ? 0.65 : 1,
          paddingVertical: 16,
          ...choreyTheme.shadows.button,
        })}
      >
        <Text
          style={{
            color: palette.cream[4],
            fontSize: 16,
            fontWeight: "800",
          }}
        >
          {isSubmitting ? "Checking code..." : "Continue"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
