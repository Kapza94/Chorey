/**
 * Shareable weekly stats — pure aggregation + caption.
 *
 * The parent can show off the household's week on social media. To stay on the
 * right side of children's-privacy law (COPPA / GDPR-K), the shared card carries
 * **only household-level, non-identifying aggregates** — never a child's name,
 * photo, age, or individual balance. This module derives those aggregates from
 * the same `ParentKid[]` the Kids screen already has, so the card can never leak
 * more than the screen shows.
 */
import { buckets } from "@/theme/chorey-theme";
import { formatMoney, type CurrencyCode } from "@/features/money/currency";
import type { ParentKid } from "@/features/parent-app/parent-primitives";

export type ShareStats = {
  /** how many children took part this week */
  kidCount: number;
  /** approved chores across all children this week */
  choresDone: number;
  /** total earned across all children this week, in integer cents */
  earnedCents: number;
  /** the highest game level any child has reached (0 when none) */
  topLevel: number;
};

/** Sum the household's week into the non-identifying aggregates the card shows. */
export function aggregateShareStats(kids: ParentKid[]): ShareStats {
  return {
    kidCount: kids.length,
    choresDone: kids.reduce((total, kid) => total + Math.max(0, kid.choresDone), 0),
    earnedCents: kids.reduce((total, kid) => total + Math.max(0, kid.earnedCents), 0),
    topLevel: kids.reduce((best, kid) => Math.max(best, kid.level ?? 0), 0),
  };
}

/** True when there is anything worth sharing (at least one approved chore). */
export function hasShareableWeek(stats: ShareStats): boolean {
  return stats.choresDone > 0;
}

const plural = (count: number, one: string, many: string) =>
  count === 1 ? one : many;

/**
 * The caption that rides along with the shared image (and is the whole payload
 * when the OS share target only takes text). Mentions no child by name.
 */
export function shareCaptionFor(
  stats: ShareStats,
  currency: CurrencyCode,
): string {
  const chores = `${stats.choresDone} ${plural(stats.choresDone, "chore", "chores")}`;
  const earned = formatMoney(stats.earnedCents, currency);
  const split = `${buckets.spend.percent}% spend · ${buckets.savings.percent}% save · ${buckets.giving.percent}% give`;

  return (
    `This week my family crushed ${chores} on Chorey and earned ${earned} 🎉\n` +
    `Every reward splits ${split}.\n` +
    `#Chorey`
  );
}
