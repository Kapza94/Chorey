import { useRouter } from "expo-router";

import { OnboardingFlow } from "@/features/onboarding/onboarding-flow";

export default function OnboardingRoute() {
  const router = useRouter();

  return (
    <OnboardingFlow
      onComplete={(result) => {
        // Presentation-complete. Persisting the collected setup (household +
        // country/currency, kids, split/budget, chores, charities) to Supabase
        // is the next wiring step; for now route into the matching app surface.
        if (result.role === "parent") {
          router.replace("/parent/dashboard");
        } else {
          router.replace("/child/access");
        }
      }}
    />
  );
}
