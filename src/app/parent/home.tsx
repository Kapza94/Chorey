import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { ParentApp } from "@/features/parent-app/parent-app";
import type { ParentKid } from "@/features/parent-app/parent-primitives";
import { listHouseholdKids } from "@/features/parent-app/default-parent-kids-actions";
import { getHouseholdSettings } from "@/features/household/default-household-actions";
import { DEFAULT_SPLIT, type Split } from "@/features/money/split";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/features/money/currency";
import type { DuePayout } from "@/features/parent-app/parent-payments-screen";

/**
 * The redesigned parent app, fed from real Supabase rows for the household the
 * parent just created. Per-kid aggregates come from the `list_household_kids`
 * RPC; currency + split come from the household row. (Payout history is a
 * follow-up — see the build plan.)
 */
export default function ParentHomeRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ householdId?: string }>();
  const householdId = Array.isArray(params.householdId)
    ? params.householdId[0]
    : params.householdId;

  const [kids, setKids] = useState<ParentKid[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [split, setSplit] = useState<Split>(DEFAULT_SPLIT);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      if (!householdId) {
        return;
      }

      Promise.all([
        listHouseholdKids(householdId),
        getHouseholdSettings(householdId),
      ]).then(([nextKids, settings]) => {
        if (mounted) {
          setKids(nextKids);
          setCurrency(settings.currency);
          setSplit(settings.split);
        }
      });

      return () => {
        mounted = false;
      };
    }, [householdId]),
  );

  const due: DuePayout[] = kids.map((kid) => ({
    id: kid.id,
    name: kid.name,
    tone: kid.tone,
    earnedCents: kid.earnedCents,
    allowanceCents: kid.allowanceCents,
    savingsCents: kid.savingsCents,
    givingCents: kid.givingCents,
    choresDone: kid.choresDone,
    cadence: kid.cadence,
  }));

  return (
    <ParentApp
      subtitle="This week"
      currency={currency}
      split={split}
      kids={kids}
      onAddKid={() =>
        router.push({
          pathname: "/parent/children/new",
          params: { householdId: householdId ?? "" },
        })
      }
      due={due}
      payoutHistory={[]}
      paidThisMonthCents={0}
      chores={[]}
      assignees={kids.map((kid) => ({ id: kid.id, name: kid.name }))}
    />
  );
}
