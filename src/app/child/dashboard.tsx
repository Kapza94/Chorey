import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ChildDashboardScreen } from "@/features/child-dashboard/child-dashboard-screen";
import type { ChildChore } from "@/features/chores/child-chore-actions";
import type { BucketBalances } from "@/features/chores/money";
import {
  listChoresForChild,
  submitChoreForChild,
} from "@/features/chores/default-child-chore-actions";
import {
  listGivingOptionsForChild,
  suggestGivingOptionForChild,
} from "@/features/giving/default-giving-actions";
import type { GivingOption } from "@/features/giving/giving-actions";
import { getBucketBalancesForChild } from "@/features/ledger/default-ledger-actions";

const emptyBalances: BucketBalances = {
  givingCents: 0,
  savingsCents: 0,
  spendCents: 0,
};

export default function ChildDashboardRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ accessCode?: string; childName?: string }>();
  const accessCode = Array.isArray(params.accessCode)
    ? params.accessCode[0]
    : params.accessCode;
  const childName = Array.isArray(params.childName)
    ? params.childName[0]
    : params.childName;
  const [chores, setChores] = useState<ChildChore[]>([]);
  const [givingOptions, setGivingOptions] = useState<GivingOption[]>([]);
  const [bucketBalances, setBucketBalances] =
    useState<BucketBalances>(emptyBalances);
  const [submittingChoreId, setSubmittingChoreId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let mounted = true;

    if (!accessCode) {
      return;
    }

    Promise.all([
      listChoresForChild(accessCode),
      getBucketBalancesForChild(accessCode),
      listGivingOptionsForChild(accessCode),
    ]).then(([nextChores, nextBalances, nextGivingOptions]) => {
      if (mounted) {
        setChores(nextChores);
        setBucketBalances(nextBalances);
        setGivingOptions(nextGivingOptions);
      }
    });

    return () => {
      mounted = false;
    };
  }, [accessCode]);

  return (
    <ChildDashboardScreen
      bucketBalances={bucketBalances}
      childName={childName}
      chores={chores}
      givingOptions={givingOptions}
      onBack={() => router.back()}
      onSubmitChore={async (choreId) => {
        if (!accessCode) {
          return;
        }

        setSubmittingChoreId(choreId);

        try {
          const submitted = await submitChoreForChild({ accessCode, choreId });
          setChores((current) =>
            current.map((chore) => (chore.id === choreId ? submitted : chore)),
          );
        } finally {
          setSubmittingChoreId(null);
        }
      }}
      onSuggestGivingOption={async (name) => {
        if (!accessCode) {
          return;
        }

        await suggestGivingOptionForChild({ accessCode, name });
      }}
      submittingChoreId={submittingChoreId}
    />
  );
}
