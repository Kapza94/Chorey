import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { AppleIcon, GoogleIcon } from "@/components/brand-icons";
import { choreyTheme } from "@/theme/chorey-theme";

export type ParentSignInActions = {
  signInWithApple(): void;
  signInWithGoogle(): void;
  sendMagicLink(email: string): void | Promise<void>;
  verifyEmailOtp(email: string, token: string): void | Promise<void>;
};

const noopActions: ParentSignInActions = {
  signInWithApple() {},
  signInWithGoogle() {},
  sendMagicLink() {},
  verifyEmailOtp() {},
};

function AuthButton({
  label,
  variant,
  onPress,
}: {
  label: string;
  variant: "apple" | "google";
  onPress: () => void;
}) {
  const isApple = variant === "apple";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: "center",
        borderRadius: choreyTheme.radii.pill,
        backgroundColor: isApple
          ? "#11100F"
          : pressed
            ? choreyTheme.colors.primarySoft
            : choreyTheme.colors.surface,
        borderColor: isApple ? "#11100F" : choreyTheme.colors.borderSoft,
        borderWidth: 1,
        flexDirection: "row",
        minHeight: 48,
        paddingHorizontal: 18,
        paddingVertical: 13,
      })}
    >
      <View style={{ width: 24, alignItems: "center" }}>
        {isApple ? <AppleIcon /> : <GoogleIcon />}
      </View>
      <View style={{ flex: 1, alignItems: "center", paddingRight: 24 }}>
        <Text
          style={{
            color: isApple ? choreyTheme.colors.cream1 : "#3C4043",
            fontSize: 16,
            fontWeight: "700",
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function ParentSignInScreen({
  actions = noopActions,
  onSignedIn,
}: {
  actions?: ParentSignInActions;
  onSignedIn?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [magicLinkStatus, setMagicLinkStatus] = useState<
    "idle" | "sending" | "sent" | "verifying" | "verified" | "error"
  >("idle");
  const [magicLinkMessage, setMagicLinkMessage] = useState("");

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
      style={{ flex: 1, backgroundColor: choreyTheme.colors.cream2 }}
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
            backgroundColor: choreyTheme.colors.surfaceWarm,
            borderColor: choreyTheme.colors.borderSoft,
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
              color: choreyTheme.colors.inkMuted,
              fontSize: 13,
              fontWeight: "800",
            }}
          >
            Chorey
          </Text>
          <Text
            selectable
            style={{
              color: choreyTheme.colors.ink1,
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
              color: choreyTheme.colors.inkMuted,
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
            backgroundColor: choreyTheme.colors.surface,
            borderColor: choreyTheme.colors.borderSoft,
            borderRadius: choreyTheme.radii.lg,
            borderWidth: 1,
            gap: choreyTheme.spacing.md,
            padding: choreyTheme.spacing.lg,
            ...choreyTheme.shadows.card,
          }}
        >
          <AuthButton
            label="Continue with Apple"
            variant="apple"
            onPress={actions.signInWithApple}
          />
          <AuthButton
            label="Continue with Google"
            variant="google"
            onPress={actions.signInWithGoogle}
          />
        </View>

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
              color: choreyTheme.colors.inkMuted,
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send magic link"
            disabled={magicLinkStatus === "sending"}
            onPress={handleSendMagicLink}
            style={({ pressed }) => ({
              alignItems: "center",
              backgroundColor: pressed
                ? choreyTheme.colors.primaryPressed
                : choreyTheme.colors.primary,
              borderColor: choreyTheme.colors.primaryPressed,
              borderRadius: choreyTheme.radii.pill,
              borderWidth: 1,
              paddingVertical: 15,
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
              {magicLinkStatus === "sending" ? "Sending link" : "Send magic link"}
            </Text>
          </Pressable>
          {magicLinkMessage ? (
            <Text
              selectable
              style={{
                color:
                  magicLinkStatus === "error"
                    ? choreyTheme.colors.danger
                    : choreyTheme.colors.inkMuted,
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
                keyboardType="number-pad"
                onChangeText={setOtpCode}
                placeholder="6-digit code"
                placeholderTextColor={choreyTheme.colors.inkMuted}
                style={{
                  borderRadius: choreyTheme.radii.md,
                  borderColor: choreyTheme.colors.borderSoft,
                  borderWidth: 1,
                  backgroundColor: choreyTheme.colors.surface,
                  color: choreyTheme.colors.ink1,
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
                    ? choreyTheme.colors.primarySoft
                    : choreyTheme.colors.surfaceWarm,
                  borderRadius: choreyTheme.radii.pill,
                  borderColor: choreyTheme.colors.borderMedium,
                  borderWidth: 1,
                  paddingVertical: 15,
                })}
              >
                <Text
                  style={{
                    color: choreyTheme.colors.ink1,
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

      <Text
        selectable
        style={{
          color: choreyTheme.colors.inkMuted,
          fontSize: 13,
          lineHeight: 19,
          textAlign: "center",
        }}
      >
        Children use a parent-linked profile.
      </Text>
    </ScrollView>
  );
}
