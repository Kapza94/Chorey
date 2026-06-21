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
        sentBackReason: null,
        recurrence: null,
        periodKey: null,
        photoPath: null,
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

  it("sends a submitted chore back with a trimmed reason", async () => {
    const single = jest.fn().mockResolvedValue({
      data: {
        id: "chore-1",
        household_id: "household-1",
        child_profile_id: "child-1",
        title: "Load dishwasher",
        reward_cents: 250,
        status: "sent_back",
      },
      error: null,
    });
    const select = jest.fn(() => ({ single }));
    const eqStatus = jest.fn(() => ({ select }));
    const eqId = jest.fn(() => ({ eq: eqStatus }));
    const update = jest.fn(() => ({ eq: eqId }));
    const client = { from: jest.fn(() => ({ update })) };

    const chore = await createChoreActions(client as any, "household-1").sendBackChore({
      choreId: "chore-1",
      reason: "  Please redo  ",
    });

    expect(update).toHaveBeenCalledWith({
      status: "sent_back",
      sent_back_reason: "Please redo",
    });
    expect(eqId).toHaveBeenCalledWith("id", "chore-1");
    expect(eqStatus).toHaveBeenCalledWith("status", "submitted");
    expect(chore.status).toBe("sent_back");
  });

  it("rejects a send-back without a reason", async () => {
    const client = { from: jest.fn() };

    await expect(
      createChoreActions(client as any, "household-1").sendBackChore({
        choreId: "chore-1",
        reason: "   ",
      }),
    ).rejects.toThrow(/reason/i);
    expect(client.from).not.toHaveBeenCalled();
  });
});
