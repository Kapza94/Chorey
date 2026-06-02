import { Pressable, ScrollView, Text, View } from "react-native";
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
  charityName?: string | null;
  givenThisMonthCents?: number;
  onDonate?: () => void;
  onPickCharity?: () => void;
  onSeeEarnings?: () => void;
  onTellParent?: () => void;
};

export function KidYouScreen({
  name = "there",
  age,
  currency = DEFAULT_CURRENCY,
  savingsCents = 0,
  givingCents = 0,
  charityName,
  givenThisMonthCents = 0,
  onDonate,
  onPickCharity,
  onSeeEarnings,
  onTellParent,
}: Props) {
  const { scheme, typography, radius } = useChoreyTheme();
  const savings = bucketTokens.savings.ramp;
  const giving = bucketTokens.giving.ramp;
  const allowance = bucketTokens.spend.ramp;
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  const quickActions = [
    { label: "Pick a different charity", Icon: Heart, onPress: onPickCharity },
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
              <Text style={[typography.text.moneyHero, { color: savings[800], fontSize: 36 }]}>
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
              <Text style={[typography.text.moneyHero, { color: giving[800], fontSize: 36 }]}>
                {formatMoney(givingCents, currency)}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Donate"
                onPress={onDonate}
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
                  Donate
                </Text>
              </Pressable>
            </View>
            {charityName ? (
              <View
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: radius.sm,
                  backgroundColor: scheme.tint.giving,
                }}
              >
                <Text style={[typography.text.caption, { color: scheme.fg }]}>
                  <Text style={{ fontWeight: "700" }}>Picked:</Text> {charityName} —{" "}
                  {formatMoney(givenThisMonthCents, currency)} sent this month.
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
    </View>
  );
}
