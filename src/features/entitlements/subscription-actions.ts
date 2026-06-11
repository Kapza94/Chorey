import {
  resolveHouseholdEntitlement,
  type SubscriptionStatus,
} from "@/features/entitlements/entitlements";

export type SubscriptionPlan = "monthly" | "yearly";

/**
 * The household's Chorey Family subscription as the parent app sees it.
 * RevenueCat is the authority for status and dates; Supabase mirrors them.
 * Prices are never stored here — they come from the store at purchase time.
 */
export type HouseholdSubscription = {
  status: SubscriptionStatus;
  plan: SubscriptionPlan | null;
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDay(iso: string): string {
  const date = new Date(iso);
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

/** One-line summary for settings rows — always shows the real renewal date. */
export function describeSubscription(subscription: HouseholdSubscription): string {
  if (subscription.status === "trialing") {
    return subscription.trialEndsAt
      ? `Free trial · ends ${formatDay(subscription.trialEndsAt)}`
      : "Free trial";
  }

  if (subscription.status === "active") {
    return subscription.plan ? `Active · billed ${subscription.plan}` : "Active";
  }

  return "Paused";
}

type SubscriptionClient = {
  from(table: string): any;
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<{
    data: any;
    error: Error | null;
  }>;
};

export function createSubscriptionActions(client: SubscriptionClient) {
  return {
    async getSubscription(householdId: string): Promise<HouseholdSubscription> {
      const result = await client
        .from("household_entitlements")
        .select("status, plan, trial_ends_at, current_period_ends_at")
        .eq("household_id", householdId)
        .maybeSingle();

      if (result.error) {
        throw result.error;
      }

      return {
        status: resolveHouseholdEntitlement(result.data),
        plan: result.data?.plan ?? null,
        trialEndsAt: result.data?.trial_ends_at ?? null,
        currentPeriodEndsAt: result.data?.current_period_ends_at ?? null,
      };
    },

    async choosePlan(householdId: string, plan: SubscriptionPlan): Promise<void> {
      const result = await client.rpc("choose_subscription_plan", {
        input_household_id: householdId,
        input_plan: plan,
      });

      if (result.error) {
        throw result.error;
      }
    },
  };
}
