import {
  expectedOccurrences,
  rewardPerOccurrenceCents,
} from "@/features/chores/budget-allocation";

describe("expectedOccurrences", () => {
  it("counts daily/weekly/monthly within a weekly period", () => {
    expect(expectedOccurrences("daily", "weekly")).toBe(7);
    expect(expectedOccurrences("weekly", "weekly")).toBe(1);
    expect(expectedOccurrences("monthly", "weekly")).toBe(1);
  });

  it("counts daily/weekly/monthly within a monthly period", () => {
    expect(expectedOccurrences("daily", "monthly")).toBe(30);
    expect(expectedOccurrences("weekly", "monthly")).toBe(4);
    expect(expectedOccurrences("monthly", "monthly")).toBe(1);
  });
});

describe("rewardPerOccurrenceCents", () => {
  it("splits the weekly allowance evenly across every expected completion", () => {
    // $7.00 / week, one daily chore = 7 completions → $1.00 each
    expect(
      rewardPerOccurrenceCents(700, "weekly", [{ recurrence: "daily" }]),
    ).toBe(100);
  });

  it("makes 'do everything' earn the whole allowance", () => {
    // one daily ($1 ×7) + one weekly ($1 ×1) = 8 completions, $8.00 budget
    const chores = [
      { recurrence: "daily" as const },
      { recurrence: "weekly" as const },
    ];
    const each = rewardPerOccurrenceCents(800, "weekly", chores);
    expect(each).toBe(100);
    const totalIfAllDone = each * (7 + 1);
    expect(totalIfAllDone).toBe(800);
  });

  it("treats every completion as equal pay regardless of frequency", () => {
    // monthly allowance $30, one daily chore (30 completions) → $1.00 each
    expect(
      rewardPerOccurrenceCents(3000, "monthly", [{ recurrence: "daily" }]),
    ).toBe(100);
  });

  it("rounds to the nearest cent", () => {
    // $5.00 / week across 7 daily completions = 71.43c → 71c
    expect(
      rewardPerOccurrenceCents(500, "weekly", [{ recurrence: "daily" }]),
    ).toBe(71);
  });

  it("returns 0 when there is no budget", () => {
    expect(
      rewardPerOccurrenceCents(0, "weekly", [{ recurrence: "daily" }]),
    ).toBe(0);
  });

  it("returns 0 when there are no chores to do", () => {
    expect(rewardPerOccurrenceCents(2000, "weekly", [])).toBe(0);
  });
});
