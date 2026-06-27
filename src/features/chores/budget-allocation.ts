import type { Recurrence } from "@/features/chores/recurrence";
import type { SettlementFrequency } from "@/features/household/household-actions";

/**
 * Budget-first pricing. Instead of the parent typing a dollar value per chore,
 * each kid has a per-period allowance (`budget_cents` + `cadence`), and the app
 * shares that allowance across every chore completion the kid is expected to do
 * in the period. Do everything → earn the whole allowance. Skip some → earn
 * less. Each single completion is worth the same, so more-frequent work pays
 * more over the period without the parent doing any math.
 *
 * The derived per-occurrence reward is written into the existing
 * `chore_instances.reward_cents`, so the approval trigger, the 40/40/20 split,
 * and the immutable ledger stay exactly as they are — crediting is still
 * immediate on approval. This is the deliberately small budget-first change.
 */

/** How many times a chore of `recurrence` is expected to be completed in one
 *  settlement period of `cadence`. Integer counts so "do everything = full
 *  allowance" holds cleanly; a monthly daily-chore uses 30 as a stable month. */
export function expectedOccurrences(
  recurrence: Recurrence,
  cadence: SettlementFrequency,
): number {
  if (cadence === "monthly") {
    return { daily: 30, weekly: 4, monthly: 1 }[recurrence];
  }
  // weekly cadence
  return { daily: 7, weekly: 1, monthly: 1 }[recurrence];
}

/**
 * The cents value of a single chore completion, given the kid's allowance and
 * the full set of chores they're expected to do this period. Every completion
 * is worth this same amount; the budget is exhausted only if every expected
 * occurrence is done.
 *
 * Returns 0 when there's no budget or nothing to do (callers must tolerate a
 * zero-reward chore — the ledger already creates no events for those).
 */
export function rewardPerOccurrenceCents(
  budgetCents: number,
  cadence: SettlementFrequency,
  chores: { recurrence: Recurrence }[],
): number {
  if (budgetCents <= 0) {
    return 0;
  }

  const totalOccurrences = chores.reduce(
    (sum, chore) => sum + expectedOccurrences(chore.recurrence, cadence),
    0,
  );

  if (totalOccurrences <= 0) {
    return 0;
  }

  return Math.round(budgetCents / totalOccurrences);
}
