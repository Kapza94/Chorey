import { useState } from "react";

import { KidApp } from "@/features/kid-home/kid-app";
import {
  getOnboardingResult,
  kidPreviewFromResult,
} from "@/features/onboarding/onboarding-handoff";
import type { KidChore } from "@/features/kid-home/kid-home-screen";

/**
 * Preview route for the redesigned kid app, seeded from onboarding. Real
 * Supabase wiring is the next step; this makes the redesign walkable in-sim.
 */
export default function ChildHomeRoute() {
  const result = getOnboardingResult();
  const seed = kidPreviewFromResult(result);
  const [chores, setChores] = useState<KidChore[]>(seed.chores);

  return (
    <KidApp
      name={seed.name}
      streakDays={4}
      currency={seed.currency}
      split={seed.split}
      chores={chores}
      onToggleChore={(id) =>
        setChores((current) =>
          current.map((chore) =>
            chore.id === id ? { ...chore, done: !chore.done } : chore,
          ),
        )
      }
      spendableCents={1240}
      wishes={[
        { id: "w1", name: "Skateboard", targetCents: 6500, status: "active" },
        { id: "w2", name: "New book", targetCents: 1400, status: "active" },
      ]}
      savingsCents={1280}
      givingCents={320}
      causeName="Animals"
      givenCents={120}
    />
  );
}
