import { useState } from "react";
import { Text, View } from "react-native";

import type { ResolvedChildAccess } from "@/features/children/child-access-actions";
import {
  OBField,
  OBPrimary,
  OBShell,
  OBTitle,
} from "@/features/onboarding/onboarding-kit";
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
  const { scheme, typography } = useChoreyTheme();
  const [accessCode, setAccessCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAccess() {
    if (!accessCode.trim() || isSubmitting) {
      return;
    }

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
    <OBShell
      onBack={onBack}
      footer={
        <OBPrimary
          accessibilityLabel="Continue as child"
          disabled={isSubmitting || !accessCode.trim()}
          onPress={handleAccess}
        >
          {isSubmitting ? "Checking code..." : "Continue"}
        </OBPrimary>
      }
    >
      <OBTitle
        title="Enter your code."
        subtitle="Use the join code your parent shared to open your Chorey profile."
      />

      <View
        style={{
          backgroundColor: scheme.bgModal,
          borderColor: scheme.toy.border,
          borderRadius: 18,
          borderWidth: 2,
          gap: 14,
          padding: 16,
          ...scheme.toy.shadow,
        }}
      >
        <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>
          Parent-linked access only
        </Text>
        <OBField
          label="Access code"
          value={accessCode}
          onChange={setAccessCode}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          placeholder="CHOREY-XXXXXXXX"
          returnKeyType="go"
          onSubmitEditing={handleAccess}
        />
      </View>

      {errorMessage ? (
        <Text
          accessibilityRole="alert"
          style={{
            color: scheme.fgFaint,
            fontSize: 14,
            lineHeight: 20,
            marginTop: 18,
          }}
        >
          {errorMessage}
        </Text>
      ) : null}
    </OBShell>
  );
}
