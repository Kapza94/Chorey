import { choreyTheme } from "@/theme/chorey-theme";

describe("choreyTheme", () => {
  it("names the three fixed money buckets", () => {
    expect(choreyTheme.buckets.spend.label).toBe("Spend");
    expect(choreyTheme.buckets.savings.label).toBe("Savings");
    expect(choreyTheme.buckets.giving.label).toBe("Giving");
  });

  it("uses warm non-white and non-black neutrals", () => {
    expect(choreyTheme.colors.cream2).not.toBe("#FFFFFF");
    expect(choreyTheme.colors.ink1).not.toBe("#000000");
  });
});

