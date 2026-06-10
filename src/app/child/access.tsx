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
          pathname: "/child/home",
          params: {
            accessCode: child.accessCode,
            childName: child.childName,
          },
        })
      }
      onResolveAccessCode={resolveChildAccessCode}
    />
  );
}
