import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { SetupScreenLayout } from "@/components/setup-screen-layout";
import type { CreatedChild } from "@/features/children/child-actions";
import { choreyTheme } from "@/theme/chorey-theme";

type CreateChildPayload = {
  householdId: string;
  displayName: string;
};

type Props = {
  householdId: string;
  onChildCreated?: (child: CreatedChild) => Promise<void> | void;
  onCreateChild?: (input: CreateChildPayload) => Promise<CreatedChild>;
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
  onBack,
}: Props) {
  const [displayName, setDisplayName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateChild() {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const child = await onCreateChild({ householdId, displayName });
      await onChildCreated?.(child);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Child profile could not be created.",
      );
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
              ? choreyTheme.colors.primaryPressed
              : choreyTheme.colors.primary,
            borderColor: choreyTheme.colors.primaryPressed,
            borderRadius: choreyTheme.radii.pill,
            borderWidth: 1,
            opacity: isSubmitting ? 0.65 : 1,
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
            {isSubmitting ? "Adding child..." : "Add child"}
          </Text>
        </Pressable>
      }
      onBack={onBack}
      title="Add your first child"
    >
      <View
        style={{
          backgroundColor: choreyTheme.colors.surface,
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
            color: choreyTheme.colors.ink1,
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
          placeholderTextColor={choreyTheme.colors.inkMuted}
          style={{
            borderRadius: choreyTheme.radii.md,
            borderColor: choreyTheme.colors.borderSoft,
            borderWidth: 1,
            backgroundColor: choreyTheme.colors.surface,
            color: choreyTheme.colors.ink1,
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
            color: choreyTheme.colors.inkMuted,
            fontSize: 14,
            lineHeight: 20,
          }}
        >
          {errorMessage}
        </Text>
      ) : null}
    </SetupScreenLayout>
  );
}
