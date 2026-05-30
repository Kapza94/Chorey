export type HouseholdRole = "parent_admin" | "child";

export type HouseholdMember = {
  userId: string;
  householdId: string;
  role: HouseholdRole;
  childProfileId?: string;
};

export function getMemberRole(
  members: HouseholdMember[],
  userId: string,
  householdId: string,
): HouseholdRole | null {
  return (
    members.find(
      (member) =>
        member.userId === userId && member.householdId === householdId,
    )?.role ?? null
  );
}

export function canReadChildProfile(
  members: HouseholdMember[],
  userId: string,
  householdId: string,
  childProfileId: string,
) {
  const member = members.find(
    (candidate) =>
      candidate.userId === userId && candidate.householdId === householdId,
  );

  if (!member) {
    return false;
  }

  if (member.role === "parent_admin") {
    return true;
  }

  return member.childProfileId === childProfileId;
}

