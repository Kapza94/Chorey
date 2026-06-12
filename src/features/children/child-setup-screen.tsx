import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { SetupScreenLayout } from "@/components/setup-screen-layout";
import type { CreatedChild } from "@/features/children/child-actions";
import { choreyTheme } from "@/theme/chorey-theme";
import { useChoreyTheme } from "@/theme/use-chorey-theme";

type CreateChildPayload = {
  householdId: string;
  displayName: string;
};

type Props = {
  householdId: string;
  onChildCreated?: (child: CreatedChild) => Promise<void> | void;
  onCreateChild?: (input: CreateChildPayload) => Promise<CreatedChild>;
  onUpgrade?: () => void;
  onBack?: () => void;
};

const noopCreateChild = async (input: CreateChildPayload) => ({
  id: "preview-child",
  displayName: input.displayName,
  householdId: input.householdId,
});

export function ChildSetupScreen({
  householdId,
  onChildCreated,
  onCreateChild = noopCreateChild,
  onUpgrade,
  onBack,
}: Props) {
  const { scheme, palette } = useChoreyTheme();
  const [displayName, setDisplayName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateChild() {
    setErrorMessage(null);
    setShowUpgradePrompt(false);
    setIsSubmitting(true);

    try {
      const child = await onCreateChild({ householdId, displayName });
      await onChildCreated?.(child);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Child profile could not be created.";

      if (/Chorey is paused/.test(message)) {
        setShowUpgradePrompt(true);
      } else {
        setErrorMessage(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SetupScreenLayout
      description="Start with a name. Chorey will use this for chores, balances, and the 40 / 40 / 20 buckets."
      eyebrow="Child setup"
      footer={
        <Pressable
          accessibilityLabel="Submit child setup"
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={handleCreateChild}
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
            {isSubmitting ? "Adding child..." : "Add child"}
          </Text>
        </Pressable>
      }
      onBack={onBack}
      title="Add child"
    >
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
            color: scheme.fg,
            fontSize: 14,
            fontWeight: "800",
          }}
        >
          Child name
        </Text>
        <TextInput
          accessibilityLabel="Child name"
          onChangeText={setDisplayName}
          placeholder="Mina"
          placeholderTextColor={scheme.fgFaint}
          style={{
            borderRadius: choreyTheme.radii.md,
            borderColor: scheme.border,
            borderWidth: 1,
            backgroundColor: scheme.bgModal,
            color: scheme.fg,
            fontSize: 16,
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

      {showUpgradePrompt ? (
        <View
          accessibilityRole="alert"
          style={{
            backgroundColor: scheme.tint.allowance,
            borderColor: scheme.borderHover,
            borderRadius: choreyTheme.radii.lg,
            borderWidth: 1,
            gap: choreyTheme.spacing.md,
            padding: choreyTheme.spacing.lg,
          }}
        >
          <Text
            style={{
              color: scheme.fg,
              fontSize: 18,
              fontWeight: "800",
            }}
          >
            Chorey is paused
          </Text>
          <Text
            style={{
              color: scheme.fgMuted,
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            Your family&apos;s data is safe. Resume your Chorey Family
            subscription to add another child.
          </Text>
          <Pressable
            accessibilityLabel="View subscription"
            accessibilityRole="button"
            onPress={onUpgrade}
            style={({ pressed }) => ({
              alignItems: "center",
              alignSelf: "flex-start",
              backgroundColor: pressed
                ? palette.accent[800]
                : palette.accent[600],
              borderRadius: choreyTheme.radii.pill,
              paddingHorizontal: choreyTheme.spacing.lg,
              paddingVertical: choreyTheme.spacing.md,
            })}
          >
            <Text
              style={{
                color: palette.cream[4],
                fontSize: 14,
                fontWeight: "800",
              }}
            >
              View subscription
            </Text>
          </Pressable>
        </View>
      ) : null}
    </SetupScreenLayout>
  );
}
