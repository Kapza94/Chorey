import { useLocalSearchParams, useRouter } from "expo-router";

import { AuthCallbackScreen } from "@/features/auth/auth-callback-screen";
import { createDefaultParentAuthActions } from "@/features/auth/default-parent-auth-actions";

export default function AuthCallbackRoute() {
  const params = useLocalSearchParams<{
    code?: string;
    error?: string;
    error_description?: string;
  }>();
  const router = useRouter();
  const auth = createDefaultParentAuthActions();

  const code = typeof params.code === "string" ? params.code : undefined;
  const errorMessage =
    (typeof params.error_description === "string"
      ? params.error_description
      : undefined) ??
    (typeof params.error === "string" ? params.error : undefined);

  return (
    <AuthCallbackScreen
      code={code}
      errorMessage={errorMessage}
      actions={{ exchangeCode: auth.exchangeCode }}
      // Hand back to index: it re-checks the session and routes the signed-in
      // parent to their household (or the create-household screen).
      onSignedIn={() => router.replace("/")}
      onBackToSignIn={() => router.replace("/")}
    />
  );
}
