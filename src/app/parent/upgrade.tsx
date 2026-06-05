import { useLocalSearchParams, useRouter } from "expo-router";

import { UpgradeScreen } from "@/features/upgrade/upgrade-screen";

export default function ParentUpgradeRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ householdId?: string }>();
  const householdId = Array.isArray(params.householdId)
    ? params.householdId[0]
    : params.householdId;

  return (
    <UpgradeScreen
      onClose={() =>
        router.replace({
          pathname: "/parent/home",
          params: { householdId },
        })
      }
    />
  );
}
