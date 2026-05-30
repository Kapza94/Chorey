import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import type { CreatedChore } from "@/features/chores/chore-actions";
import type { BucketBalances } from "@/features/chores/money";
import {
  approveChoreForHousehold,
  listChoresForHousehold,
} from "@/features/chores/default-chore-actions";
import { getBucketBalancesForHousehold } from "@/features/ledger/default-ledger-actions";
import { ParentDashboardScreen } from "@/features/parent-dashboard/parent-dashboard-screen";

const emptyBalances: BucketBalances = {
  givingCents: 0,
  savingsCents: 0,
  spendCents: 0,
};

export default function ParentDashboardRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    childAccessCode?: string;
    childName?: string;
    childProfileId?: string;
    choreRewardCents?: string;
    choreStatus?: string;
    choreTitle?: string;
    householdId?: string;
  }>();
  const childName = Array.isArray(params.childName)
    ? params.childName[0]
    : params.childName;
  const childAccessCode = Array.isArray(params.childAccessCode)
    ? params.childAccessCode[0]
    : params.childAccessCode;
  const childProfileId = Array.isArray(params.childProfileId)
    ? params.childProfileId[0]
    : params.childProfileId;
  const householdId = Array.isArray(params.householdId)
    ? params.householdId[0]
    : params.householdId;
  const choreTitle = Array.isArray(params.choreTitle)
    ? params.choreTitle[0]
    : params.choreTitle;
  const choreRewardCents = Array.isArray(params.choreRewardCents)
    ? params.choreRewardCents[0]
    : params.choreRewardCents;
  const choreStatus = Array.isArray(params.choreStatus)
    ? params.choreStatus[0]
    : params.choreStatus;
  const [chores, setChores] = useState<CreatedChore[]>(
    choreTitle
      ? [
          {
            id: "created-chore",
            householdId: householdId ?? "",
            childProfileId: childProfileId ?? "",
            title: choreTitle,
            rewardCents: Number(choreRewardCents ?? "0"),
            status: choreStatus === "assigned" ? "assigned" : "assigned",
          },
        ]
      : [],
  );
  const [bucketBalances, setBucketBalances] =
    useState<BucketBalances>(emptyBalances);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      if (!householdId) {
        return;
      }

      Promise.all([
        listChoresForHousehold(householdId),
        getBucketBalancesForHousehold(householdId),
      ]).then(([nextChores, nextBalances]) => {
        if (mounted) {
          setChores(nextChores);
          setBucketBalances(nextBalances);
        }
      });

      return () => {
        mounted = false;
      };
    }, [householdId]),
  );

  return (
    <ParentDashboardScreen
      bucketBalances={bucketBalances}
      childAccessCode={childAccessCode}
      childName={childName}
      chores={chores}
      onApproveChore={async (choreId) => {
        if (!householdId) {
          return;
        }

        const approved = await approveChoreForHousehold({ householdId, choreId });
        const nextBalances = await getBucketBalancesForHousehold(householdId);
        setChores((current) =>
          current.map((chore) => (chore.id === choreId ? approved : chore)),
        );
        setBucketBalances(nextBalances);
      }}
      onCreateChore={() =>
        router.push({
          pathname: "/parent/chores/new",
          params: { childAccessCode, childName, childProfileId, householdId },
        })
      }
      onOpenChildAccess={() => router.push("/child/access")}
    />
  );
}
