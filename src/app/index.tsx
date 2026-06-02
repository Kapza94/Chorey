import { useRouter } from "expo-router";

import { OnboardingFlow } from "@/features/onboarding/onboarding-flow";
import { setOnboardingResult } from "@/features/onboarding/onboarding-handoff";

export default function IndexRoute() {
  const router = useRouter();

  return (
    <OnboardingFlow
      onComplete={(result) => {
        setOnboardingResult(result);
        if (result.role === "parent") {
          router.push("/parent/home");
        } else {
          router.push("/child/home");
        }
      }}
    />
  );
}
