import { useLocalSearchParams, useRouter } from "expo-router";

import { ParentChildrenScreen } from "@/features/parent-children/parent-children-screen";

export default function ParentChildrenRoute() {
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

  return (
    <ParentChildrenScreen
      childAccessCode={childAccessCode}
      childName={childName}
      onAddChild={() =>
        router.push({ pathname: "/parent/children/new", params })
      }
      onOpenChores={() =>
        router.push({ pathname: "/parent/chores", params })
      }
      onOpenChildAccess={() => router.push("/child/access")}
      onOpenDashboard={() =>
        router.push({ pathname: "/parent/dashboard", params })
      }
      onOpenSettings={() =>
        router.push({ pathname: "/parent/settings", params })
      }
    />
  );
}
