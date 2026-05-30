import { createSignedInHouseholdAction } from "@/features/household/signed-in-household-action";

describe("signed-in household action", () => {
  it("creates a household for the current Supabase user", async () => {
    const createHousehold = jest.fn().mockResolvedValue({ id: "household-1" });
    const client = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "parent-1" } },
          error: null,
        }),
      },
    };

    const action = createSignedInHouseholdAction(client, () => ({
      createHousehold,
    }));

    await action({ name: "Kapza home", settlementFrequency: "weekly" });

    expect(client.auth.getUser).toHaveBeenCalledTimes(1);
    expect(createHousehold).toHaveBeenCalledWith({
      name: "Kapza home",
      settlementFrequency: "weekly",
    });
  });

  it("rejects when there is no signed-in parent", async () => {
    const client = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    };

    const action = createSignedInHouseholdAction(client, () => ({
      createHousehold: jest.fn(),
    }));

    await expect(action({ name: "Kapza home" })).rejects.toThrow(
      "A signed-in parent is required.",
    );
  });
});

