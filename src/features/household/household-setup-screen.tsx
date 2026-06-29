import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { SetupScreenLayout } from "@/components/setup-screen-layout";
import { ToyButton, ToyCard } from "@/components/toybox";
import type {
  CreatedHousehold,
  CreateHouseholdInput,
  SettlementFrequency,
} from "@/features/household/household-actions";
import { choreyTheme } from "@/theme/chorey-theme";
import { useChoreyTheme } from "@/theme/use-chorey-theme";

type Props = {
  onCreateHousehold?: (
    input: CreateHouseholdInput,
  ) => Promise<CreatedHousehold> | CreatedHousehold;
  onHouseholdCreated?: (household: CreatedHousehold) => void;
  onBack?: () => void;
};

const noopCreate = (input: CreateHouseholdInput) => ({
  id: "preview-household",
  name: input.name,
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

  return "Household could not be created.";
}

export function HouseholdSetupScreen({
  onCreateHousehold = noopCreate,
  onHouseholdCreated,
  onBack,
}: Props) {
  const { scheme, palette, typography, toybox } = useChoreyTheme();
  const [name, setName] = useState("");
  const [settlementFrequency, setSettlementFrequency] =
    useState<SettlementFrequency>("weekly");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateHousehold() {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const household = await onCreateHousehold({ name, settlementFrequency });
      onHouseholdCreated?.(household);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SetupScreenLayout
      description="Start with your family name and choose how often you settle outside the app."
      eyebrow="Parent setup"
      footer={
        <ToyButton
          accessibilityLabel="Submit household setup"
          disabled={isSubmitting}
          onPress={handleCreateHousehold}
        >
          {isSubmitting ? "Creating household..." : "Create household"}
        </ToyButton>
      }
      onBack={onBack}
      title="Create household"
    >
      <ToyCard style={{ gap: choreyTheme.spacing.md }}>
        <Text
          selectable
          style={[typography.text.overline, { color: scheme.fgFaint }]}
        >
          Household name
        </Text>
        <TextInput
          accessibilityLabel="Household name"
          onChangeText={setName}
          placeholder="Kapza home"
          placeholderTextColor={scheme.fgFaint}
          style={{
            borderRadius: choreyTheme.radii.md,
            borderColor: scheme.toy.border,
            borderWidth: toybox.borderWidth,
            backgroundColor: scheme.bgRaised,
            color: scheme.fg,
            fontSize: 16,
            paddingHorizontal: choreyTheme.spacing.lg,
            paddingVertical: 15,
          }}
        />
      </ToyCard>

      <ToyCard style={{ gap: choreyTheme.spacing.md }}>
        <Text
          selectable
          style={[typography.text.overline, { color: scheme.fgFaint }]}
        >
          Settlement rhythm
        </Text>
        <View style={{ flexDirection: "row", gap: choreyTheme.spacing.sm }}>
          {(["weekly", "monthly"] as const).map((frequency) => {
            const selected = settlementFrequency === frequency;
            const label = frequency === "weekly" ? "Weekly" : "Monthly";

            return (
              <Pressable
                accessibilityRole="button"
                key={frequency}
                onPress={() => setSettlementFrequency(frequency)}
                style={({ pressed }) => ({
                  flex: 1,
                  alignItems: "center",
                  borderRadius: choreyTheme.radii.pill,
                  backgroundColor: selected
                    ? palette.accent[600]
                    : pressed
                      ? scheme.tint.allowance
                      : scheme.bgRaised,
                  borderColor: scheme.toy.border,
                  borderWidth: toybox.borderWidth,
                  paddingVertical: 14,
                  ...(selected ? scheme.toy.shadowSm : null),
                })}
              >
                <Text
                  style={{
                    color: selected ? palette.cream[4] : scheme.fg,
                    fontSize: 15,
                    fontWeight: "800",
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ToyCard>

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
    </SetupScreenLayout>
  );
}
