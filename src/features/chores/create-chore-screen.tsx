import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { SetupScreenLayout } from "@/components/setup-screen-layout";
import { fieldStyle } from "@/components/field-style";
import type { CreatedChore } from "@/features/chores/chore-actions";
import {
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
  const { scheme, palette } = useChoreyTheme();
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
        <Pressable
          accessibilityLabel="Submit chore"
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={handleCreateChore}
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
            {isSubmitting ? "Creating chore..." : "Create chore"}
          </Text>
        </Pressable>
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
          Chore title
        </Text>
        <TextInput
          accessibilityLabel="Chore title"
          onChangeText={setTitle}
          placeholder="Load dishwasher"
          placeholderTextColor={scheme.fgFaint}
          style={fieldStyle(scheme, choreyTheme.typography.family.body.regular)}
        />
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
            color: scheme.fg,
            fontSize: 14,
            fontWeight: "800",
          }}
        >
          Reward amount
        </Text>
        <TextInput
          accessibilityLabel="Reward amount"
          keyboardType="decimal-pad"
          onChangeText={setRewardAmount}
          placeholder="2.50"
          placeholderTextColor={scheme.fgFaint}
          style={fieldStyle(scheme, choreyTheme.typography.family.body.regular)}
        />
      </View>

      <View
        style={{
          backgroundColor: scheme.bgRaised,
          borderColor: scheme.borderHover,
          borderRadius: choreyTheme.radii.lg,
          borderWidth: 1,
          gap: choreyTheme.spacing.md,
          padding: choreyTheme.spacing.lg,
          ...choreyTheme.shadows.card,
        }}
      >
        <Text
          style={{
            color: scheme.fg,
            fontSize: 16,
            fontWeight: "900",
          }}
        >
          40 / 40 / 20 preview
        </Text>
        <View style={{ gap: choreyTheme.spacing.sm }}>
          {(["spend", "savings", "giving"] as const).map((bucket) => {
            const bucketTheme = choreyTheme.buckets[bucket];
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
                  flexDirection: "row",
                  gap: choreyTheme.spacing.sm,
                }}
              >
                <View
                  style={{
                    backgroundColor: bucketTheme.color,
                    borderRadius: choreyTheme.radii.pill,
                    height: 10,
                    width: 10,
                  }}
                />
                <Text
                  style={{
                    color: scheme.fgMuted,
                    fontSize: 14,
                    fontWeight: "900",
                  }}
                >
                  {bucketTheme.label} {bucketTheme.percent}%
                  {hasRewardAmount ? `: ${formatReward(previewCents)}` : ""}
                </Text>
              </View>
            );
          })}
        </View>
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
    </SetupScreenLayout>
  );
}
