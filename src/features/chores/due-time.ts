/**
 * Chore "due by" times. A deadline is a wall-clock time-of-day stored as a 24h
 * "HH:MM" string (or null = no specific time / "Anytime"). Recurring templates
 * keep the string; the database turns it into a concrete `due_at` per instance,
 * in the household's timezone. One-off chores resolve to a concrete instant on
 * the device (see `dueAtFromTime`).
 */
export type DueTime = string | null;

/** Picker options — common chore o'clocks, no free-form entry (keeps it one tap). */
export const DUE_TIME_PRESETS: { label: string; value: DueTime }[] = [
  { label: "Anytime", value: null },
  { label: "8:00 AM", value: "08:00" },
  { label: "12:00 PM", value: "12:00" },
  { label: "3:00 PM", value: "15:00" },
  { label: "4:00 PM", value: "16:00" },
  { label: "5:00 PM", value: "17:00" },
  { label: "6:00 PM", value: "18:00" },
  { label: "8:00 PM", value: "20:00" },
];

/** The default a new chore starts on — late afternoon, after school. */
export const DEFAULT_DUE_TIME: DueTime = "16:00";

/** "16:00" → "4:00 PM". Null/empty → null. */
export function formatDueTime(value: DueTime): string | null {
  if (!value) {
    return null;
  }
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) {
    return null;
  }
  const period = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

/**
 * Human label for a one-off chore's resolved deadline, e.g. "Due today, 4:00 PM"
 * or "Due tomorrow, 4:00 PM" — so the parent sees that a time already past today
 * rolls to tomorrow, instead of it looking like a bug. Null for "Anytime".
 */
export function describeOneOffDue(value: DueTime, now: Date = new Date()): string | null {
  const iso = dueAtFromTime(value, now);
  if (!iso) {
    return null;
  }
  const due = new Date(iso);
  const sameDay =
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate();
  return `Due ${sameDay ? "today" : "tomorrow"}, ${formatDueAtTime(iso)}`;
}

/** An ISO `due_at` instant → friendly local "4:00 PM". Null/invalid → null. */
export function formatDueAtTime(iso: string | null | undefined): string | null {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  let hour = date.getHours();
  const minute = date.getMinutes();
  const period = hour < 12 ? "AM" : "PM";
  hour = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour}:${minute.toString().padStart(2, "0")} ${period}`;
}

/**
 * The concrete instant a one-off chore is due: today at the chosen wall-clock,
 * or tomorrow if that time has already passed. Returns an ISO string (or null
 * for "Anytime"). Recurring chores don't use this — the DB computes their
 * `due_at` per period.
 */
export function dueAtFromTime(value: DueTime, now: Date = new Date()): string | null {
  if (!value) {
    return null;
  }
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) {
    return null;
  }
  const due = new Date(now);
  due.setHours(h, m, 0, 0);
  if (due.getTime() <= now.getTime()) {
    due.setDate(due.getDate() + 1);
  }
  return due.toISOString();
}
