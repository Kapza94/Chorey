import { createChildActions } from "@/features/children/child-actions";

function createClient() {
  return {
    from: jest.fn((table: string) => {
      if (table === "household_entitlements") {
        // New households get a trialing entitlement row from the DB trigger.
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { status: "trialing" },
                error: null,
              }),
            })),
          })),
        };
      }

      return {
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: {
                id: "child-1",
                display_name: "Mina",
                household_id: "household-1",
              },
              error: null,
            }),
          })),
        })),
      };
    }),
  };
}

describe("child creation actions", () => {
  it("creates a child profile in the household", async () => {
    const client = createClient();
    const actions = createChildActions(client, "household-1");

    const child = await actions.createChild({ displayName: " Mina " });

    expect(child).toEqual({
      id: "child-1",
      displayName: "Mina",
      householdId: "household-1",
    });
    expect(client.from).toHaveBeenCalledWith("child_profiles");
    const childTableWrites = client.from.mock.results
      .map((result) => result.value)
      .find((table) => table.insert?.mock.calls.length > 0);
    expect(childTableWrites.insert).toHaveBeenCalledWith({
      household_id: "household-1",
      display_name: "Mina",
    });
  });

  it("rejects an empty child display name before writing", async () => {
    const client = createClient();
    const actions = createChildActions(client, "household-1");

    await expect(actions.createChild({ displayName: "   " })).rejects.toThrow(
      "Child name is required.",
    );
    expect(client.from).not.toHaveBeenCalled();
  });

  it("blocks adding a child while the household is paused (lapsed)", async () => {
    const client = {
      from: jest.fn((table: string) => {
        if (table === "child_profiles") {
          return {
            select: jest.fn(() => ({
              eq: jest.fn().mockResolvedValue({
                data: [{ id: "child-1" }],
                error: null,
              }),
            })),
          };
        }

        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { status: "lapsed" },
                error: null,
              }),
            })),
          })),
        };
      }),
    };
    const actions = createChildActions(client, "household-1");

    await expect(actions.createChild({ displayName: "Leo" })).rejects.toThrow(
      /Chorey is paused/,
    );
  });

  it("never blocks an entitled household on child count", async () => {
    const client = createClient();
    // Several existing kids; trialing households add more freely.
    client.from = jest.fn((table: string) => {
      if (table === "household_entitlements") {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { status: "trialing" },
                error: null,
              }),
            })),
          })),
        };
      }

      return {
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: [{ id: "child-1" }, { id: "child-2" }, { id: "child-3" }],
            error: null,
          }),
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: {
                id: "child-4",
                display_name: "Leo",
                household_id: "household-1",
              },
              error: null,
            }),
          })),
        })),
      };
    });

    const actions = createChildActions(client, "household-1");
    const child = await actions.createChild({ displayName: "Leo" });

    expect(child.id).toBe("child-4");
  });
});

describe("child settings updates", () => {
  it("updates a child's budget and cadence scoped to the household", async () => {
    const eqHousehold = jest.fn().mockResolvedValue({ error: null });
    const eqId = jest.fn(() => ({ eq: eqHousehold }));
    const update = jest.fn(() => ({ eq: eqId }));
    const client = { from: jest.fn(() => ({ update })) };

    await createChildActions(client as any, "household-1").updateChildSettings({
      childProfileId: "child-1",
      budgetCents: 3000,
      cadence: "monthly",
    });

    expect(client.from).toHaveBeenCalledWith("child_profiles");
    expect(update).toHaveBeenCalledWith({ budget_cents: 3000, cadence: "monthly" });
    expect(eqId).toHaveBeenCalledWith("id", "child-1");
    expect(eqHousehold).toHaveBeenCalledWith("household_id", "household-1");
  });

  it("no-ops when no settings are supplied", async () => {
    const client = { from: jest.fn() };

    await createChildActions(client as any, "household-1").updateChildSettings({
      childProfileId: "child-1",
    });

    expect(client.from).not.toHaveBeenCalled();
  });
});
