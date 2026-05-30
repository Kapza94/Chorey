import { splitRewardCents } from "@/features/chores/money";

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
