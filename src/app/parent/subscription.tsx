import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { SubscriptionScreen } from "@/features/subscription/subscription-screen";
import type { HouseholdSubscription } from "@/features/entitlements/subscription-actions";
import {
  chooseSubscriptionPlan,
  getHouseholdSubscription,
} from "@/features/entitlements/default-subscription-actions";

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

  const [subscription, setSubscription] = useState<HouseholdSubscription>(FALLBACK);

  const reload = useCallback(async () => {
    if (!householdId) {
      return;
    }

    setSubscription(await getHouseholdSubscription(householdId));
  }, [householdId]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return (
    <SubscriptionScreen
      subscription={subscription}
      onChoosePlan={async (plan) => {
        if (!householdId) {
          return;
        }

        await chooseSubscriptionPlan(householdId, plan);
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
