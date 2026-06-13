import { Pressable, ScrollView, Text, View } from "react-native";
import {
  BellOff,
  Check,
  Lock,
  PauseCircle,
  PieChart,
  RefreshCw,
  Users,
} from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { buckets as bucketTokens } from "@/theme/chorey-theme";
import { ToySticker } from "@/components/toybox";
import type {
  HouseholdSubscription,
  SubscriptionPlan,
} from "@/features/entitlements/subscription-actions";

type Props = {
  subscription: HouseholdSubscription;
  onChoosePlan?: (plan: SubscriptionPlan) => void;
  onClose?: () => void;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDay(iso: string): string {
  const date = new Date(iso);
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

// The paid promise: automation, coordination, proof, less mental load.
// Low-leverage features never headline.
const PROMISE = [
  { Icon: Users, text: "Covers every child and parent in your household" },
  { Icon: RefreshCw, text: "Recurring chores and reminders run themselves" },
  { Icon: PieChart, text: "40 / 40 / 20 tracked automatically" },
];

export function SubscriptionScreen({ subscription, onChoosePlan, onClose }: Props) {
  const { scheme, typography, palette, radius, toybox, bucketInk } = useChoreyTheme();
  const giving = bucketTokens.giving.ramp;
  const lapsed = subscription.status === "lapsed";

  return (
    <View style={{ flex: 1, backgroundColor: scheme.bgPage }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 18, paddingBottom: 40, gap: 14 }}
        style={{ flex: 1 }}
      >
        {lapsed ? (
          <>
            <View style={{ alignItems: "center", paddingTop: 26, paddingBottom: 4 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: radius.pill,
                  backgroundColor: scheme.tint.allowance,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <PauseCircle size={24} color={bucketInk("spend")} strokeWidth={2.2} />
              </View>
              <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 26 }]}>
                Your subscription has ended
              </Text>
              <Text
                style={[
                  typography.text.bodySm,
                  { color: scheme.fgMuted, textAlign: "center", marginTop: 6, lineHeight: 22 },
                ]}
              >
                Everything your family built is saved. Chores, approvals, and reminders
                are paused until you resume.
              </Text>
            </View>

            <View
              style={{
                backgroundColor: scheme.bgRaised,
                borderColor: scheme.border,
                borderWidth: 1,
                borderRadius: 16,
                padding: 16,
                gap: 10,
              }}
            >
              <PausedRow Icon={Check} tone={giving[600]} text="Balances and history stay readable" />
              <PausedRow Icon={Lock} tone={scheme.fgFaint} text="New chores and approvals are paused" />
              <PausedRow Icon={BellOff} tone={scheme.fgFaint} text="Reminders are paused" />
            </View>

            <Text
              style={[
                typography.text.caption,
                { color: scheme.fgFaint, textAlign: "center", marginTop: 4 },
              ]}
            >
              Resuming opens with the App Store launch — your data is safe in the
              meantime.
            </Text>
          </>
        ) : (
          <>
            <View
              style={{
                backgroundColor: scheme.bgModal,
                borderColor: scheme.toy.border,
                borderWidth: toybox.borderWidth,
                borderRadius: toybox.radius,
                padding: 18,
                ...scheme.toy.shadow,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.family.display.extra,
                    fontSize: 24,
                    letterSpacing: -0.5,
                    color: scheme.fg,
                  }}
                >
                  Chorey Family
                </Text>
                <ToySticker
                  label={subscription.status === "trialing" ? "Free trial" : "Active"}
                  tone="giving"
                />
              </View>

              <Text
                style={[
                  typography.text.bodySm,
                  { color: scheme.fgMuted, marginTop: 6, lineHeight: 21 },
                ]}
              >
                {subscription.status === "trialing" && subscription.trialEndsAt
                  ? subscription.plan
                    ? `Your trial ends ${formatDay(subscription.trialEndsAt)}. Billed ${subscription.plan} after the trial — cancel anytime before then.`
                    : `Your trial ends ${formatDay(subscription.trialEndsAt)}. Pick how you'd like to be billed after it.`
                  : "One plan runs the whole household — every child, every parent, every chore."}
              </Text>

              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: scheme.border,
                  marginTop: 14,
                  paddingTop: 14,
                  gap: 10,
                }}
              >
                {PROMISE.map(({ Icon, text }) => (
                  <View key={text} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Icon size={16} color={palette.accent[600]} strokeWidth={2.2} />
                    <Text style={[typography.text.bodySm, { color: scheme.fgMuted, flex: 1 }]}>
                      {text}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={[typography.text.overline, { color: scheme.fgFaint, paddingHorizontal: 4 }]}>
              Billing
            </Text>

            <PlanCard
              plan="monthly"
              label="Monthly"
              caption="Simple, month to month"
              selected={subscription.plan === "monthly"}
              onPress={() => onChoosePlan?.("monthly")}
            />
            <PlanCard
              plan="yearly"
              label="Yearly"
              caption="2 months free"
              selected={subscription.plan === "yearly"}
              onPress={() => onChoosePlan?.("yearly")}
            />

            <Text
              style={[
                typography.text.caption,
                { color: scheme.fgFaint, textAlign: "center", marginTop: 4 },
              ]}
            >
              You won&apos;t be charged during the trial. Pricing is confirmed in the
              App Store before any charge.
            </Text>
          </>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close subscription"
          onPress={onClose}
          style={({ pressed }) => ({
            alignItems: "center",
            marginTop: 8,
            paddingVertical: 14,
            borderRadius: radius.pill,
            backgroundColor: pressed ? palette.accent[800] : palette.accent[600],
          })}
        >
          <Text style={[typography.text.label, { color: palette.cream[4], fontSize: 15 }]}>
            Back
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );

  function PausedRow({
    Icon,
    tone,
    text,
  }: {
    Icon: typeof Check;
    tone: string;
    text: string;
  }) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Icon size={15} color={tone} strokeWidth={2.4} />
        <Text style={[typography.text.bodySm, { color: scheme.fgMuted, flex: 1 }]}>
          {text}
        </Text>
      </View>
    );
  }

  function PlanCard({
    plan,
    label,
    caption,
    selected,
    onPress,
  }: {
    plan: SubscriptionPlan;
    label: string;
    caption: string;
    selected: boolean;
    onPress: () => void;
  }) {
    const spend = bucketTokens.spend.ramp;

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Choose ${plan} billing`}
        accessibilityState={{ selected }}
        onPress={onPress}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: selected ? scheme.tint.allowance : scheme.bgModal,
          borderColor: scheme.toy.border,
          borderWidth: toybox.borderWidth,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
          ...(selected ? scheme.toy.shadow : scheme.toy.shadowSm),
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View>
            <Text
              style={[
                typography.text.h3,
                { color: selected ? spend[800] : scheme.fg, fontSize: 15 },
              ]}
            >
              {label}
            </Text>
            <Text
              style={[
                typography.text.caption,
                { color: selected ? spend[600] : scheme.fgFaint, marginTop: 2 },
              ]}
            >
              {caption}
            </Text>
          </View>
          {plan === "yearly" ? <ToySticker label="Best deal" tone="spend" /> : null}
        </View>
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: radius.pill,
            borderWidth: selected ? 0 : 1.5,
            borderColor: scheme.border,
            backgroundColor: selected ? spend[600] : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {selected ? <Check size={13} color={palette.cream[4]} strokeWidth={3} /> : null}
        </View>
      </Pressable>
    );
  }
}
