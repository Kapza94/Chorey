import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Plus } from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { buckets as bucketTokens } from "@/theme/chorey-theme";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  type CurrencyCode,
} from "@/features/money/currency";
import { parseRewardCents } from "@/features/chores/money";

export type KidWish = {
  id: string;
  name: string;
  targetCents: number;
  /** active = can be requested when affordable; requested = awaiting parent; purchased = bought */
  status: "active" | "requested" | "purchased";
};

type Props = {
  currency?: CurrencyCode;
  /** the kid's current Spend (allowance) balance — "spendable now" */
  spendableCents?: number;
  wishes?: KidWish[];
  onRequestPurchase?: (wishId: string) => void;
  onAddWish?: (input: { name: string; targetCents: number }) => void;
};

export function KidWishlistScreen({
  currency = DEFAULT_CURRENCY,
  spendableCents = 0,
  wishes = [],
  onRequestPurchase,
  onAddWish,
}: Props) {
  const { scheme, typography, palette, radius, toybox, bucketInk } = useChoreyTheme();
  const allowance = bucketTokens.spend.ramp;
  const [adding, setAdding] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: scheme.bgPage }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 120 }}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: 6 }}>
          <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>
            What you&apos;re saving for
          </Text>
          <Text
            style={{
              fontFamily: typography.family.display.extra,
              fontSize: 34,
              letterSpacing: -0.8,
              color: scheme.fg,
              marginTop: 2,
            }}
          >
            Wishlist.
          </Text>
        </View>

        {/* Spendable now */}
        <View
          style={{
            marginHorizontal: 18,
            marginTop: 8,
            backgroundColor: scheme.bgModal,
            borderColor: scheme.toy.border,
            borderWidth: toybox.borderWidth,
            borderRadius: toybox.radius,
            paddingHorizontal: 16,
            paddingVertical: 14,
            ...scheme.toy.shadow,
          }}
        >
          <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>
            Spendable now
          </Text>
          <Text
            style={[
              typography.text.moneyHero,
              { color: bucketInk("spend"), fontSize: 38, marginTop: 4 },
            ]}
          >
            {formatMoney(spendableCents, currency)}
          </Text>
        </View>

        {/* Count */}
        <Text
          style={[
            typography.text.overline,
            { color: scheme.fgFaint, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 10 },
          ]}
        >
          {wishes.length} {wishes.length === 1 ? "wish" : "wishes"}
        </Text>

        {/* Wishes */}
        <View style={{ gap: 10, paddingHorizontal: 18 }}>
          {wishes.map((wish) => {
            const pct =
              wish.targetCents > 0
                ? Math.min(100, Math.round((spendableCents / wish.targetCents) * 100))
                : 0;
            const affordable = spendableCents >= wish.targetCents;

            return (
              <View
                key={wish.id}
                style={{
                  backgroundColor: scheme.bgModal,
                  borderColor: scheme.toy.border,
                  borderWidth: toybox.borderWidth,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  gap: 10,
                  ...scheme.toy.shadowSm,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.text.h3, { color: scheme.fg, fontSize: 15 }]}>
                      {wish.name}
                    </Text>
                    <Text
                      style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 2 }]}
                    >
                      {formatMoney(spendableCents, currency)} of{" "}
                      {formatMoney(wish.targetCents, currency)}
                    </Text>
                  </View>

                  {wish.status === "requested" ? (
                    <View
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: radius.pill,
                        backgroundColor: scheme.tint.warning,
                      }}
                    >
                      <Text
                        style={[
                          typography.text.label,
                          { color: palette.semantic.warning[600], fontSize: 13 },
                        ]}
                      >
                        Requested
                      </Text>
                    </View>
                  ) : affordable && wish.status === "active" ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Request ${wish.name}`}
                      onPress={() => onRequestPurchase?.(wish.id)}
                      style={({ pressed }) => ({
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: radius.pill,
                        backgroundColor: pressed ? palette.accent[800] : palette.accent[600],
                      })}
                    >
                      <Text
                        style={[
                          typography.text.label,
                          { color: palette.cream[4], fontSize: 13 },
                        ]}
                      >
                        Request
                      </Text>
                    </Pressable>
                  ) : (
                    <Text
                      style={[
                        typography.text.h1,
                        { color: scheme.fg, fontSize: 22 },
                      ]}
                    >
                      {pct}%
                    </Text>
                  )}
                </View>

                {/* Progress bar — funded from the Spend bucket (peach). */}
                <View
                  style={{
                    height: 6,
                    backgroundColor: scheme.bgSunken,
                    borderRadius: radius.pill,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      backgroundColor: allowance[400],
                      borderRadius: radius.pill,
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Add a wish */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add a wish"
          onPress={() => setAdding(true)}
          style={{
            marginHorizontal: 18,
            marginTop: 18,
            paddingVertical: 14,
            borderRadius: radius.md,
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: scheme.borderHover,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Plus size={16} color={scheme.fgMuted} strokeWidth={2} />
          <Text style={[typography.text.label, { color: scheme.fgMuted }]}>Add a wish</Text>
        </Pressable>
      </ScrollView>

      <AddWishSheet
        visible={adding}
        currency={currency}
        onClose={() => setAdding(false)}
        onConfirm={(input) => {
          onAddWish?.(input);
          setAdding(false);
        }}
      />
    </View>
  );
}

function AddWishSheet({
  visible,
  currency,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  currency: CurrencyCode;
  onClose: () => void;
  onConfirm: (input: { name: string; targetCents: number }) => void;
}) {
  const { scheme, typography, palette, radius } = useChoreyTheme();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");

  let targetCents = 0;
  try {
    targetCents = parseRewardCents(target);
  } catch {
    targetCents = 0;
  }
  const canSave = name.trim().length > 0 && targetCents > 0;

  const reset = () => {
    setName("");
    setTarget("");
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        accessibilityLabel="Dismiss"
        onPress={() => {
          reset();
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
        <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 24, marginBottom: 16 }]}>
          Add a wish.
        </Text>

        <Text style={[typography.text.overline, { color: scheme.fgFaint, marginBottom: 6 }]}>
          What do you want?
        </Text>
        <TextInput
          accessibilityLabel="Wish name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Skateboard"
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
            marginBottom: 14,
          }}
        />

        <Text style={[typography.text.overline, { color: scheme.fgFaint, marginBottom: 6 }]}>
          How much is it?
        </Text>
        <TextInput
          accessibilityLabel="Wish cost"
          keyboardType="decimal-pad"
          value={target}
          onChangeText={setTarget}
          placeholder="0.00"
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
          accessibilityLabel="Save wish"
          accessibilityState={{ disabled: !canSave }}
          disabled={!canSave}
          onPress={() => {
            onConfirm({ name: name.trim(), targetCents });
            reset();
          }}
          style={({ pressed }) => ({
            alignItems: "center",
            paddingVertical: 14,
            borderRadius: radius.pill,
            backgroundColor: canSave
              ? pressed
                ? bucketTokens.spend.ramp[400]
                : bucketTokens.spend.ramp[200]
              : scheme.bgSunken,
            opacity: canSave ? 1 : 0.6,
          })}
        >
          <Text
            style={[
              typography.text.label,
              { color: canSave ? bucketTokens.spend.ramp[800] : scheme.fgFaint, fontSize: 15 },
            ]}
          >
            {canSave ? `Save · ${formatMoney(targetCents, currency)}` : "Save"}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}
