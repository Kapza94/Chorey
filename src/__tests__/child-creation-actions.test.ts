import { createChildActions } from "@/features/children/child-actions";

function createClient() {
  return {
    from: jest.fn(() => ({
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
    })),
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
    expect(client.from.mock.results[0]?.value.insert).toHaveBeenCalledWith({
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
});
