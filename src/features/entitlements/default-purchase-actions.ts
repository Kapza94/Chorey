import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  type PurchasesPackage,
} from "react-native-purchases";

import { getRevenueCatConfig } from "@/lib/env";
import type { SubscriptionPlan } from "@/features/entitlements/subscription-actions";
import {
  entitlementFromCustomerInfo,
  mockPaywallOffers,
  toPlanOffers,
  type PurchaseResult,
  type PurchasesGateway,
  type RcCustomerInfo,
  type RcOffering,
} from "@/features/entitlements/purchases";

let configuredFor: string | null = null;

/**
 * Configure RevenueCat for a household. The household id is the RevenueCat
 * appUserID, so the webhook can map a purchase straight back to the household.
 * No-ops (returns false) when keys aren't set yet — the app stays usable. Safe
 * to call repeatedly; only reconfigures when the household changes.
 */
export function configureRevenueCat(householdId: string): boolean {
  const config = getRevenueCatConfig();
  if (!config) {
    return false;
  }

  if (configuredFor === householdId) {
    return true;
  }

  const apiKey = Platform.OS === "ios" ? config.iosKey : config.androidKey;
  Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({ apiKey, appUserID: householdId });
  configuredFor = householdId;
  return true;
}

/** Whether billing is configured (RevenueCat keys present). */
export function isBillingConfigured(): boolean {
  return getRevenueCatConfig() !== null;
}

/**
 * The URL where the user manages (cancels, changes, refunds) their subscription.
 * RevenueCat returns the correct App Store / Play Store deep link per platform;
 * we fall back to the store's generic subscriptions page when billing isn't
 * configured or the lookup fails. Apple requires apps with auto-renewing
 * subscriptions to surface this, so it never throws — it always resolves a URL.
 */
export async function getStoreManagementUrl(): Promise<string> {
  const fallback =
    Platform.OS === "ios"
      ? "https://apps.apple.com/account/subscriptions"
      : "https://play.google.com/store/account/subscriptions";

  if (!isBillingConfigured()) {
    return fallback;
  }

  try {
    const info = await Purchases.getCustomerInfo();
    return info.managementURL ?? fallback;
  } catch {
    return fallback;
  }
}

const PLAN_TO_PACKAGE_TYPE: Record<SubscriptionPlan, string> = {
  monthly: "MONTHLY",
  annual: "ANNUAL",
};

/** Real RevenueCat-backed gateway used by the subscription route. */
export function createRevenueCatGateway(): PurchasesGateway {
  async function currentPackages(): Promise<PurchasesPackage[]> {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages ?? [];
  }

  return {
    async loadOffers() {
      // DEV-ONLY: mock prices for Simulator screenshots when the store can't
      // serve products. Gated on __DEV__, so it's dead in production builds.
      if (__DEV__) {
        const mock = mockPaywallOffers(process.env.EXPO_PUBLIC_MOCK_PAYWALL_PRICES);
        if (mock) {
          return mock;
        }
      }
      if (!isBillingConfigured()) {
        return [];
      }
      const packages = await currentPackages();
      const offering = { availablePackages: packages } as unknown as RcOffering;
      return toPlanOffers(offering);
    },

    async purchase(plan: SubscriptionPlan): Promise<PurchaseResult> {
      const wanted = PLAN_TO_PACKAGE_TYPE[plan];
      const pkg = (await currentPackages()).find(
        (candidate) => candidate.packageType === wanted,
      );
      if (!pkg) {
        return { outcome: "error", isActive: false, plan: null, expiresAt: null };
      }

      try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        const { isActive, expiresAt } = entitlementFromCustomerInfo(
          customerInfo as unknown as RcCustomerInfo,
        );
        return { outcome: "purchased", isActive, plan: isActive ? plan : null, expiresAt };
      } catch (error: unknown) {
        const cancelled =
          typeof error === "object" && error !== null && "userCancelled" in error
            ? Boolean((error as { userCancelled?: boolean }).userCancelled)
            : false;
        return {
          outcome: cancelled ? "cancelled" : "error",
          isActive: false,
          plan: null,
          expiresAt: null,
        };
      }
    },

    async restore(): Promise<PurchaseResult> {
      try {
        const customerInfo = await Purchases.restorePurchases();
        const { isActive, expiresAt } = entitlementFromCustomerInfo(
          customerInfo as unknown as RcCustomerInfo,
        );
        // plan is intentionally null here: the entitlement tells us access is
        // restored, but the authoritative plan comes from Supabase (kept in sync
        // by the RevenueCat webhook). The screen reloads it from the server.
        return { outcome: "purchased", isActive, plan: null, expiresAt };
      } catch {
        return { outcome: "error", isActive: false, plan: null, expiresAt: null };
      }
    },
  };
}
