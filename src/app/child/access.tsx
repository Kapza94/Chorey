import { useRouter } from "expo-router";

import { ChildAccessScreen } from "@/features/auth/child-access-screen";
import { resolveChildAccessCode } from "@/features/children/default-child-access-actions";

export default function ChildAccessRoute() {
  const router = useRouter();

  return (
    <ChildAccessScreen
      onBack={() => router.back()}
      onChildAccess={(child) =>
        router.replace({
          pathname: "/child/dashboard",
          params: {
            accessCode: child.accessCode,
            childName: child.childName,
            childProfileId: child.childProfileId,
            householdId: child.householdId,
          },
        })
      }
      onResolveAccessCode={resolveChildAccessCode}
    />
  );
}
