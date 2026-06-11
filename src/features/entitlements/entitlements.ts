/**
 * Chorey is subscription-only: one all-inclusive household plan (Chorey
 * Family) with a full-feature trial. There is no free tier and there are no
 * per-feature or per-count limits — a household is either entitled
 * (trialing/active) or paused (lapsed).
 */
export type SubscriptionStatus = "trialing" | "active" | "lapsed";

export type HouseholdEntitlementState = {
  status: SubscriptionStatus;
} | null;

/** A household with no entitlement record is paused, never silently free. */
export function resolveHouseholdEntitlement(
  state: HouseholdEntitlementState,
): SubscriptionStatus {
  if (!state) {
    return "lapsed";
  }

  return state.status;
}

/** The single gate every mutation uses; the trial is full-feature. */
export function isEntitled(status: SubscriptionStatus): boolean {
  return status === "trialing" || status === "active";
}

export function canAddChild(input: {
  status: SubscriptionStatus;
  currentChildCount: number;
}): boolean {
  return isEntitled(input.status);
}

/** Recurring chores pause (with everything else) when the household lapses. */
export function canUseRecurringChores(status: SubscriptionStatus): boolean {
  return isEntitled(status);
}
