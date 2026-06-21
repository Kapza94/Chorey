import { clampRewardInput, splitRewardCents } from "@/features/chores/money";

describe("clampRewardInput", () => {
  it("keeps a clean money value untouched", () => {
    expect(clampRewardInput("12.50")).toBe("12.50");
    expect(clampRewardInput("8")).toBe("8");
  });

  it("caps the fraction at two decimals so parseRewardCents never rejects it", () => {
    expect(clampRewardInput("12.999")).toBe("12.99");
  });

  it("strips letters and collapses extra decimal points", () => {
    expect(clampRewardInput("1a2.3b4")).toBe("12.34");
    expect(clampRewardInput("1.2.3")).toBe("1.23");
  });
});

describe("money helpers", () => {
  it("splits approved rewards into the fixed 40 / 40 / 20 buckets", () => {
    expect(splitRewardCents(1000)).toEqual({
      spendCents: 400,
      savingsCents: 400,
      givingCents: 200,
    });
  });

  it("keeps odd cents deterministic without losing money", () => {
    expect(splitRewardCents(103)).toEqual({
      spendCents: 41,
      savingsCents: 41,
      givingCents: 21,
    });
  });

  it("splits zero rewards into empty balances", () => {
    expect(splitRewardCents(0)).toEqual({
      spendCents: 0,
      savingsCents: 0,
      givingCents: 0,
    });
  });
});
