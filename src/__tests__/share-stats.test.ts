import {
  aggregateShareStats,
  hasShareableWeek,
  shareCaptionFor,
} from "@/features/parent-app/share-stats";
import type { ParentKid } from "@/features/parent-app/parent-primitives";

function kid(overrides: Partial<ParentKid>): ParentKid {
  return {
    id: "k",
    name: "Kid",
    tone: "allowance",
    earnedCents: 0,
    allowanceCents: 0,
    savingsCents: 0,
    givingCents: 0,
    choresDone: 0,
    choresTotal: 0,
    pendingApprovals: 0,
    cadence: "weekly",
    budgetCents: 0,
    assignedCents: 0,
    ...overrides,
  };
}

describe("aggregateShareStats", () => {
  it("sums chores, earnings, counts kids, and takes the top level", () => {
    const stats = aggregateShareStats([
      kid({ choresDone: 4, earnedCents: 500, level: 3 }),
      kid({ choresDone: 7, earnedCents: 1250, level: 8 }),
    ]);

    expect(stats).toEqual({
      kidCount: 2,
      choresDone: 11,
      earnedCents: 1750,
      topLevel: 8,
    });
  });

  it("returns zeros for an empty household", () => {
    expect(aggregateShareStats([])).toEqual({
      kidCount: 0,
      choresDone: 0,
      earnedCents: 0,
      topLevel: 0,
    });
  });

  it("never counts negative chore or earning values", () => {
    const stats = aggregateShareStats([kid({ choresDone: -2, earnedCents: -100 })]);
    expect(stats.choresDone).toBe(0);
    expect(stats.earnedCents).toBe(0);
  });

  it("treats a missing level as zero", () => {
    expect(aggregateShareStats([kid({})]).topLevel).toBe(0);
  });
});

describe("hasShareableWeek", () => {
  it("is true once at least one chore is done", () => {
    expect(hasShareableWeek({ kidCount: 1, choresDone: 1, earnedCents: 0, topLevel: 0 })).toBe(true);
  });

  it("is false with no chores done", () => {
    expect(hasShareableWeek({ kidCount: 3, choresDone: 0, earnedCents: 0, topLevel: 0 })).toBe(false);
  });
});

describe("shareCaptionFor", () => {
  it("includes the chore count, formatted earnings, and the fixed split", () => {
    const caption = shareCaptionFor(
      { kidCount: 2, choresDone: 11, earnedCents: 1750, topLevel: 8 },
      "USD",
    );

    expect(caption).toContain("11 chores");
    expect(caption).toContain("$17.50");
    expect(caption).toContain("40% spend · 40% save · 20% give");
    expect(caption).toContain("#Chorey");
  });

  it("uses the singular for a single chore", () => {
    const caption = shareCaptionFor(
      { kidCount: 1, choresDone: 1, earnedCents: 0, topLevel: 0 },
      "USD",
    );
    expect(caption).toContain("1 chore ");
    expect(caption).not.toContain("1 chores");
  });

  it("names no child (privacy)", () => {
    const caption = shareCaptionFor(
      { kidCount: 1, choresDone: 3, earnedCents: 0, topLevel: 0 },
      "EUR",
    );
    expect(caption).toContain("my family");
  });

  it("respects the household currency", () => {
    const caption = shareCaptionFor(
      { kidCount: 1, choresDone: 3, earnedCents: 1500, topLevel: 0 },
      "EUR",
    );
    expect(caption).toContain("€15,00");
  });
});
