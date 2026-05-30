import { useLocalSearchParams, useRouter } from "expo-router";

import { createAccessCodeForChild } from "@/features/children/default-child-access-actions";
import { createChildForHousehold } from "@/features/children/default-child-actions";
import { ChildSetupScreen } from "@/features/children/child-setup-screen";

export default function NewChildRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ householdId?: string }>();
  const householdId = Array.isArray(params.householdId)
    ? params.householdId[0]
    : params.householdId;

  return (
    <ChildSetupScreen
      householdId={householdId ?? ""}
      onBack={() => router.back()}
      onChildCreated={async (child) => {
        const access = await createAccessCodeForChild({
          childProfileId: child.id,
          householdId: child.householdId,
        });

        router.replace({
          pathname: "/parent/dashboard",
          params: {
            childAccessCode: access.accessCode,
            childName: child.displayName,
            childProfileId: child.id,
            householdId: child.householdId,
          },
        });
      }}
      onCreateChild={createChildForHousehold}
    />
  );
}
