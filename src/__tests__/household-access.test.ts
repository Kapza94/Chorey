import {
  canReadChildProfile,
  getMemberRole,
  type HouseholdMember,
} from "@/domain/household/access";

const members: HouseholdMember[] = [
  { userId: "parent-1", householdId: "home-1", role: "parent_admin" },
  { userId: "child-1", householdId: "home-1", role: "child", childProfileId: "mia" },
  { userId: "child-2", householdId: "home-1", role: "child", childProfileId: "leo" },
  { userId: "other-parent", householdId: "home-2", role: "parent_admin" },
];

describe("household access", () => {
  it("identifies a member role inside a household", () => {
    expect(getMemberRole(members, "parent-1", "home-1")).toBe("parent_admin");
    expect(getMemberRole(members, "missing", "home-1")).toBeNull();
  });

  it("allows parents to read child profiles in their household", () => {
    expect(canReadChildProfile(members, "parent-1", "home-1", "mia")).toBe(true);
    expect(canReadChildProfile(members, "parent-1", "home-1", "leo")).toBe(true);
  });

  it("allows children to read only their own profile", () => {
    expect(canReadChildProfile(members, "child-1", "home-1", "mia")).toBe(true);
    expect(canReadChildProfile(members, "child-1", "home-1", "leo")).toBe(false);
  });

  it("blocks users outside the household", () => {
    expect(canReadChildProfile(members, "other-parent", "home-1", "mia")).toBe(false);
  });
});

