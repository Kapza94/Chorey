import { useLocalSearchParams, useRouter } from "expo-router";

import { UpgradeScreen } from "@/features/upgrade/upgrade-screen";

export default function ParentUpgradeRoute() {
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
    <UpgradeScreen
      onClose={() =>
        router.replace({
          pathname: "/parent/dashboard",
          params: { childAccessCode, childName, childProfileId, householdId },
        })
      }
    />
  );
}
