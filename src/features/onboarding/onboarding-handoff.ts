import type { OnboardingResult } from "@/features/onboarding/onboarding-flow";
import type { KidChore } from "@/features/kid-home/kid-home-screen";
import type { ParentKid } from "@/features/parent-app/parent-primitives";
import { splitCents, DEFAULT_SPLIT, type Split } from "@/features/money/split";
import type { CurrencyCode } from "@/features/money/currency";

/**
 * A tiny in-memory handoff so a finished onboarding can seed the (not yet
 * Supabase-wired) Kid/Parent app routes — enough to walk the whole redesign in
 * the simulator. This is preview plumbing, not real persistence.
 */
let lastResult: OnboardingResult | null = null;

export function setOnboardingResult(result: OnboardingResult) {
  lastResult = result;
}

export function getOnboardingResult(): OnboardingResult | null {
  return lastResult;
}

function parentTone(tone: string): ParentKid["tone"] {
  return tone === "savings" || tone === "giving" ? tone : "allowance";
}

/** Build a populated parent view from onboarding (with light sample activity). */
export function parentPreviewFromResult(result: OnboardingResult | null): {
  currency: CurrencyCode;
  split: Split;
  kids: ParentKid[];
} {
  if (!result || result.role !== "parent") {
    return { currency: "USD", split: DEFAULT_SPLIT, kids: [] };
  }

  const choreCount = result.chores.length || 4;
  const kids = result.kids.map((kid, index) => {
    // seed ~60% of budget earned so the meters read meaningfully
    const earnedCents = Math.round(result.budgetCents * 0.6);
    const split = splitCents(earnedCents, result.split);
    return {
      id: `kid-${index}`,
      name: kid.name,
      age: kid.age ? Number(kid.age) : null,
      tone: parentTone(kid.tone),
      earnedCents,
      allowanceCents: split.spendCents,
      savingsCents: split.savingsCents,
      givingCents: split.givingCents,
      choresDone: Math.min(choreCount, index === 0 ? 4 : 3),
      choresTotal: choreCount,
      pendingApprovals: index === 0 ? 2 : 0,
      cadence: result.cadence,
      budgetCents: result.budgetCents,
      assignedCents: Math.round(result.budgetCents * 0.9),
    } satisfies ParentKid;
  });

  return { currency: result.currency, split: result.split, kids };
}

/** Build a populated kid view from onboarding (chores half-checked for demo). */
export function kidPreviewFromResult(result: OnboardingResult | null): {
  name: string;
  currency: CurrencyCode;
  split: Split;
  chores: KidChore[];
} {
  if (!result || result.role !== "kid") {
    return { name: "there", currency: "USD", split: DEFAULT_SPLIT, chores: [] };
  }

  return {
    name: result.kidName,
    currency: "USD",
    split: DEFAULT_SPLIT,
    chores: [
      { id: "c1", name: "Make the bed", valueCents: 100, done: false },
      { id: "c2", name: "Walk the dog", valueCents: 300, done: true },
      { id: "c3", name: "Set the table", valueCents: 100, done: false },
    ],
  };
}
