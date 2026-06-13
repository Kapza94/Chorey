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

/**
 * A recurring chore is *late* when the period it belongs to has fully elapsed
 * and the child still hasn't done it. A daily chore from yesterday that's still
 * `assigned` or `sent_back` is late; today's is merely to-do. Period keys are
 * lexicographically ordered ISO dates, so a plain string compare works for
 * daily, weekly, and monthly alike. Submitted/approved chores are never late —
 * the child has done their part.
 */
export function isRecurringChoreLate(
  chore: {
    recurrence?: Recurrence | null;
    periodKey?: string | null;
    status: "assigned" | "submitted" | "approved" | "sent_back";
  },
  now: Date = new Date(),
): boolean {
  if (!chore.recurrence || !chore.periodKey) {
    return false;
  }
  if (chore.status === "approved" || chore.status === "submitted") {
    return false;
  }
  return chore.periodKey < periodKey(chore.recurrence, now);
}
