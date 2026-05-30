import { useLocalSearchParams, useRouter } from "expo-router";

import { createChoreForHousehold } from "@/features/chores/default-chore-actions";
import { CreateChoreScreen } from "@/features/chores/create-chore-screen";

export default function NewChoreRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    childAccessCode?: string;
    childName?: string;
    childProfileId?: string;
    householdId?: string;
  }>();
  const childAccessCode = Array.isArray(params.childAccessCode)
    ? params.childAccessCode[0]
    : params.childAccessCode;
  const childName = Array.isArray(params.childName)
    ? params.childName[0]
    : params.childName;
  const childProfileId = Array.isArray(params.childProfileId)
    ? params.childProfileId[0]
    : params.childProfileId;
  const householdId = Array.isArray(params.householdId)
    ? params.householdId[0]
    : params.householdId;

  return (
    <CreateChoreScreen
      childName={childName ?? "your child"}
      childProfileId={childProfileId ?? ""}
      householdId={householdId ?? ""}
      onBack={() => router.back()}
      onChoreCreated={(chore) =>
        router.replace({
          pathname: "/parent/dashboard",
          params: {
            childAccessCode,
            childName,
            childProfileId,
            choreRewardCents: String(chore.rewardCents),
            choreStatus: chore.status,
            choreTitle: chore.title,
            householdId,
          },
        })
      }
      onCreateChore={createChoreForHousehold}
    />
  );
}
