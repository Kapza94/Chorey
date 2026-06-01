import { useLocalSearchParams, useRouter } from "expo-router";

import { createAccessCodeForChild } from "@/features/children/default-child-access-actions";
import { createChildForHousehold } from "@/features/children/default-child-actions";
import { ChildSetupScreen } from "@/features/children/child-setup-screen";

export default function NewChildRoute() {
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
  const childAccessCode = Array.isArray(params.childAccessCode)
    ? params.childAccessCode[0]
    : params.childAccessCode;
  const childProfileId = Array.isArray(params.childProfileId)
    ? params.childProfileId[0]
    : params.childProfileId;
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
      onUpgrade={() =>
        router.push({
          pathname: "/parent/upgrade",
          params: { childAccessCode, childName, childProfileId, householdId },
        })
      }
    />
  );
}
