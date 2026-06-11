import {
  MAX_LEVEL,
  costToAdvanceFrom,
  levelForPoints,
  levelProgress,
  pointsForChore,
  pointsToReachLevel,
} from "@/features/game/leveling";

describe("pointsForChore", () => {
  it("awards base points even for zero-reward chores", () => {
    expect(pointsForChore(0)).toBe(10);
  });

  it("adds a point per 50 cents of reward", () => {
    expect(pointsForChore(49)).toBe(10);
    expect(pointsForChore(50)).toBe(11);
    expect(pointsForChore(200)).toBe(14);
  });

  it("caps the reward bonus so big rewards can't buy levels", () => {
    expect(pointsForChore(10_000)).toBe(50);
    expect(pointsForChore(1_000_000)).toBe(50);
  });

  it("rejects invalid reward values", () => {
    expect(() => pointsForChore(-1)).toThrow();
    expect(() => pointsForChore(1.5)).toThrow();
  });
});

describe("level curve", () => {
  it("caps at 100 levels", () => {
    expect(MAX_LEVEL).toBe(100);
    expect(levelForPoints(Number.MAX_SAFE_INTEGER)).toBe(100);
  });

  it("costs more to level up the higher you are", () => {
    expect(costToAdvanceFrom(2)).toBeGreaterThan(costToAdvanceFrom(1));
    expect(costToAdvanceFrom(50)).toBeGreaterThan(costToAdvanceFrom(10));
    expect(costToAdvanceFrom(99)).toBeGreaterThan(costToAdvanceFrom(98));
  });

  it("starts at level 1 and levels up exactly at each threshold", () => {
    expect(levelForPoints(0)).toBe(1);
    expect(levelForPoints(9)).toBe(1);
    expect(levelForPoints(10)).toBe(2); // one chore reaches level 2
    expect(levelForPoints(29)).toBe(2);
    expect(levelForPoints(30)).toBe(3);
  });

  it("matches the cumulative thresholds everywhere", () => {
    for (let level = 2; level <= MAX_LEVEL; level++) {
      const threshold = pointsToReachLevel(level);
      expect(levelForPoints(threshold - 1)).toBe(level - 1);
      expect(levelForPoints(threshold)).toBe(level);
    }
  });

  it("rejects invalid points", () => {
    expect(() => levelForPoints(-1)).toThrow();
    expect(() => levelForPoints(0.5)).toThrow();
  });
});

describe("levelProgress", () => {
  it("reports progress within the current level", () => {
    expect(levelProgress(0)).toEqual({
      level: 1,
      intoLevel: 0,
      neededForNext: 10,
      ratio: 0,
    });
    // 15 points: level 2 (threshold 10), 5 into the 20 needed for level 3.
    expect(levelProgress(15)).toEqual({
      level: 2,
      intoLevel: 5,
      neededForNext: 20,
      ratio: 0.25,
    });
  });

  it("pins max level at full progress", () => {
    const atMax = levelProgress(pointsToReachLevel(MAX_LEVEL));
    expect(atMax.level).toBe(MAX_LEVEL);
    expect(atMax.neededForNext).toBe(0);
    expect(atMax.ratio).toBe(1);
  });
});
