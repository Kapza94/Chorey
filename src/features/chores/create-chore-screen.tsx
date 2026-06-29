import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { SetupScreenLayout } from "@/components/setup-screen-layout";
import { fieldStyle } from "@/components/field-style";
import { ToyButton, ToyCard } from "@/components/toybox";
import type { CreatedChore } from "@/features/chores/chore-actions";
import {
  clampRewardInput,
  formatReward,
  parseRewardCents,
  splitRewardCents,
} from "@/features/chores/money";
import { choreyTheme } from "@/theme/chorey-theme";
import { useChoreyTheme } from "@/theme/use-chorey-theme";

type CreateChorePayload = {
  householdId: string;
  childProfileId: string;
  title: string;
  rewardCents: number;
};

type Props = {
  householdId: string;
  childProfileId: string;
  childName: string;
  onBack?: () => void;
  onChoreCreated?: (chore: CreatedChore) => void;
  onCreateChore?: (input: CreateChorePayload) => Promise<CreatedChore>;
};

const noopCreateChore = async (input: CreateChorePayload) => ({
  id: "preview-chore",
  householdId: input.householdId,
  childProfileId: input.childProfileId,
  title: input.title,
  rewardCents: input.rewardCents,
  status: "assigned" as const,
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

  return "Chore could not be created.";
}

function getPreviewSplit(rewardAmount: string) {
  try {
    return splitRewardCents(parseRewardCents(rewardAmount));
  } catch {
    return splitRewardCents(0);
  }
}

export function CreateChoreScreen({
  householdId,
  childProfileId,
  childName,
  onBack,
  onChoreCreated,
  onCreateChore = noopCreateChore,
}: Props) {
  const { scheme, palette, typography, toybox, isDark, bucketInk } =
    useChoreyTheme();
  const [title, setTitle] = useState("");
  const [rewardAmount, setRewardAmount] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasRewardAmount = rewardAmount.trim().length > 0;
  const previewSplit = getPreviewSplit(rewardAmount);

  async function handleCreateChore() {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const chore = await onCreateChore({
        householdId,
        childProfileId,
        title,
        rewardCents: parseRewardCents(rewardAmount),
      });
      onChoreCreated?.(chore);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SetupScreenLayout
      description="Create a one-off chore. When the work is approved later, the reward will split into Spend, Savings, and Giving."
      eyebrow="Manual chore"
      footer={
        <ToyButton
          accessibilityLabel="Submit chore"
          disabled={isSubmitting}
          onPress={handleCreateChore}
        >
          {isSubmitting ? "Creating chore..." : "Create chore"}
        </ToyButton>
      }
      onBack={onBack}
      title="Create chore"
    >
      <Text
        style={{
          alignSelf: "flex-start",
          backgroundColor: scheme.tint.allowance,
          borderColor: palette.accent[600],
          borderRadius: choreyTheme.radii.pill,
          borderWidth: 1,
          color: scheme.fg,
          fontSize: 15,
          fontWeight: "900",
          overflow: "hidden",
          paddingHorizontal: choreyTheme.spacing.md,
          paddingVertical: 6,
        }}
      >
        For {childName}
      </Text>

      <ToyCard style={{ gap: choreyTheme.spacing.md }}>
        <Text
          selectable
          style={[typography.text.overline, { color: scheme.fgFaint }]}
        >
          Chore title
        </Text>
        <TextInput
          accessibilityLabel="Chore title"
          onChangeText={setTitle}
          placeholder="Load dishwasher"
          placeholderTextColor={scheme.fgFaint}
          style={fieldStyle(scheme, choreyTheme.typography.family.body.regular)}
        />
      </ToyCard>

      <ToyCard style={{ gap: choreyTheme.spacing.md }}>
        <Text
          selectable
          style={[typography.text.overline, { color: scheme.fgFaint }]}
        >
          Reward amount
        </Text>
        <TextInput
          accessibilityLabel="Reward amount"
          keyboardType="decimal-pad"
          onChangeText={(raw) => setRewardAmount(clampRewardInput(raw))}
          placeholder="2.50"
          placeholderTextColor={scheme.fgFaint}
          style={fieldStyle(scheme, choreyTheme.typography.family.body.regular)}
        />
      </ToyCard>

      <ToyCard style={{ gap: choreyTheme.spacing.md }}>
        <Text style={[typography.text.h3, { color: scheme.fg, fontSize: 16 }]}>
          40 / 40 / 20 preview
        </Text>
        <View style={{ gap: choreyTheme.spacing.sm }}>
          {(["spend", "savings", "giving"] as const).map((bucket) => {
            const bucketTheme = choreyTheme.buckets[bucket];
            const ramp = bucketTheme.ramp;
            const previewCents =
              bucket === "spend"
                ? previewSplit.spendCents
                : bucket === "savings"
                  ? previewSplit.savingsCents
                  : previewSplit.givingCents;

            return (
              <View
                key={bucket}
                style={{
                  alignItems: "center",
                  backgroundColor: isDark ? ramp.tintDark : ramp[200],
                  borderColor: scheme.toy.border,
                  borderRadius: 12,
                  borderWidth: toybox.borderWidth,
                  flexDirection: "row",
                  gap: choreyTheme.spacing.sm,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                }}
              >
                <View
                  style={{
                    backgroundColor: ramp[400],
                    borderRadius: choreyTheme.radii.pill,
                    height: 10,
                    width: 10,
                  }}
                />
                <Text
                  style={{
                    color: bucketInk(bucket),
                    fontFamily: typography.family.body.bold,
                    fontSize: 14,
                  }}
                >
                  {bucketTheme.label} {bucketTheme.percent}%
                  {hasRewardAmount ? `: ${formatReward(previewCents)}` : ""}
                </Text>
              </View>
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
