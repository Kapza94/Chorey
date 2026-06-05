import { createParentKidsActions } from "@/features/parent-app/parent-kids-actions";

function makeClient(rows: any[], error: Error | null = null) {
  const calls: { fn: string; args: Record<string, unknown> }[] = [];
  const client = {
    rpc(fn: string, args: Record<string, unknown>) {
      calls.push({ fn, args });
      return Promise.resolve({ data: rows, error });
    },
  };
  return { client, calls };
}

describe("createParentKidsActions", () => {
  it("maps the RPC rows into ParentKid aggregates", async () => {
    const { client, calls } = makeClient([
      {
        child_profile_id: "kid-1",
        display_name: "Aria",
        age: 9,
        tone: "savings",
        budget_cents: 2500,
        cadence: "weekly",
        // bigints can arrive as strings from PostgREST
        earned_cents: "1000",
        spend_cents: "400",
        savings_cents: "400",
        giving_cents: "200",
        chores_total: "3",
        chores_done: "1",
        pending_approvals: "1",
        assigned_cents: "1800",
      },
    ]);

    const kids = await createParentKidsActions(client).listHouseholdKids("h-1");

    expect(calls).toEqual([
      { fn: "list_household_kids", args: { input_household_id: "h-1" } },
    ]);
    expect(kids).toEqual([
      {
        id: "kid-1",
        name: "Aria",
        age: 9,
        tone: "savings",
        earnedCents: 1000,
        allowanceCents: 400,
        savingsCents: 400,
        givingCents: 200,
        choresDone: 1,
        choresTotal: 3,
        pendingApprovals: 1,
        cadence: "weekly",
        budgetCents: 2500,
        assignedCents: 1800,
      },
    ]);
  });

  it("narrows an unknown tone to the allowance swatch", async () => {
    const { client } = makeClient([
      {
        child_profile_id: "kid-2",
        display_name: "Bram",
        age: null,
        tone: "sky",
        budget_cents: 2500,
        cadence: "monthly",
        earned_cents: 0,
        spend_cents: 0,
        savings_cents: 0,
        giving_cents: 0,
        chores_total: 0,
        chores_done: 0,
        pending_approvals: 0,
        assigned_cents: 0,
      },
    ]);

    const [kid] = await createParentKidsActions(client).listHouseholdKids("h-1");

    expect(kid.tone).toBe("allowance");
    expect(kid.age).toBeNull();
  });

  it("throws when the RPC errors", async () => {
    const { client } = makeClient([], new Error("nope"));

    await expect(
      createParentKidsActions(client).listHouseholdKids("h-1"),
    ).rejects.toThrow("nope");
  });
});
