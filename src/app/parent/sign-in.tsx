import { useRouter } from "expo-router";

import { createDefaultParentAuthActions } from "@/features/auth/default-parent-auth-actions";
import { getPrimaryHouseholdId } from "@/features/household/default-household-actions";
import { ParentSignInScreen } from "@/features/auth/parent-sign-in-screen";

export default function ParentSignInRoute() {
  const router = useRouter();

  return (
    <ParentSignInScreen
      actions={createDefaultParentAuthActions()}
      onSignedIn={async () => {
        // Returning parents land on their app; brand-new accounts set up a
        // household first.
        const householdId = await getPrimaryHouseholdId();
        if (householdId) {
          router.replace({ pathname: "/parent/home", params: { householdId } });
        } else {
          router.replace("/parent/household/new");
        }
      }}
    />
  );
}
