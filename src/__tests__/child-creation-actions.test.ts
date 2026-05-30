import { createChildActions } from "@/features/children/child-actions";

function createClient() {
  return {
    from: jest.fn((table: string) => {
      if (table === "household_entitlements") {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
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

  it("blocks a second child for free households", async () => {
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
                data: null,
                error: null,
              }),
            })),
          })),
        };
      }),
    };
    const actions = createChildActions(client, "household-1");

    await expect(actions.createChild({ displayName: "Leo" })).rejects.toThrow(
      "Upgrade required to add another child.",
    );
  });
});
