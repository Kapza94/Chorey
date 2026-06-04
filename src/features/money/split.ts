import type { BucketBalances } from "@/features/chores/money";

/**
 * The 40/40/20 model — configurable per family.
 *
 * Every earning splits into spend / save / give. The split is editable
 * (Spend and Give adjust in steps of 5; **Save auto-balances** so the three
 * always sum to 100). Savings is **locked** — there is no spend path out of it.
 */
export type Split = {
  /** allowance — peach. spendable now. */
  spend: number;
  /** locked savings — lilac. */
  save: number;
  /** giving — sage. given to a cause in real life. */
  give: number;
};

export const DEFAULT_SPLIT: Split = { spend: 40, save: 40, give: 20 };

/** Step size for the Spend/Give steppers in the split editor. */
export const SPLIT_STEP = 5;

/** Clamp to [0, 100]. */
function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Produce a valid split from desired spend/give percentages, with Save taking
 * up the remainder (never negative). Use this from the split-editor steppers.
 */
export function balanceSplit(spend: number, give: number): Split {
  const nextSpend = clamp(spend);
  const nextGive = clamp(give);
  const overflow = Math.max(0, nextSpend + nextGive - 100);

  // If spend+give exceed 100, trim give first so spend keeps the user's intent.
  const trimmedGive = nextGive - overflow;
  const save = clamp(100 - nextSpend - trimmedGive);

  return { spend: nextSpend, save, give: clamp(trimmedGive) };
}

export function isValidSplit(split: Split): boolean {
  return (
    split.spend >= 0 &&
    split.save >= 0 &&
    split.give >= 0 &&
    split.spend + split.save + split.give === 100
  );
}

/**
 * Split an integer cents amount across the buckets using the given percentages,
 * distributing rounding remainders largest-first (spend → save → give on ties)
 * so no cent is lost. Generalizes the fixed-split `splitRewardCents`.
 */
export function splitCents(
  cents: number,
  split: Split = DEFAULT_SPLIT,
): BucketBalances {
  if (!Number.isInteger(cents) || cents < 0) {
    throw new Error("Amount must be a whole number of cents, zero or more.");
  }
  if (!isValidSplit(split)) {
    throw new Error("Split percentages must be non-negative and sum to 100.");
  }

  const buckets = [
    { key: "spendCents", percent: split.spend, order: 0 },
    { key: "savingsCents", percent: split.save, order: 1 },
    { key: "givingCents", percent: split.give, order: 2 },
  ] as const;

  const result: BucketBalances = { spendCents: 0, savingsCents: 0, givingCents: 0 };
  const remainders = buckets.map((bucket) => {
    const raw = cents * bucket.percent;
    result[bucket.key] = Math.floor(raw / 100);

    return { key: bucket.key, order: bucket.order, remainder: raw % 100 };
  });

  const assigned = result.spendCents + result.savingsCents + result.givingCents;
  const leftover = cents - assigned;

  remainders
    .sort((left, right) =>
      right.remainder !== left.remainder
        ? right.remainder - left.remainder
        : left.order - right.order,
    )
    .slice(0, leftover)
    .forEach((bucket) => {
      result[bucket.key] += 1;
    });

  return result;
}
