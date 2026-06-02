import { Pressable, ScrollView, Text, View } from "react-native";
import { Plus } from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { buckets as bucketTokens } from "@/theme/chorey-theme";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  type CurrencyCode,
} from "@/features/money/currency";

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
  onAddWish?: () => void;
};

export function KidWishlistScreen({
  currency = DEFAULT_CURRENCY,
  spendableCents = 0,
  wishes = [],
  onRequestPurchase,
  onAddWish,
}: Props) {
  const { scheme, typography, palette, radius } = useChoreyTheme();
  const allowance = bucketTokens.spend.ramp;

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
          <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 32, marginTop: 2 }]}>
            Wishlist.
          </Text>
        </View>

        {/* Spendable now */}
        <View
          style={{
            marginHorizontal: 18,
            marginTop: 8,
            backgroundColor: scheme.bgRaised,
            borderColor: scheme.border,
            borderWidth: 1,
            borderRadius: 18,
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>
            Spendable now
          </Text>
          <Text
            style={[
              typography.text.moneyHero,
              { color: allowance[800], fontSize: 38, marginTop: 4 },
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
                  backgroundColor: scheme.bgRaised,
                  borderColor: scheme.border,
                  borderWidth: 1,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  gap: 10,
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
          onPress={onAddWish}
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
    </View>
  );
}
