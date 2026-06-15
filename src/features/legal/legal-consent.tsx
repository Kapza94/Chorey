import { Linking, Text } from "react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { PRIVACY_URL, TERMS_URL } from "@/features/legal/legal";

/**
 * The "By continuing, you agree to our Terms of Service and Privacy Policy" line
 * shown at sign-up (and reusable on the paywall). Pure aside from opening a URL,
 * which is injected via `onOpen` so it stays testable. The two documents are
 * tappable; the default just hands the URL to the OS browser.
 */
export function LegalConsent({
  action = "continuing",
  onOpen = (url: string) => {
    void Linking.openURL(url);
  },
}: {
  /** Verb describing the gating action, e.g. "continuing" or "subscribing". */
  action?: string;
  onOpen?: (url: string) => void;
}) {
  const { scheme } = useChoreyTheme();

  const link = {
    color: scheme.fg,
    fontWeight: "700" as const,
    textDecorationLine: "underline" as const,
  };

  return (
    <Text
      style={{
        color: scheme.fgFaint,
        fontSize: 12,
        lineHeight: 18,
        textAlign: "center",
      }}
    >
      By {action}, you agree to our{" "}
      <Text
        accessibilityRole="link"
        accessibilityLabel="Terms of Service"
        onPress={() => onOpen(TERMS_URL)}
        style={link}
      >
        Terms of Service
      </Text>{" "}
      and{" "}
      <Text
        accessibilityRole="link"
        accessibilityLabel="Privacy Policy"
        onPress={() => onOpen(PRIVACY_URL)}
        style={link}
      >
        Privacy Policy
      </Text>
      .
    </Text>
  );
}
