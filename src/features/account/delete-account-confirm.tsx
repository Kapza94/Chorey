import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { AlertTriangle, ChevronLeft } from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";

type Props = {
  /** Performs the deletion. Resolves on success; rejects with a user-safe message. */
  onConfirm: () => Promise<void> | void;
  /** Return to the account menu (Cancel). */
  onBack: () => void;
};

/**
 * Destructive confirmation for account deletion. Pure: the actual delete is
 * injected via `onConfirm`. Spells out exactly what is lost, with a sending
 * state and inline errors. Lives behind a deliberate two-step (menu -> here ->
 * confirm) so it can't be triggered by a single mistaken tap.
 */
export function DeleteAccountConfirm({ onConfirm, onBack }: Props) {
  const { scheme, typography, palette, radius, toybox } = useChoreyTheme();
  const danger = palette.semantic.danger;

  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (deleting) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't delete your account — please try again.");
      setDeleting(false);
    }
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} hitSlop={8}>
          <ChevronLeft size={22} color={scheme.fgMuted} strokeWidth={2.2} />
        </Pressable>
        <Text
          style={{
            fontFamily: typography.family.display.extra,
            fontSize: 21,
            letterSpacing: -0.5,
            color: scheme.fg,
          }}
        >
          Delete account
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: 10,
          backgroundColor: scheme.bgRaised,
          borderColor: danger[600],
          borderWidth: toybox.borderWidth,
          borderRadius: 14,
          padding: 14,
        }}
      >
        <AlertTriangle size={20} color={danger[600]} strokeWidth={2.2} style={{ marginTop: 1 }} />
        <Text style={[typography.text.bodySm, { color: scheme.fg, flex: 1, lineHeight: 21 }]}>
          This permanently deletes your household — every child profile, all chores,
          balances, and history. It cannot be undone. If you have an active
          subscription, cancel it in the App Store separately.
        </Text>
      </View>

      {error ? (
        <Text style={[typography.text.caption, { color: danger[600] }]}>{error}</Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Delete my account"
        accessibilityState={{ disabled: deleting }}
        onPress={confirm}
        disabled={deleting}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingVertical: 14,
          borderRadius: radius.pill,
          opacity: deleting ? 0.6 : pressed ? 0.85 : 1,
          backgroundColor: danger[600],
        })}
      >
        {deleting ? <ActivityIndicator size="small" color={palette.cream[4]} /> : null}
        <Text style={[typography.text.label, { color: palette.cream[4], fontSize: 15 }]}>
          {deleting ? "Deleting…" : "Delete my account"}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cancel"
        onPress={onBack}
        disabled={deleting}
        style={{ alignItems: "center", paddingVertical: 12 }}
      >
        <Text style={[typography.text.label, { color: scheme.fgMuted, fontSize: 14 }]}>Cancel</Text>
      </Pressable>
    </View>
  );
}
