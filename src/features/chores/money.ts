export type BucketBalances = {
  spendCents: number;
  savingsCents: number;
  givingCents: number;
};

export function parseRewardCents(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return 0;
  }

  const match = normalized.match(/^(\d+)(?:\.(\d{0,2}))?$/);

  if (!match) {
    throw new Error("Reward must be a valid amount.");
  }

  const pounds = Number(match[1]);
  const cents = Number((match[2] ?? "").padEnd(2, "0"));

  return pounds * 100 + cents;
}

export function formatReward(cents: number) {
  return (cents / 100).toFixed(2);
}

export function splitRewardCents(cents: number): BucketBalances {
  if (!Number.isInteger(cents) || cents < 0) {
    throw new Error("Reward must be zero or more.");
  }

  const buckets = [
    { key: "spendCents", percent: 40, order: 0 },
    { key: "savingsCents", percent: 40, order: 1 },
    { key: "givingCents", percent: 20, order: 2 },
  ] as const;
  const split = {
    givingCents: 0,
    savingsCents: 0,
    spendCents: 0,
  };
  const remainders = buckets.map((bucket) => {
    const raw = cents * bucket.percent;
    split[bucket.key] = Math.floor(raw / 100);

    return {
      key: bucket.key,
      order: bucket.order,
      remainder: raw % 100,
    };
  });
  const assigned = split.spendCents + split.savingsCents + split.givingCents;
  const remaining = cents - assigned;

  remainders
    .sort((left, right) => {
      if (right.remainder !== left.remainder) {
        return right.remainder - left.remainder;
      }

      return left.order - right.order;
    })
    .slice(0, remaining)
    .forEach((bucket) => {
      split[bucket.key] += 1;
    });

  return split;
}
