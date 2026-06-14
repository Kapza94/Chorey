import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { Check, ChevronLeft, Send } from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import {
  MAX_FEEDBACK_LENGTH,
  validateFeedbackMessage,
  type FeedbackKind,
} from "@/features/feedback/feedback";

type Props = {
  kind: FeedbackKind;
  /** Persists the message. Resolves on success; rejects with a user-safe message. */
  onSubmit: (message: string) => Promise<void>;
  /** Return to the account menu (also the "Done" action after sending). */
  onBack?: () => void;
};

const COPY: Record<FeedbackKind, { title: string; subtitle: string; placeholder: string; cta: string }> = {
  contact: {
    title: "Contact us",
    subtitle: "Tell us what you need — we usually reply within a day.",
    placeholder: "What can we help with?",
    cta: "Send request",
  },
  feedback: {
    title: "Send feedback",
    subtitle: "Ideas, wishes, gripes — it comes straight to the team.",
    placeholder: "What's on your mind?",
    cta: "Send feedback",
  },
};

/**
 * A small open-text form for the account sheet — one field, one send. Pure: all
 * persistence is injected via `onSubmit`, so it renders and tests without a
 * Supabase client. Shows a sending spinner, inline errors, and a thank-you.
 */
export function FeedbackForm({ kind, onSubmit, onBack }: Props) {
  const { scheme, typography, palette, radius, toybox } = useChoreyTheme();
  const copy = COPY[kind];

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const valid = validateFeedbackMessage(message).ok;

  async function send() {
    if (!valid || sending) {
      return;
    }
    setSending(true);
    setError(null);
    try {
      await onSubmit(message);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <View style={{ alignItems: "center", paddingVertical: 26, gap: 12 }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: radius.pill,
            backgroundColor: scheme.tint.allowance,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Check size={26} color={palette.accent[600]} strokeWidth={2.6} />
        </View>
        <Text style={[typography.text.h2, { color: scheme.fg, textAlign: "center" }]}>
          Thank you!
        </Text>
        <Text
          style={[
            typography.text.bodySm,
            { color: scheme.fgMuted, textAlign: "center", lineHeight: 21, paddingHorizontal: 12 },
          ]}
        >
          {kind === "contact"
            ? "We've got your message and will get back to you soon."
            : "We read every note — thank you for helping shape Chorey."}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Done"
          onPress={onBack}
          style={({ pressed }) => ({
            alignSelf: "stretch",
            alignItems: "center",
            marginTop: 6,
            paddingVertical: 14,
            borderRadius: radius.pill,
            backgroundColor: pressed ? palette.accent[800] : palette.accent[600],
          })}
        >
          <Text style={[typography.text.label, { color: palette.cream[4], fontSize: 15 }]}>Done</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={onBack}
            hitSlop={8}
          >
            <ChevronLeft size={22} color={scheme.fgMuted} strokeWidth={2.2} />
          </Pressable>
        ) : null}
        <Text
          style={{
            fontFamily: typography.family.display.extra,
            fontSize: 21,
            letterSpacing: -0.5,
            color: scheme.fg,
          }}
        >
          {copy.title}
        </Text>
      </View>

      <Text style={[typography.text.bodySm, { color: scheme.fgMuted, lineHeight: 21 }]}>
        {copy.subtitle}
      </Text>

      <TextInput
        accessibilityLabel={`${copy.title} message`}
        value={message}
        onChangeText={(next) => {
          setMessage(next);
          if (error) {
            setError(null);
          }
        }}
        placeholder={copy.placeholder}
        placeholderTextColor={scheme.fgFaint}
        multiline
        maxLength={MAX_FEEDBACK_LENGTH}
        textAlignVertical="top"
        style={{
          minHeight: 120,
          backgroundColor: scheme.bgRaised,
          borderColor: scheme.toy.border,
          borderWidth: toybox.borderWidth,
          borderRadius: 14,
          padding: 14,
          color: scheme.fg,
          fontFamily: typography.family.body.regular,
          fontSize: 15,
          lineHeight: 21,
        }}
      />

      {error ? (
        <Text style={[typography.text.caption, { color: palette.semantic.danger[600] }]}>
          {error}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.cta}
        accessibilityState={{ disabled: !valid || sending }}
        onPress={send}
        disabled={!valid || sending}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingVertical: 14,
          borderRadius: radius.pill,
          opacity: !valid || sending ? 0.5 : 1,
          backgroundColor: pressed ? palette.accent[800] : palette.accent[600],
        })}
      >
        {sending ? (
          <ActivityIndicator size="small" color={palette.cream[4]} />
        ) : (
          <Send size={16} color={palette.cream[4]} strokeWidth={2.4} />
        )}
        <Text style={[typography.text.label, { color: palette.cream[4], fontSize: 15 }]}>
          {copy.cta}
        </Text>
      </Pressable>
    </View>
  );
}
