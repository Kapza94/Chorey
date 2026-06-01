import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import type { CreatedChore } from "@/features/chores/chore-actions";
import { listChoresForHousehold } from "@/features/chores/default-chore-actions";
import { ParentChoresScreen } from "@/features/parent-chores/parent-chores-screen";

export default function ParentChoresRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    childAccessCode?: string;
    childName?: string;
    childProfileId?: string;
    householdId?: string;
  }>();
  const childName = Array.isArray(params.childName)
    ? params.childName[0]
    : params.childName;
  const householdId = Array.isArray(params.householdId)
    ? params.householdId[0]
    : params.householdId;
  const [chores, setChores] = useState<CreatedChore[]>([]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      if (!householdId) {
        return;
      }

      listChoresForHousehold(householdId).then((nextChores) => {
        if (mounted) {
          setChores(nextChores);
        }
      });

      return () => {
        mounted = false;
      };
    }, [householdId]),
  );

  return (
    <ParentChoresScreen
      childName={childName}
      chores={chores}
      onCreateChore={() =>
        router.push({ pathname: "/parent/chores/new", params })
      }
      onOpenChildren={() =>
        router.push({ pathname: "/parent/children", params })
      }
      onOpenDashboard={() =>
        router.push({ pathname: "/parent/dashboard", params })
      }
      onOpenSettings={() =>
        router.push({ pathname: "/parent/settings", params })
      }
    />
  );
}
