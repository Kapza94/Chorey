import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ChildDashboardScreen } from "@/features/child-dashboard/child-dashboard-screen";
import type { ChildChore } from "@/features/chores/child-chore-actions";
import {
  listChoresForChild,
  submitChoreForChild,
} from "@/features/chores/default-child-chore-actions";

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
  const [submittingChoreId, setSubmittingChoreId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let mounted = true;

    if (!accessCode) {
      return;
    }

    listChoresForChild(accessCode).then((nextChores) => {
      if (mounted) {
        setChores(nextChores);
      }
    });

    return () => {
      mounted = false;
    };
  }, [accessCode]);

  return (
    <ChildDashboardScreen
      childName={childName}
      chores={chores}
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
      submittingChoreId={submittingChoreId}
    />
  );
}
