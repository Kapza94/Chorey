import {
  resolveHouseholdEntitlement,
  type SubscriptionStatus,
} from "@/features/entitlements/entitlements";

export type SubscriptionPlan = "monthly" | "annual";

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

/** Whole days left until `iso`, rounded up and floored at 0 ("1 day left"
 *  while there are still hours to go, never a misleading "0"). */
export function trialDaysRemaining(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

/** One-line summary for settings rows and the profile sticker. */
export function describeSubscription(subscription: HouseholdSubscription): string {
  if (subscription.status === "trialing") {
    if (!subscription.trialEndsAt) {
      return "Free trial";
    }
    const days = trialDaysRemaining(subscription.trialEndsAt);
    if (days === 0) {
      return "Free trial · last day";
    }
    return `Free trial · ${days} ${days === 1 ? "day" : "days"} left`;
  }

  if (subscription.status === "active") {
    const planLabel = subscription.plan === "annual" ? "annually" : subscription.plan;
    return planLabel ? `Active · billed ${planLabel}` : "Active";
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
