import { Redirect, useLocalSearchParams } from "expo-router";

/**
 * The legacy parent dashboard has been replaced by the redesigned parent app at
 * /parent/home. This route now just forwards there so any lingering link (or an
 * old deep link) lands on the current UI instead of the retired screen.
 */
export default function ParentDashboardRoute() {
  const params = useLocalSearchParams<{ householdId?: string }>();
  const householdId = Array.isArray(params.householdId)
    ? params.householdId[0]
    : params.householdId;

  return (
    <Redirect href={{ pathname: "/parent/home", params: { householdId: householdId ?? "" } }} />
  );
}
