import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ChevronRight, Heart, Lock, LogOut } from "lucide-react-native";

import { useKeyboardHeight } from "@/components/use-keyboard-height";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { buckets as bucketTokens } from "@/theme/chorey-theme";
import { ToyAvatar, ToySticker } from "@/components/toybox";
import { fieldStyle } from "@/components/field-style";
import { levelForPoints } from "@/features/game/leveling";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  type CurrencyCode,
} from "@/features/money/currency";
import type { KidWish } from "@/features/kid-home/kid-wishlist-screen";

type Props = {
  name?: string;
  age?: number | null;
  currency?: CurrencyCode;
  savingsCents?: number;
  givingCents?: number;
  causeName?: string | null;
  /** the things the kid is saving toward — surfaced under Savings */
  wishes?: KidWish[];
  /** lifetime game points — shows the level sticker on the profile */
  totalPoints?: number;
  onSuggestCause?: (name: string) => void;
  onLogOut?: () => void;
};

export function KidYouScreen({
  name = "there",
  age,
  currency = DEFAULT_CURRENCY,
  savingsCents = 0,
  givingCents = 0,
  causeName,
  wishes = [],
  totalPoints = 0,
  onSuggestCause,
  onLogOut,
}: Props) {
  const { scheme, typography, radius, toybox, bucketInk } = useChoreyTheme();
  const savings = bucketTokens.savings.ramp;
  const giving = bucketTokens.giving.ramp;
  const [suggesting, setSuggesting] = useState(false);
  // Only wishes still worth saving for — bought/requested ones drop off.
  const savingFor = wishes.filter((wish) => wish.status === "active");

  // Only wired actions ship on the kid surface — no dead buttons.
  const quickActions = [
    { label: "Suggest a cause", Icon: Heart, onPress: () => setSuggesting(true) },
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
          <Text
            style={{
              fontFamily: typography.family.display.extra,
              fontSize: 34,
              letterSpacing: -0.8,
              color: scheme.fg,
              marginTop: 2,
            }}
          >
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
          <ToyAvatar name={name} tone="spend" size={60} />
          <View style={{ gap: 4 }}>
            <Text style={[typography.text.h3, { color: scheme.fg, fontSize: 17 }]}>{name}</Text>
            {typeof age === "number" ? (
              <Text style={[typography.text.caption, { color: scheme.fgFaint }]}>
                {age} years old
              </Text>
            ) : null}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ToySticker label={`Level ${levelForPoints(totalPoints)}`} tone="savings" straight />
              <Text style={[typography.text.caption, { color: scheme.fgMuted }]}>
                {totalPoints} lifetime points
              </Text>
            </View>
          </View>
        </View>

        {/* Savings + Giving */}
        <View
          style={{
            marginHorizontal: 18,
            backgroundColor: scheme.bgModal,
            borderColor: scheme.toy.border,
            borderWidth: toybox.borderWidth,
            borderRadius: toybox.radius,
            overflow: "hidden",
            ...scheme.toy.shadow,
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

            {/* Savings isn't for one thing — it's the pile behind everything on
                the wishlist. Surface those wishes here so it feels purposeful. */}
            {savingFor.length > 0 ? (
              <View style={{ marginTop: 14, gap: 8 }}>
                <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>
                  Saving for
                </Text>
                {savingFor.map((wish) => (
                  <View
                    key={wish.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <Text
                      style={[typography.text.label, { flex: 1, color: scheme.fg, fontSize: 14 }]}
                      numberOfLines={1}
                    >
                      {wish.name}
                    </Text>
                    <Text style={[typography.text.caption, { color: savings[600], fontWeight: "700" }]}>
                      {formatMoney(wish.targetCents, currency)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[typography.text.caption, { color: scheme.fgMuted, marginTop: 12 }]}>
                Add things to your Wishlist — your savings grow toward all of them.
              </Text>
            )}
          </View>

          {/* Giving — a parent confirms the handoff at settlement, not the kid. */}
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
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: radius.pill,
                  backgroundColor: scheme.tint.giving,
                }}
              >
                <Heart size={11} color={giving[600]} strokeWidth={2.4} />
                <Text style={[typography.text.caption, { color: giving[600], fontWeight: "700" }]}>
                  for your cause
                </Text>
              </View>
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
                  <Text style={{ fontWeight: "700" }}>Giving goes to:</Text> {causeName}. You
                  hand it over together with a parent.
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
            backgroundColor: scheme.bgModal,
            borderColor: scheme.toy.border,
            borderWidth: toybox.borderWidth,
            borderRadius: radius.md,
            overflow: "hidden",
            ...scheme.toy.shadowSm,
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

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log out"
          onPress={onLogOut}
          style={({ pressed }) => ({
            marginHorizontal: 18,
            marginTop: 18,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 14,
            borderRadius: radius.md,
            backgroundColor: pressed ? scheme.bgSunken : scheme.bgModal,
            borderColor: scheme.toy.border,
            borderWidth: toybox.borderWidth,
            ...(pressed ? {} : scheme.toy.shadowSm),
          })}
        >
          <LogOut size={17} color={scheme.fgMuted} strokeWidth={2.2} />
          <Text style={[typography.text.label, { color: scheme.fgMuted, fontSize: 15 }]}>
            Log out
          </Text>
        </Pressable>
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
  const keyboardHeight = useKeyboardHeight();
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
          bottom: keyboardHeight,
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
          style={[fieldStyle(scheme, typography.family.body.regular), { marginBottom: 20 }]}
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
