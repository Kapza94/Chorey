import { createChoreActions } from "@/features/chores/chore-actions";

function createClient() {
  return {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: {
              id: "chore-1",
              household_id: "household-1",
              child_profile_id: "child-1",
              title: "Load dishwasher",
              reward_cents: 250,
              status: "assigned",
            },
            error: null,
          }),
        })),
      })),
    })),
  };
}

describe("chore creation actions", () => {
  it("creates an assigned chore for a child", async () => {
    const client = createClient();
    const actions = createChoreActions(client, "household-1");

    const chore = await actions.createChore({
      childProfileId: "child-1",
      title: " Load dishwasher ",
      rewardCents: 250,
    });

    expect(chore).toEqual({
      id: "chore-1",
      householdId: "household-1",
      childProfileId: "child-1",
      title: "Load dishwasher",
      rewardCents: 250,
      status: "assigned",
      sentBackReason: null,
      recurrence: null,
      periodKey: null,
    });
    expect(client.from).toHaveBeenCalledWith("chore_instances");
    expect(client.from.mock.results[0]?.value.insert).toHaveBeenCalledWith({
      household_id: "household-1",
      child_profile_id: "child-1",
      title: "Load dishwasher",
      reward_cents: 250,
      status: "assigned",
    });
  });

  it("rejects blank chore titles before writing", async () => {
    const client = createClient();
    const actions = createChoreActions(client, "household-1");

    await expect(
      actions.createChore({
        childProfileId: "child-1",
        title: "   ",
        rewardCents: 250,
      }),
    ).rejects.toThrow("Chore title is required.");
    expect(client.from).not.toHaveBeenCalled();
  });

  it("rejects invalid reward amounts before writing", async () => {
    const client = createClient();
    const actions = createChoreActions(client, "household-1");

    await expect(
      actions.createChore({
        childProfileId: "child-1",
        title: "Load dishwasher",
        rewardCents: -1,
      }),
    ).rejects.toThrow("Reward must be zero or more.");
    expect(client.from).not.toHaveBeenCalled();
  });
});
