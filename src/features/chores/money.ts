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
