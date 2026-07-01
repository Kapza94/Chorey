import { useState } from "react";
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
import { annualDeal, type PlanOffer } from "@/features/entitlements/purchases";
import { LegalConsent } from "@/features/legal/legal-consent";

type Props = {
  subscription: HouseholdSubscription;
  /** Live plans (with localized store prices) from RevenueCat. */
  offers?: PlanOffer[];
  onChoosePlan?: (plan: SubscriptionPlan) => void;
  onRestore?: () => void;
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

export function SubscriptionScreen({
  subscription,
  offers,
  onChoosePlan,
  onRestore,
  onClose,
}: Props) {
  const { scheme, typography, palette, radius, toybox, bucketInk } = useChoreyTheme();
  const giving = bucketTokens.giving.ramp;
  const lapsed = subscription.status === "lapsed";
  const offerFor = (plan: SubscriptionPlan) =>
    offers?.find((offer) => offer.plan === plan);

  // Tapping a card only *selects* it; the Subscribe button below commits the
  // purchase. Default to the annual ("Best deal") plan, or whatever the
  // household already has.
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(
    subscription.plan ?? "annual",
  );


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

            {onChoosePlan
              ? renderPlans(
                  // Apple 3.1.2 / CA ARL: every purchase path must disclose auto-renewal.
                  "Renews automatically at the shown price until cancelled in your App Store settings. Resume anytime — you pick up right where you left off.",
                )
              : (
                <Text
                  style={[
                    typography.text.caption,
                    { color: scheme.fgFaint, textAlign: "center", marginTop: 4 },
                  ]}
                >
                  Your data is safe. Resubscribe from Settings to pick up where you
                  left off.
                </Text>
              )}
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
                    ? `Free until ${formatDay(subscription.trialEndsAt)}, then billed ${subscription.plan === "annual" ? "annually" : subscription.plan} — cancel anytime before then.`
                    : `Free until ${formatDay(subscription.trialEndsAt)}. Pick how you'd like to be billed after it.`
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

            {renderPlans(
              "You won't be charged during the trial. Afterwards the plan renews automatically until cancelled in your App Store settings — pricing is confirmed in the App Store before any charge.",
            )}
          </>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close subscription"
          onPress={onClose}
          style={{ alignItems: "center", marginTop: 4, paddingVertical: 12 }}
        >
          <Text style={[typography.text.label, { color: scheme.fgFaint, fontSize: 15 }]}>
            Maybe later
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );

  function renderPlans(fineprint: string) {
    const monthly = offerFor("monthly");
    const yearly = offerFor("annual");

    // Compare price, savings and "months free" are derived from the live store
    // prices (annualDeal) so they're correct in every region — never hard-coded.
    const deal = annualDeal(monthly, yearly);

    return (
      <>
        <Text style={[typography.text.overline, { color: scheme.fgFaint, paddingHorizontal: 4 }]}>
          Billing
        </Text>

        <PlanCard
          plan="monthly"
          label="Monthly"
          caption="Simple, month to month"
          priceString={monthly?.priceString}
          selected={selectedPlan === "monthly"}
          onPress={() => setSelectedPlan("monthly")}
        />
        <PlanCard
          plan="annual"
          label="Annual"
          caption={deal?.monthsFree ? `${deal.monthsFree} months free` : "Best value"}
          priceString={yearly?.priceString}
          comparePrice={deal?.comparePrice}
          savingsLabel={deal?.savings ? `You save ${deal.savings}` : undefined}
          selected={selectedPlan === "annual"}
          onPress={() => setSelectedPlan("annual")}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Subscribe — ${selectedPlan} billing`}
          onPress={() => onChoosePlan?.(selectedPlan)}
          style={({ pressed }) => ({
            alignItems: "center",
            marginTop: 6,
            paddingVertical: 16,
            borderRadius: radius.pill,
            backgroundColor: pressed ? palette.accent[800] : palette.accent[600],
            ...scheme.toy.shadow,
          })}
        >
          <Text style={[typography.text.label, { color: palette.cream[4], fontSize: 16 }]}>
            {subscription.status === "trialing" ? "Start free trial" : "Subscribe"}
          </Text>
        </Pressable>

        {onRestore ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Restore purchases"
            onPress={onRestore}
            style={{ alignItems: "center", paddingVertical: 10 }}
          >
            <Text style={[typography.text.label, { color: palette.accent[600], fontSize: 14 }]}>
              Restore purchases
            </Text>
          </Pressable>
        ) : null}

        <Text
          style={[
            typography.text.caption,
            { color: scheme.fgFaint, textAlign: "center", marginTop: 4 },
          ]}
        >
          {fineprint}
        </Text>

        <LegalConsent action="subscribing" />
      </>
    );
  }

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
    priceString,
    comparePrice,
    savingsLabel,
    selected,
    onPress,
  }: {
    plan: SubscriptionPlan;
    label: string;
    caption: string;
    priceString?: string;
    comparePrice?: string;
    savingsLabel?: string;
    selected: boolean;
    onPress: () => void;
  }) {
    const spend = bucketTokens.spend.ramp;

    // Wrap in a View so the corner savings badge can float above the card edge
    return (
      <View style={{ marginTop: plan === "annual" ? 16 : 0 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Choose ${plan} billing`}
          accessibilityState={{ selected }}
          onPress={onPress}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: selected ? scheme.tint.allowance : scheme.bgModal,
            borderColor: selected ? spend[400] : scheme.toy.border,
            borderWidth: toybox.borderWidth,
            borderRadius: 16,
            paddingHorizontal: 18,
            paddingVertical: 18,
            gap: 12,
            ...(selected ? scheme.toy.shadow : scheme.toy.shadowSm),
          }}
        >
          {/* Radio */}
          <View
            style={{
              width: 22,
              height: 22,
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

          {/* Label + caption */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={[typography.text.h3, { color: selected ? spend[800] : scheme.fg, fontSize: 16 }]}>
                {label}
              </Text>
              {plan === "annual" ? <ToySticker label="Best deal" tone="spend" /> : null}
            </View>
            <Text style={[typography.text.caption, { color: selected ? spend[600] : scheme.fgFaint, marginTop: 3 }]}>
              {caption}
            </Text>
          </View>

          {/* Price stack — right-aligned */}
          <View style={{ alignItems: "flex-end" }}>
            {priceString ? (
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 3 }}>
                <Text style={[typography.text.h3, { color: selected ? spend[800] : scheme.fg, fontSize: 18 }]}>
                  {priceString}
                </Text>
                <Text style={[typography.text.caption, { fontSize: 13, color: selected ? spend[600] : scheme.fgFaint }]}>
                  {plan === "annual" ? "/ yr" : "/ mo"}
                </Text>
              </View>
            ) : null}
            {comparePrice ? (
              <Text
                style={{
                  fontFamily: typography.family.display.extra,
                  fontSize: 18,
                  color: selected ? spend[200] : scheme.fgFaint,
                  textDecorationLine: "line-through",
                  textDecorationColor: selected ? spend[400] : scheme.fgFaint,
                  marginTop: 3,
                }}
              >
                {comparePrice} / yr
              </Text>
            ) : null}
          </View>
        </Pressable>

        {/* Savings badge — straddles the top border */}
        {plan === "annual" && savingsLabel ? (
          <View
            style={{
              position: "absolute",
              top: -14,
              right: 14,
              backgroundColor: giving[400],
              borderColor: giving[600],
              borderWidth: toybox.borderWidth,
              borderRadius: toybox.radius,
              paddingHorizontal: 12,
              paddingVertical: 4,
              ...scheme.toy.shadow,
            }}
          >
            <Text style={{ fontFamily: typography.family.display.extra, fontSize: 13, color: giving[800] }}>
              {savingsLabel}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }
}
