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

  // The CHOREY- prefix is fixed in the UI — kids type only the part after it.
  // Tolerate pasting the whole code (a leading CHOREY collapses into the prefix).
  const payload = accessCode.replace(/^CHOREY-?/, "");
  const onTypeCode = (v: string) => {
    const typed = v
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .replace(/^CHOREY-?/, "");
    setAccessCode(typed.length > 0 ? `CHOREY-${typed}` : "");
    if (errorMessage) setErrorMessage(null);
  };

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
          value={payload}
          onChange={onTypeCode}
          prefix="CHOREY-"
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          placeholder="AB12CD34"
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
