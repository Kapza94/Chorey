import { useRouter } from "expo-router";

import { createHouseholdForSignedInParent } from "@/features/household/default-household-actions";
import { HouseholdSetupScreen } from "@/features/household/household-setup-screen";

export default function NewHouseholdRoute() {
  const router = useRouter();

  return (
    <HouseholdSetupScreen
      onBack={() => router.back()}
      onCreateHousehold={createHouseholdForSignedInParent}
      onHouseholdCreated={(household) =>
        router.replace({
          pathname: "/parent/children/new",
          params: { householdId: household.id },
        })
      }
    />
  );
}
