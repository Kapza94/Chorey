import { createChoreActions } from "@/features/chores/chore-actions";

function createClient() {
  return {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({
            data: [
              {
                id: "chore-1",
                household_id: "household-1",
                child_profile_id: "child-1",
                title: "Load dishwasher",
                reward_cents: 250,
                status: "submitted",
              },
            ],
            error: null,
          }),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: "chore-1",
                  household_id: "household-1",
                  child_profile_id: "child-1",
                  title: "Load dishwasher",
                  reward_cents: 250,
                  status: "approved",
                },
                error: null,
              }),
            })),
          })),
        })),
      })),
    })),
  };
}

describe("parent chore actions", () => {
  it("lists chores for a household", async () => {
    const client = createClient();
    const actions = createChoreActions(client, "household-1");

    const chores = await actions.listChores();

    expect(chores).toEqual([
      {
        id: "chore-1",
        householdId: "household-1",
        childProfileId: "child-1",
        title: "Load dishwasher",
        rewardCents: 250,
        status: "submitted",
      },
    ]);
    expect(client.from).toHaveBeenCalledWith("chore_instances");
  });

  it("approves a submitted chore", async () => {
    const client = createClient();
    const actions = createChoreActions(client, "household-1");

    const chore = await actions.approveChore("chore-1");

    expect(chore.status).toBe("approved");
  });
});
