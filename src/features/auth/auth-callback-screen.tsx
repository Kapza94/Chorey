import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { choreyTheme } from "@/theme/chorey-theme";
import { useChoreyTheme } from "@/theme/use-chorey-theme";

export type AuthCallbackActions = {
  /** Trade the magic-link `code` for a session. Throws on failure. */
  exchangeCode: (code: string) => Promise<void>;
};

export type AuthCallbackScreenProps = {
  /** The `code` query param from the deep link, if present. */
  code?: string;
  /** An error surfaced by the provider/link (e.g. expired), if any. */
  errorMessage?: string;
  actions: AuthCallbackActions;
  /** Called once the session is established. */
  onSignedIn: () => void;
  /** Called when the user taps "Back to sign in" after a failure. */
  onBackToSignIn: () => void;
};

const EXPIRED_MESSAGE = "This sign-in link is invalid or has expired.";

/** A failure we can tell immediately from the deep link, before any exchange. */
function immediateFailure(code?: string, errorMessage?: string): string | null {
  if (errorMessage) return errorMessage;
  if (!code) return EXPIRED_MESSAGE;
  return null;
}

/**
 * Handles the `/auth/callback` deep link the parent lands on after tapping the
 * confirmation link in their email. Exchanges the `code` for a session, then
 * hands off to the app. Previously this screen only displayed a spinner and
 * never completed the exchange — so email-link sign-in looped forever.
 */
export function AuthCallbackScreen({
  code,
  errorMessage,
  actions,
  onSignedIn,
  onBackToSignIn,
}: AuthCallbackScreenProps) {
  const { scheme, palette } = useChoreyTheme();
  const [failure, setFailure] = useState<string | null>(() =>
    immediateFailure(code, errorMessage),
  );
  // Guard against the effect running its async work twice (e.g. Strict Mode).
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Nothing to exchange when we already know it failed (no code / link error).
    if (!code || errorMessage) return;

    let active = true;
    actions
      .exchangeCode(code)
      .then(() => {
        if (active) onSignedIn();
      })
      .catch(() => {
        if (active) {
          setFailure(EXPIRED_MESSAGE);
        }
      });

    return () => {
      active = false;
    };
  }, [actions, code, errorMessage, onSignedIn]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: scheme.bgPage }}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        padding: choreyTheme.spacing.xl,
        gap: choreyTheme.spacing.md,
      }}
    >
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
          accessibilityRole="header"
          selectable
          style={{ color: scheme.fg, fontSize: 28, fontWeight: "800" }}
        >
          {failure ? "Sign in didn't work" : "Finishing sign in"}
        </Text>
        <Text
          selectable
          style={{ color: scheme.fgFaint, fontSize: 16, lineHeight: 24 }}
        >
          {failure ?? "Chorey is checking your parent session."}
        </Text>

        {failure ? (
          <Pressable
            accessibilityLabel="Back to sign in"
            accessibilityRole="button"
            onPress={onBackToSignIn}
            style={({ pressed }) => ({
              backgroundColor: pressed ? palette.accent[800] : palette.accent[600],
              borderRadius: choreyTheme.radii.pill,
              marginTop: choreyTheme.spacing.sm,
              paddingHorizontal: choreyTheme.spacing.xl,
              paddingVertical: 14,
              alignSelf: "flex-start",
            })}
          >
            <Text
              style={{
                color: palette.cream[4],
                fontFamily: choreyTheme.typography.family.body.bold,
                fontSize: 16,
              }}
            >
              Back to sign in
            </Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}
