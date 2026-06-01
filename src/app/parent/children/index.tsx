import { useLocalSearchParams, useRouter } from "expo-router";

import { ParentSectionScreen } from "@/features/parent-navigation/parent-section-screen";

export default function ParentChildrenRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    childAccessCode?: string;
    childName?: string;
    childProfileId?: string;
    householdId?: string;
  }>();

  return (
    <ParentSectionScreen
      currentTab="children"
      description="Manage child profiles and access codes from one place."
      onOpenChores={() =>
        router.push({ pathname: "/parent/chores", params })
      }
      onOpenDashboard={() =>
        router.push({ pathname: "/parent/dashboard", params })
      }
      onOpenSettings={() =>
        router.push({ pathname: "/parent/settings", params })
      }
      title="Children"
    />
  );
}
