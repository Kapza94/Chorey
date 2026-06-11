import {
  canAddChild,
  canUseRecurringChores,
  isEntitled,
  resolveHouseholdEntitlement,
} from "@/features/entitlements/entitlements";

describe("entitlements", () => {
  it.each([
    [{ status: "trialing" }, "trialing"],
    [{ status: "active" }, "active"],
    [{ status: "lapsed" }, "lapsed"],
  ] as const)("resolves %p to %s", (state, expected) => {
    expect(resolveHouseholdEntitlement(state)).toEqual(expected);
  });

  it("treats a missing entitlement record as lapsed — never as free access", () => {
    expect(resolveHouseholdEntitlement(null)).toEqual("lapsed");
  });

  it("entitles trialing and active households equally (full-feature trial)", () => {
    expect(isEntitled("trialing")).toBe(true);
    expect(isEntitled("active")).toBe(true);
    expect(isEntitled("lapsed")).toBe(false);
  });

  it("never limits how many children an entitled household adds", () => {
    expect(canAddChild({ status: "trialing", currentChildCount: 0 })).toBe(true);
    expect(canAddChild({ status: "trialing", currentChildCount: 7 })).toBe(true);
    expect(canAddChild({ status: "active", currentChildCount: 12 })).toBe(true);
  });

  it("blocks lapsed households from adding children", () => {
    expect(canAddChild({ status: "lapsed", currentChildCount: 0 })).toBe(false);
  });

  it("allows recurring chores while trialing or active, pauses them when lapsed", () => {
    expect(canUseRecurringChores("trialing")).toBe(true);
    expect(canUseRecurringChores("active")).toBe(true);
    expect(canUseRecurringChores("lapsed")).toBe(false);
  });
});
