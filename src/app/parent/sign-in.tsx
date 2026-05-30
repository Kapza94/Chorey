import { useRouter } from "expo-router";

import { createDefaultParentAuthActions } from "@/features/auth/default-parent-auth-actions";
import { ParentSignInScreen } from "@/features/auth/parent-sign-in-screen";

export default function ParentSignInRoute() {
  const router = useRouter();

  return (
    <ParentSignInScreen
      actions={createDefaultParentAuthActions()}
      onSignedIn={() => router.replace("/parent/household/new")}
    />
  );
}
