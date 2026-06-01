import { useLocalSearchParams, useRouter } from "expo-router";

import { ParentSectionScreen } from "@/features/parent-navigation/parent-section-screen";

export default function ParentSettingsRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    childAccessCode?: string;
    childName?: string;
    childProfileId?: string;
    householdId?: string;
  }>();

  return (
    <ParentSectionScreen
      currentTab="settings"
      description="Household settings, plan details, and parent controls will live here."
      onOpenChildren={() =>
        router.push({ pathname: "/parent/children", params })
      }
      onOpenChores={() =>
        router.push({ pathname: "/parent/chores", params })
      }
      onOpenDashboard={() =>
        router.push({ pathname: "/parent/dashboard", params })
      }
      title="Settings"
    />
  );
}
