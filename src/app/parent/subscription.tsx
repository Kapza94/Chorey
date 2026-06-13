import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { SubscriptionScreen } from "@/features/subscription/subscription-screen";
import type { HouseholdSubscription } from "@/features/entitlements/subscription-actions";
import { getHouseholdSubscription } from "@/features/entitlements/default-subscription-actions";
import {
  configureRevenueCat,
  createRevenueCatGateway,
} from "@/features/entitlements/default-purchase-actions";
import type { PlanOffer } from "@/features/entitlements/purchases";

const FALLBACK: HouseholdSubscription = {
  status: "trialing",
  plan: null,
  trialEndsAt: null,
  currentPeriodEndsAt: null,
};

export default function ParentSubscriptionRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ householdId?: string }>();
  const householdId = Array.isArray(params.householdId)
    ? params.householdId[0]
    : params.householdId;

  const gateway = useMemo(() => createRevenueCatGateway(), []);
  const [subscription, setSubscription] = useState<HouseholdSubscription>(FALLBACK);
  const [offers, setOffers] = useState<PlanOffer[]>([]);

  const reload = useCallback(async () => {
    if (!householdId) {
      return;
    }

    setSubscription(await getHouseholdSubscription(householdId));
  }, [householdId]);

  // Configure RevenueCat for this household (its id is the appUserID) and pull
  // the live store prices. Both no-op cleanly when billing isn't configured.
  useEffect(() => {
    if (!householdId) {
      return;
    }

    configureRevenueCat(householdId);
    let cancelled = false;
    void gateway.loadOffers().then((loaded) => {
      if (!cancelled) {
        setOffers(loaded);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [gateway, householdId]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return (
    <SubscriptionScreen
      subscription={subscription}
      offers={offers}
      onChoosePlan={async (plan) => {
        if (!householdId) {
          return;
        }

        const result = await gateway.purchase(plan);
        // RevenueCat is the authority; reflect immediately, then let the
        // webhook-updated Supabase row be the durable truth.
        if (result.isActive) {
          setSubscription((current) => ({
            ...current,
            status: "active",
            plan: result.plan ?? current.plan,
            currentPeriodEndsAt: result.expiresAt ?? current.currentPeriodEndsAt,
          }));
        }
        await reload();
      }}
      onRestore={async () => {
        await gateway.restore();
        await reload();
      }}
      onClose={() =>
        router.replace({
          pathname: "/parent/home",
          params: { householdId },
        })
      }
    />
  );
}
