import {
  DEFAULT_SPLIT,
  balanceSplit,
  isValidSplit,
  splitCents,
} from "@/features/money/split";

describe("split configuration", () => {
  it("defaults to 40 / 40 / 20", () => {
    expect(DEFAULT_SPLIT).toEqual({ spend: 40, save: 40, give: 20 });
    expect(isValidSplit(DEFAULT_SPLIT)).toBe(true);
  });

  it("auto-balances Save when Spend or Give change", () => {
    expect(balanceSplit(50, 20)).toEqual({ spend: 50, save: 30, give: 20 });
    expect(balanceSplit(60, 30)).toEqual({ spend: 60, save: 10, give: 30 });
  });

  it("never lets Save go negative — trims Give first on overflow", () => {
    const result = balanceSplit(80, 40);
    expect(result.spend + result.save + result.give).toBe(100);
    expect(result.save).toBeGreaterThanOrEqual(0);
    expect(result).toEqual({ spend: 80, save: 0, give: 20 });
  });

  it("clamps out-of-range inputs", () => {
    expect(balanceSplit(-10, 0)).toEqual({ spend: 0, save: 100, give: 0 });
    expect(balanceSplit(120, 0)).toEqual({ spend: 100, save: 0, give: 0 });
  });
});

describe("splitCents", () => {
  it("matches the fixed 40 / 40 / 20 split", () => {
    expect(splitCents(1000)).toEqual({
      spendCents: 400,
      savingsCents: 400,
      givingCents: 200,
    });
  });

  it("keeps odd cents deterministic without losing money", () => {
    const result = splitCents(103);
    expect(result.spendCents + result.savingsCents + result.givingCents).toBe(103);
    expect(result).toEqual({ spendCents: 41, savingsCents: 41, givingCents: 21 });
  });

  it("honors a custom split", () => {
    expect(splitCents(1000, { spend: 50, save: 30, give: 20 })).toEqual({
      spendCents: 500,
      savingsCents: 300,
      givingCents: 200,
    });
  });

  it("rejects an invalid split", () => {
    expect(() => splitCents(1000, { spend: 50, save: 30, give: 30 })).toThrow();
  });
});
