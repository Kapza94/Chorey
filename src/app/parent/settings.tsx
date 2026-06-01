import { useLocalSearchParams, useRouter } from "expo-router";

import { ParentSettingsScreen } from "@/features/parent-settings/parent-settings-screen";

export default function ParentSettingsRoute() {
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

  return (
    <ParentSettingsScreen
      childName={childName}
      householdId={householdId}
      onOpenChildren={() =>
        router.push({ pathname: "/parent/children", params })
      }
      onOpenChores={() =>
        router.push({ pathname: "/parent/chores", params })
      }
      onOpenDashboard={() =>
        router.push({ pathname: "/parent/dashboard", params })
      }
      onOpenUpgrade={() =>
        router.push({ pathname: "/parent/upgrade", params })
      }
    />
  );
}
