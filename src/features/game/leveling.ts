/**
 * Chorey leveling — the kid-side game layer.
 *
 * Every APPROVED chore earns points (money is the allowance; points are the
 * game). Levels run 1..100 and each level costs more than the last, so early
 * levels land fast (level 2 after a single chore) while the top takes years
 * of steady habits.
 *
 * Curve: advancing from level n to n+1 costs `10 * n` points, so the points
 * needed to REACH level L is the triangular sum `5 * L * (L - 1)`.
 * Level 100 sits at 49,500 lifetime points.
 */

export const MAX_LEVEL = 100;

const BASE_POINTS = 10;
const CENTS_PER_BONUS_POINT = 50;
const MAX_BONUS_POINTS = 40;
const COST_STEP = 10;

function assertNonNegativeInt(value: number, label: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be zero or more.`);
  }
}

/** Points one approved chore is worth. Zero-reward chores still earn the base. */
export function pointsForChore(valueCents: number): number {
  assertNonNegativeInt(valueCents, "Reward");
  const bonus = Math.min(Math.floor(valueCents / CENTS_PER_BONUS_POINT), MAX_BONUS_POINTS);
  return BASE_POINTS + bonus;
}

/** Points required to move from `level` to `level + 1`. */
export function costToAdvanceFrom(level: number): number {
  return COST_STEP * level;
}

/** Cumulative lifetime points needed to reach `level`. */
export function pointsToReachLevel(level: number): number {
  return (COST_STEP / 2) * level * (level - 1);
}

/** The level a kid with `points` lifetime points has reached (1..MAX_LEVEL). */
export function levelForPoints(points: number): number {
  assertNonNegativeInt(points, "Points");
  // Solve 5L(L-1) <= points for the largest integer L, then guard the float.
  let level = Math.floor((COST_STEP / 2 + Math.sqrt((COST_STEP / 2) ** 2 + 2 * COST_STEP * points)) / COST_STEP);
  while (pointsToReachLevel(level + 1) <= points) level++;
  while (level > 1 && pointsToReachLevel(level) > points) level--;
  return Math.min(Math.max(level, 1), MAX_LEVEL);
}

export type LevelProgress = {
  level: number;
  /** points earned past the current level's threshold */
  intoLevel: number;
  /** points the next level costs (0 at MAX_LEVEL) */
  neededForNext: number;
  /** 0..1 progress toward the next level (1 at MAX_LEVEL) */
  ratio: number;
};

export function levelProgress(points: number): LevelProgress {
  const level = levelForPoints(points);
  if (level >= MAX_LEVEL) {
    return { level: MAX_LEVEL, intoLevel: 0, neededForNext: 0, ratio: 1 };
  }
  const intoLevel = points - pointsToReachLevel(level);
  const neededForNext = costToAdvanceFrom(level);
  return { level, intoLevel, neededForNext, ratio: intoLevel / neededForNext };
}
