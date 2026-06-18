import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { SocialAuthButtons } from "@/components/social-auth-buttons";
import { choreyTheme } from "@/theme/chorey-theme";
import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { LegalConsent } from "@/features/legal/legal-consent";

export type ParentSignInActions = {
  /** resolves true only when a session was established (false = cancelled) */
  signInWithApple(): boolean | void | Promise<boolean | void>;
  signInWithGoogle(): boolean | void | Promise<boolean | void>;
  sendMagicLink(email: string): void | Promise<void>;
  verifyEmailOtp(email: string, token: string): void | Promise<void>;
};

const noopActions: ParentSignInActions = {
  signInWithApple() {},
  signInWithGoogle() {},
  sendMagicLink() {},
  verifyEmailOtp() {},
};

export function ParentSignInScreen({
  actions = noopActions,
  onSignedIn,
}: {
  actions?: ParentSignInActions;
  onSignedIn?: () => void;
}) {
  const { scheme, palette } = useChoreyTheme();
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [magicLinkStatus, setMagicLinkStatus] = useState<
    "idle" | "sending" | "sent" | "verifying" | "verified" | "error"
  >("idle");
  const [magicLinkMessage, setMagicLinkMessage] = useState("");

  async function handleOAuth(provider: "apple" | "google") {
    setMagicLinkStatus("verifying");
    setMagicLinkMessage("");

    try {
      const signedIn = await (provider === "apple"
        ? actions.signInWithApple()
        : actions.signInWithGoogle());
      setMagicLinkStatus("idle");
      // Only advance when a session was actually created. Cancelling the
      // browser must leave the parent right here, not fake a login.
      if (signedIn) {
        onSignedIn?.();
      }
    } catch (error) {
      setMagicLinkStatus("error");
      setMagicLinkMessage(
        error instanceof Error ? error.message : "Could not sign in.",
      );
    }
  }

  async function handleSendMagicLink() {
    setMagicLinkStatus("sending");
    setMagicLinkMessage("");

    try {
      await actions.sendMagicLink(email);
      setMagicLinkStatus("sent");
      setMagicLinkMessage("Check your email for the Chorey sign-in link.");
    } catch (error) {
      setMagicLinkStatus("error");
      setMagicLinkMessage(
        error instanceof Error ? error.message : "Could not send magic link.",
      );
    }
  }

  async function handleVerifyOtp() {
    setMagicLinkStatus("verifying");
    setMagicLinkMessage("");

    try {
      await actions.verifyEmailOtp(email, otpCode);
      setMagicLinkStatus("verified");
      setMagicLinkMessage("Signed in.");
      onSignedIn?.();
    } catch (error) {
      setMagicLinkStatus("error");
      setMagicLinkMessage(
        error instanceof Error ? error.message : "Could not verify code.",
      );
    }
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: scheme.bgPage }}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "space-between",
        padding: choreyTheme.spacing.xl,
        gap: choreyTheme.spacing.xxl,
      }}
    >
      <View style={{ gap: choreyTheme.spacing.lg }}>
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
              color: scheme.fgFaint,
              fontSize: 13,
              fontWeight: "800",
            }}
          >
            Chorey
          </Text>
          <Text
            selectable
            style={{
              color: scheme.fg,
              fontSize: 34,
              fontWeight: "800",
              letterSpacing: 0,
            }}
          >
            Parent sign in
          </Text>
          <Text
            selectable
            style={{
              color: scheme.fgFaint,
              fontSize: 16,
              lineHeight: 24,
            }}
          >
            Create your household, approve chores, and keep the 40 / 40 / 20
            rhythm clear.
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
          <SocialAuthButtons
            onApple={() => handleOAuth("apple")}
            onGoogle={() => handleOAuth("google")}
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
              color: scheme.fgFaint,
              fontSize: 14,
              fontWeight: "700",
            }}
          >
            Magic link
          </Text>
          <TextInput
            accessibilityLabel="Email address"
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send magic link"
            disabled={magicLinkStatus === "sending"}
            onPress={handleSendMagicLink}
            style={({ pressed }) => ({
              alignItems: "center",
              backgroundColor: pressed
                ? palette.accent[800]
                : palette.accent[600],
              borderColor: palette.accent[800],
              borderRadius: choreyTheme.radii.pill,
              borderWidth: 1,
              paddingVertical: 15,
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
              {magicLinkStatus === "sending" ? "Sending link" : "Send magic link"}
            </Text>
          </Pressable>
          {magicLinkMessage ? (
            <Text
              selectable
              style={{
                color:
                  magicLinkStatus === "error"
                    ? palette.semantic.danger[600]
                    : scheme.fgFaint,
                fontSize: 14,
                lineHeight: 20,
              }}
            >
              {magicLinkMessage}
            </Text>
          ) : null}
          {magicLinkStatus === "sent" ||
          magicLinkStatus === "verifying" ||
          magicLinkStatus === "verified" ? (
            <View style={{ gap: choreyTheme.spacing.md }}>
              <TextInput
                accessibilityLabel="Magic link code"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="one-time-code"
                onChangeText={(v) => setOtpCode(v.replace(/\s/g, ""))}
                placeholder="Verification code"
                placeholderTextColor={scheme.fgFaint}
                style={{
                  borderRadius: choreyTheme.radii.md,
                  borderColor: scheme.border,
                  borderWidth: 1,
                  backgroundColor: scheme.bgModal,
                  color: scheme.fg,
                  fontSize: 16,
                  fontVariant: ["tabular-nums"],
                  paddingHorizontal: choreyTheme.spacing.lg,
                  paddingVertical: 15,
                }}
              />
              <Pressable
                accessibilityLabel="Verify magic link code"
                accessibilityRole="button"
                disabled={magicLinkStatus === "verifying"}
                onPress={handleVerifyOtp}
                style={({ pressed }) => ({
                  alignItems: "center",
                  backgroundColor: pressed
                    ? scheme.tint.allowance
                    : scheme.bgRaised,
                  borderRadius: choreyTheme.radii.pill,
                  borderColor: scheme.borderHover,
                  borderWidth: 1,
                  paddingVertical: 15,
                })}
              >
                <Text
                  style={{
                    color: scheme.fg,
                    fontSize: 16,
                    fontWeight: "800",
                  }}
                >
                  {magicLinkStatus === "verifying" ? "Verifying" : "Verify code"}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>

      <View style={{ gap: choreyTheme.spacing.md }}>
        <LegalConsent />
        <Text
          selectable
          style={{
            color: scheme.fgFaint,
            fontSize: 13,
            lineHeight: 19,
            textAlign: "center",
          }}
        >
          Children use a parent-linked profile.
        </Text>
      </View>
    </ScrollView>
  );
}
