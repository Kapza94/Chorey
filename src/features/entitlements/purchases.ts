/**
 * Pure RevenueCat glue. The native SDK is wrapped behind `PurchasesGateway`
 * (see default-purchase-actions.ts) so everything here stays testable without
 * importing `react-native-purchases`. Prices are NEVER hard-coded — they come
 * from the store via the current offering at runtime.
 */
import type { SubscriptionPlan } from "@/features/entitlements/subscription-actions";

/** The single all-inclusive entitlement configured in RevenueCat. */
export const CHOREY_ENTITLEMENT = "chorey_family";

/** One purchasable plan, with its localized store price. */
export type PlanOffer = {
  plan: SubscriptionPlan;
  priceString: string;
  packageIdentifier: string;
};

// Minimal shapes mirrored from the RevenueCat SDK so we can map + test without
// pulling in the native module.
export type RcProduct = { priceString: string };
export type RcPackage = {
  identifier: string;
  packageType: string; // 'MONTHLY' | 'ANNUAL' | 'WEEKLY' | 'LIFETIME' | ...
  product: RcProduct;
};
export type RcOffering = { availablePackages: RcPackage[] } | null;

export type RcCustomerInfo = {
  entitlements: { active: Record<string, { expirationDate: string | null }> };
} | null;

const PACKAGE_TYPE_TO_PLAN: Record<string, SubscriptionPlan> = {
  MONTHLY: "monthly",
  ANNUAL: "yearly",
};

const PLAN_ORDER: SubscriptionPlan[] = ["monthly", "yearly"];

/**
 * Map RevenueCat's current offering to our plan offers (monthly first). Unknown
 * package types are ignored; the first package wins if a plan appears twice.
 * A null offering (RevenueCat not configured yet) yields no offers.
 */
export function toPlanOffers(offering: RcOffering): PlanOffer[] {
  if (!offering) {
    return [];
  }

  const offers: PlanOffer[] = [];
  for (const pkg of offering.availablePackages) {
    const plan = PACKAGE_TYPE_TO_PLAN[pkg.packageType];
    if (!plan || offers.some((offer) => offer.plan === plan)) {
      continue;
    }
    offers.push({
      plan,
      priceString: pkg.product.priceString,
      packageIdentifier: pkg.identifier,
    });
  }

  return offers.sort(
    (a, b) => PLAN_ORDER.indexOf(a.plan) - PLAN_ORDER.indexOf(b.plan),
  );
}

/** Whether the Chorey entitlement is currently active, and when it expires. */
export function entitlementFromCustomerInfo(info: RcCustomerInfo): {
  isActive: boolean;
  expiresAt: string | null;
} {
  const active = info?.entitlements.active[CHOREY_ENTITLEMENT];
  if (!active) {
    return { isActive: false, expiresAt: null };
  }
  return { isActive: true, expiresAt: active.expirationDate ?? null };
}

export type PurchaseOutcome = "purchased" | "cancelled" | "error";

export type PurchaseResult = {
  outcome: PurchaseOutcome;
  isActive: boolean;
  plan: SubscriptionPlan | null;
  expiresAt: string | null;
};

/**
 * The app-facing billing surface. The real implementation wraps the SDK; tests
 * inject a stub. RevenueCat is the authority for status — after a purchase the
 * UI reflects this result, while the server-side webhook keeps Supabase truth.
 */
export type PurchasesGateway = {
  loadOffers(): Promise<PlanOffer[]>;
  purchase(plan: SubscriptionPlan): Promise<PurchaseResult>;
  restore(): Promise<PurchaseResult>;
};
