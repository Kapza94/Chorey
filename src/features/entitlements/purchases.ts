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
  /** Localized, ready-to-display price from the store (e.g. "$4.99", "599 RSD"). */
  priceString: string;
  /** Numeric amount in the store currency — used to derive comparisons (12×
   *  monthly, savings) that stay correct in every region and currency. */
  priceAmount: number;
  /** ISO 4217 code the store priced this in (e.g. "USD", "RSD"). */
  currencyCode: string;
  packageIdentifier: string;
};

// Minimal shapes mirrored from the RevenueCat SDK so we can map + test without
// pulling in the native module.
export type RcProduct = {
  priceString: string;
  /** numeric price in `currencyCode` */
  price: number;
  currencyCode: string;
};
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
  ANNUAL: "annual",
};

const PLAN_ORDER: SubscriptionPlan[] = ["monthly", "annual"];

/**
 * Map RevenueCat's current offering to our plan offers (monthly first, then
 * annual). Unknown package types are ignored; the first package wins if a plan
 * appears twice. A null offering (RevenueCat not configured yet) yields no offers.
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
      priceAmount: pkg.product.price,
      currencyCode: pkg.product.currencyCode,
      packageIdentifier: pkg.identifier,
    });
  }

  return offers.sort(
    (a, b) => PLAN_ORDER.indexOf(a.plan) - PLAN_ORDER.indexOf(b.plan),
  );
}

/**
 * Format a derived amount (e.g. 12× the monthly price) in the store's currency.
 * Uses the currency code the store reported so it reads right in every region;
 * falls back to "CODE 0.00" if the runtime's Intl lacks that currency.
 */
export function formatStorePrice(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

/**
 * The annual-vs-monthly deal, computed from the live store prices so the copy
 * is correct in every region — Apple/Google price tiers are NOT a fixed ratio,
 * so "months free" and savings must be derived, never hard-coded. Returns null
 * when either price is missing (offerings not loaded yet).
 */
export function annualDeal(
  monthly: PlanOffer | undefined,
  annual: PlanOffer | undefined,
): { comparePrice: string; savings: string | null; monthsFree: number | null } | null {
  if (!monthly || !annual || monthly.priceAmount <= 0) {
    return null;
  }
  const yearAtMonthly = monthly.priceAmount * 12;
  const savingsAmount = yearAtMonthly - annual.priceAmount;
  const monthsFree = Math.round(12 - annual.priceAmount / monthly.priceAmount);
  return {
    comparePrice: formatStorePrice(yearAtMonthly, annual.currencyCode),
    savings:
      savingsAmount > 0 ? formatStorePrice(savingsAmount, annual.currencyCode) : null,
    monthsFree: monthsFree > 0 ? monthsFree : null,
  };
}

/**
 * DEV-ONLY screenshot aid: build mock plan offers from
 * `EXPO_PUBLIC_MOCK_PAYWALL_PRICES="monthly,annual"` (USD amounts, e.g.
 * "4.99,39.99"). Lets the paywall render real-looking prices in the Simulator,
 * where StoreKit can't serve products. Returns null when unset/malformed. The
 * caller also gates on `__DEV__`, so this can never affect a production build.
 */
export function mockPaywallOffers(raw: string | undefined): PlanOffer[] | null {
  if (!raw) {
    return null;
  }
  const [monthly, annual] = raw.split(",").map((part) => parseFloat(part.trim()));
  if (!Number.isFinite(monthly) || !Number.isFinite(annual)) {
    return null;
  }
  return [
    {
      plan: "monthly",
      priceString: formatStorePrice(monthly, "USD"),
      priceAmount: monthly,
      currencyCode: "USD",
      packageIdentifier: "mock_monthly",
    },
    {
      plan: "annual",
      priceString: formatStorePrice(annual, "USD"),
      priceAmount: annual,
      currencyCode: "USD",
      packageIdentifier: "mock_annual",
    },
  ];
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
