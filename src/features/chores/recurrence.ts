export type Recurrence = "daily" | "weekly" | "monthly";

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toIsoDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/**
 * The UTC date on which the recurrence period containing `date` begins:
 * - daily   → that day
 * - weekly  → the Monday of that week
 * - monthly → the first of that month
 */
export function periodStart(recurrence: Recurrence, date: Date): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  if (recurrence === "monthly") {
    return new Date(Date.UTC(year, month, 1));
  }

  if (recurrence === "weekly") {
    const dow = new Date(Date.UTC(year, month, day)).getUTCDay(); // 0=Sun … 6=Sat
    const daysSinceMonday = (dow + 6) % 7;
    return new Date(Date.UTC(year, month, day - daysSinceMonday));
  }

  return new Date(Date.UTC(year, month, day));
}

/**
 * A stable string key for the recurrence period containing `date`, used to
 * deduplicate generated instances (one per template per period).
 */
export function periodKey(recurrence: Recurrence, date: Date): string {
  return toIsoDate(periodStart(recurrence, date));
}
