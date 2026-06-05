import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ChevronRight, Heart, Lock, Sparkles, Wallet } from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { buckets as bucketTokens } from "@/theme/chorey-theme";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  type CurrencyCode,
} from "@/features/money/currency";

type Props = {
  name?: string;
  age?: number | null;
  currency?: CurrencyCode;
  savingsCents?: number;
  givingCents?: number;
  causeName?: string | null;
  givenCents?: number;
  onMarkGiven?: () => void;
  onSuggestCause?: (name: string) => void;
  onSeeEarnings?: () => void;
  onTellParent?: () => void;
};

export function KidYouScreen({
  name = "there",
  age,
  currency = DEFAULT_CURRENCY,
  savingsCents = 0,
  givingCents = 0,
  causeName,
  givenCents = 0,
  onMarkGiven,
  onSuggestCause,
  onSeeEarnings,
  onTellParent,
}: Props) {
  const { scheme, typography, radius, bucketInk } = useChoreyTheme();
  const savings = bucketTokens.savings.ramp;
  const giving = bucketTokens.giving.ramp;
  const allowance = bucketTokens.spend.ramp;
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const [suggesting, setSuggesting] = useState(false);

  const quickActions = [
    { label: "Suggest a cause", Icon: Heart, onPress: () => setSuggesting(true) },
    { label: "See all earnings", Icon: Wallet, onPress: onSeeEarnings },
    { label: "Tell a parent something", Icon: Sparkles, onPress: onTellParent },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: scheme.bgPage }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 120 }}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: 12 }}>
          <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>Profile</Text>
          <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 32, marginTop: 2 }]}>
            You.
          </Text>
        </View>

        {/* Avatar row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            paddingHorizontal: 22,
            paddingBottom: 18,
          }}
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: radius.pill,
              backgroundColor: allowance[200],
              borderColor: scheme.border,
              borderWidth: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: typography.family.display.semibold,
                fontSize: 26,
                color: allowance[800],
              }}
            >
              {initial}
            </Text>
          </View>
          <View>
            <Text style={[typography.text.h3, { color: scheme.fg, fontSize: 17 }]}>{name}</Text>
            {typeof age === "number" ? (
              <Text style={[typography.text.caption, { color: scheme.fgFaint }]}>
                {age} years old
              </Text>
            ) : null}
          </View>
        </View>

        {/* Savings + Giving */}
        <View
          style={{
            marginHorizontal: 18,
            backgroundColor: scheme.bgRaised,
            borderColor: scheme.border,
            borderWidth: 1,
            borderRadius: 18,
            overflow: "hidden",
          }}
        >
          {/* Savings (locked) */}
          <View
            style={{
              paddingHorizontal: 18,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: scheme.border,
            }}
          >
            <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>
              Savings (locked)
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginTop: 4,
              }}
            >
              <Text style={[typography.text.moneyHero, { color: bucketInk("savings"), fontSize: 36 }]}>
                {formatMoney(savingsCents, currency)}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: radius.pill,
                  backgroundColor: scheme.tint.savings,
                }}
              >
                <Lock size={11} color={savings[600]} strokeWidth={2.4} />
                <Text style={[typography.text.caption, { color: savings[600], fontWeight: "700" }]}>
                  not spendable
                </Text>
              </View>
            </View>
          </View>

          {/* Giving */}
          <View style={{ paddingHorizontal: 18, paddingVertical: 16 }}>
            <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>Giving</Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginTop: 4,
              }}
            >
              <Text style={[typography.text.moneyHero, { color: bucketInk("giving"), fontSize: 36 }]}>
                {formatMoney(givingCents, currency)}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Mark as given"
                onPress={onMarkGiven}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: radius.pill,
                  backgroundColor: pressed ? giving[200] : giving[400],
                })}
              >
                <Heart size={13} color={giving[800]} strokeWidth={2.6} />
                <Text style={[typography.text.label, { color: giving[800], fontSize: 13 }]}>
                  Mark as given
                </Text>
              </Pressable>
            </View>
            {causeName ? (
              <View
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: radius.sm,
                  backgroundColor: scheme.tint.giving,
                }}
              >
                <Text style={[typography.text.caption, { color: scheme.fg }]}>
                  <Text style={{ fontWeight: "700" }}>Saving up to give to:</Text> {causeName} —{" "}
                  {formatMoney(givenCents, currency)} given so far.
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Quick actions */}
        <Text
          style={[
            typography.text.overline,
            { color: scheme.fgFaint, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 8 },
          ]}
        >
          Quick actions
        </Text>
        <View
          style={{
            marginHorizontal: 18,
            backgroundColor: scheme.bgRaised,
            borderColor: scheme.border,
            borderWidth: 1,
            borderRadius: radius.md,
            overflow: "hidden",
          }}
        >
          {quickActions.map((action, index) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={action.onPress}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: index < quickActions.length - 1 ? 1 : 0,
                borderBottomColor: scheme.border,
              }}
            >
              <action.Icon size={18} color={scheme.fgMuted} strokeWidth={2} />
              <Text style={[typography.text.label, { flex: 1, color: scheme.fg }]}>
                {action.label}
              </Text>
              <ChevronRight size={16} color={scheme.fgFaint} strokeWidth={2} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <SuggestCauseSheet
        visible={suggesting}
        onClose={() => setSuggesting(false)}
        onConfirm={(causeName) => {
          onSuggestCause?.(causeName);
          setSuggesting(false);
        }}
      />
    </View>
  );
}

function SuggestCauseSheet({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}) {
  const { scheme, typography, palette, radius } = useChoreyTheme();
  const giving = bucketTokens.giving.ramp;
  const [name, setName] = useState("");
  const canSave = name.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        accessibilityLabel="Dismiss"
        onPress={() => {
          setName("");
          onClose();
        }}
        style={{ flex: 1, backgroundColor: "rgba(42, 32, 24, 0.32)" }}
      />
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: scheme.bgModal,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 22,
          paddingTop: 14,
          paddingBottom: 30,
          ...scheme.shadow.lg,
        }}
      >
        <View
          style={{
            width: 38,
            height: 4,
            borderRadius: radius.pill,
            backgroundColor: palette.border.strong,
            alignSelf: "center",
            marginBottom: 16,
          }}
        />
        <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 24, marginBottom: 6 }]}>
          Suggest a cause.
        </Text>
        <Text style={[typography.text.bodySm, { color: scheme.fgMuted, marginBottom: 16 }]}>
          A parent approves it before you can give to it.
        </Text>

        <TextInput
          accessibilityLabel="Cause name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Animal shelter"
          placeholderTextColor={scheme.fgFaint}
          style={{
            backgroundColor: scheme.bgPage,
            borderColor: palette.border.mid,
            borderWidth: 1,
            borderRadius: radius.sm,
            paddingHorizontal: 14,
            paddingVertical: 11,
            fontFamily: typography.family.body.regular,
            fontSize: 15,
            color: scheme.fg,
            marginBottom: 20,
          }}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send suggestion"
          accessibilityState={{ disabled: !canSave }}
          disabled={!canSave}
          onPress={() => {
            onConfirm(name.trim());
            setName("");
          }}
          style={({ pressed }) => ({
            alignItems: "center",
            paddingVertical: 14,
            borderRadius: radius.pill,
            backgroundColor: canSave
              ? pressed
                ? giving[400]
                : giving[200]
              : scheme.bgSunken,
            opacity: canSave ? 1 : 0.6,
          })}
        >
          <Text
            style={[
              typography.text.label,
              { color: canSave ? giving[800] : scheme.fgFaint, fontSize: 15 },
            ]}
          >
            Send to a parent
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}
