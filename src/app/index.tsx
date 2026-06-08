import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

import { createDefaultParentAuthActions } from "@/features/auth/default-parent-auth-actions";
import { getPrimaryHouseholdId } from "@/features/household/default-household-actions";
import { OnboardingFlow, type OnboardingAuth } from "@/features/onboarding/onboarding-flow";
import { persistOnboardingForSignedInParent } from "@/features/onboarding/default-onboarding-persistence";
import { supabase } from "@/lib/supabase";

export default function IndexRoute() {
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);
  const parentAuth = createDefaultParentAuthActions();

  useEffect(() => {
    let active = true;

    async function resolveSignedInParent() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      if (!session) {
        setSessionChecked(true);
        return;
      }

      const householdId = await getPrimaryHouseholdId();
      if (!active) return;

      if (householdId) {
        router.replace({ pathname: "/parent/home", params: { householdId } });
      } else {
        router.replace("/parent/household/new");
      }
    }

    void resolveSignedInParent();

    return () => {
      active = false;
    };
  }, [router]);

  if (!sessionChecked) {
    return null;
  }

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
