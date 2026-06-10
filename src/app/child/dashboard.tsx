import { Redirect, useLocalSearchParams } from "expo-router";

/**
 * The legacy kid dashboard route. The kid app lives at `/child/home`, which
 * also resolves and persists the device session; this route only forwards.
 */
export default function ChildDashboardRoute() {
  const params = useLocalSearchParams<{ accessCode?: string; childName?: string }>();

  return (
    <Redirect
      href={{
        pathname: "/child/home",
        params: {
          accessCode: params.accessCode ?? "",
          childName: params.childName ?? "",
        },
      }}
    />
  );
}
