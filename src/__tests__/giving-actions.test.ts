import { createGivingActions } from "@/features/giving/giving-actions";

describe("giving actions", () => {
  it("lets child suggest a giving option", async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: {
          id: "suggestion-1",
          name: "Animal shelter",
          status: "pending",
        },
        error: null,
      }),
    };
    const actions = createGivingActions(client);

    await expect(
      actions.suggestGivingOption({
        accessCode: "123456",
        name: " Animal shelter ",
      }),
    ).resolves.toEqual({
      id: "suggestion-1",
      name: "Animal shelter",
      status: "pending",
    });
    expect(client.rpc).toHaveBeenCalledWith("suggest_giving_option", {
      input_access_code: "123456",
      input_name: "Animal shelter",
    });
  });

  it("loads approved child giving options", async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: [{ id: "option-1", name: "Animal shelter" }],
        error: null,
      }),
    };
    const actions = createGivingActions(client);

    await expect(actions.listChildGivingOptions("123456")).resolves.toEqual([
      { id: "option-1", name: "Animal shelter" },
    ]);
  });

  it("lets parent approve a giving suggestion", async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: {
          id: "option-1",
          name: "Animal shelter",
        },
        error: null,
      }),
    };
    const actions = createGivingActions(client);

    await expect(
      actions.approveGivingSuggestion({
        householdId: "household-1",
        suggestionId: "suggestion-1",
      }),
    ).resolves.toEqual({
      id: "option-1",
      name: "Animal shelter",
    });
    expect(client.rpc).toHaveBeenCalledWith("approve_giving_suggestion", {
      input_household_id: "household-1",
      input_suggestion_id: "suggestion-1",
    });
  });

  it("loads household giving suggestions", async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: [
          {
            child_name: "Mina",
            id: "suggestion-1",
            name: "Animal shelter",
            status: "pending",
          },
        ],
        error: null,
      }),
    };
    const actions = createGivingActions(client);

    await expect(actions.listHouseholdGivingSuggestions("household-1")).resolves.toEqual([
      {
        childName: "Mina",
        id: "suggestion-1",
        name: "Animal shelter",
        status: "pending",
      },
    ]);
  });
});
