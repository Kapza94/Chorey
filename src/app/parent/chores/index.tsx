import { useLocalSearchParams, useRouter } from "expo-router";

import { ParentSectionScreen } from "@/features/parent-navigation/parent-section-screen";

export default function ParentChoresRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    childAccessCode?: string;
    childName?: string;
    childProfileId?: string;
    householdId?: string;
  }>();

  return (
    <ParentSectionScreen
      currentTab="chores"
      description="Review chore work, add new chores, and keep the household routine moving."
      onOpenChildren={() =>
        router.push({ pathname: "/parent/children", params })
      }
      onOpenDashboard={() =>
        router.push({ pathname: "/parent/dashboard", params })
      }
      onOpenSettings={() =>
        router.push({ pathname: "/parent/settings", params })
      }
      title="Chores"
    />
  );
}
