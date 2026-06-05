import { useRouter } from "expo-router";

import { createDefaultParentAuthActions } from "@/features/auth/default-parent-auth-actions";
import { OnboardingFlow, type OnboardingAuth } from "@/features/onboarding/onboarding-flow";
import { persistOnboardingForSignedInParent } from "@/features/onboarding/default-onboarding-persistence";

export default function IndexRoute() {
  const router = useRouter();
  const parentAuth = createDefaultParentAuthActions();

  // Email 6-digit OTP: sendMagicLink emails the code; verifyEmailOtp checks it.
  const auth: OnboardingAuth = {
    sendEmailCode: (email) => parentAuth.sendMagicLink(email),
    verifyEmailCode: (email, code) => parentAuth.verifyEmailOtp(email, code),
  };

  return (
    <OnboardingFlow
      auth={auth}
      persist={persistOnboardingForSignedInParent}
      onComplete={(result, persisted) => {
        if (result.role === "parent") {
          router.push({
            pathname: "/parent/home",
            params: { householdId: persisted?.householdId ?? "" },
          });
        } else {
          router.push({
            pathname: "/child/home",
            params: { accessCode: result.code, childName: result.kidName },
          });
        }
      }}
    />
  );
}
