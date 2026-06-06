export type SubscriptionStatus = "trialing" | "active" | "lapsed";
export type HouseholdAccess = "free" | "paid" | "lapsed";

export type HouseholdEntitlementState = {
  status: SubscriptionStatus;
} | null;

export function resolveHouseholdEntitlement(
  state: HouseholdEntitlementState,
): HouseholdAccess {
  if (!state) {
    return "free";
  }

  if (state.status === "trialing" || state.status === "active") {
    return "paid";
  }

  return "lapsed";
}

export function canAddChild(input: {
  access: HouseholdAccess;
  currentChildCount: number;
}) {
  if (input.access === "paid") {
    return true;
  }

  if (input.access === "lapsed") {
    return false;
  }

  return input.currentChildCount < 1;
}

/** Recurring chores are a paid-only feature. */
export function canUseRecurringChores(access: HouseholdAccess): boolean {
  return access === "paid";
}
