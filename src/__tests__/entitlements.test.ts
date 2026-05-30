import {
  canAddChild,
  resolveHouseholdEntitlement,
} from "@/features/entitlements/entitlements";

describe("entitlements", () => {
  it.each([
    [null, "free"],
    [{ status: "trialing" }, "paid"],
    [{ status: "active" }, "paid"],
    [{ status: "lapsed" }, "lapsed"],
  ] as const)("resolves %p to %s access", (state, expected) => {
    expect(resolveHouseholdEntitlement(state)).toEqual(expected);
  });

  it("limits free households to one child", () => {
    expect(canAddChild({ access: "free", currentChildCount: 0 })).toBe(true);
    expect(canAddChild({ access: "free", currentChildCount: 1 })).toBe(false);
  });

  it("allows paid and trial households to add more children", () => {
    expect(canAddChild({ access: "paid", currentChildCount: 3 })).toBe(true);
  });

  it("blocks lapsed households from adding more children", () => {
    expect(canAddChild({ access: "lapsed", currentChildCount: 0 })).toBe(false);
  });
});
