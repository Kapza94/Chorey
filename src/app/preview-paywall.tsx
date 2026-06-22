// TEMP preview route for capturing a real paywall screenshot. Delete after use.
import { useLocalSearchParams } from "expo-router";
import { SubscriptionScreen } from "@/features/subscription/subscription-screen";
import type { SubscriptionPlan } from "@/features/entitlements/subscription-actions";

const PLANS: SubscriptionPlan[] = ["monthly", "annual"];

export default function PreviewPaywall() {
  const { plan } = useLocalSearchParams<{ plan?: string }>();
  const selectedPlan = (PLANS.includes(plan as SubscriptionPlan) ? plan : "monthly") as SubscriptionPlan;

  return (
    <SubscriptionScreen
      subscription={{
        status: "trialing",
        plan: selectedPlan,
        trialEndsAt: "2026-07-06T00:00:00.000Z",
        currentPeriodEndsAt: null,
      }}
      offers={[
        { plan: "monthly", priceString: "$7.99", packageIdentifier: "$rc_monthly" },
        { plan: "annual", priceString: "$59.99", packageIdentifier: "$rc_annual" },
      ]}
      onChoosePlan={() => {}}
      onRestore={() => {}}
      onClose={() => {}}
    />
  );
}
