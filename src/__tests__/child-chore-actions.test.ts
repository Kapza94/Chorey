import {
  createChildChoreActions,
  type ChildChore,
} from "@/features/chores/child-chore-actions";

function createClient(chore: ChildChore) {
  return {
    rpc: jest.fn((fn: string) => {
      if (fn === "list_child_chores") {
        return Promise.resolve({
          data: [
            {
              id: chore.id,
              title: chore.title,
              reward_cents: chore.rewardCents,
              status: chore.status,
            },
          ],
          error: null,
        });
      }

      return Promise.resolve({
        data: [
          {
            id: chore.id,
            title: chore.title,
            reward_cents: chore.rewardCents,
            status: "submitted",
          },
        ],
        error: null,
      });
    }),
  };
}

describe("child chore actions", () => {
  it("lists chores for a child access code", async () => {
    const client = createClient({
      id: "chore-1",
      title: "Load dishwasher",
      rewardCents: 250,
      status: "assigned",
    });
    const actions = createChildChoreActions(client);

    const chores = await actions.listChores("123456");

    expect(chores).toEqual([
      {
        id: "chore-1",
        title: "Load dishwasher",
        rewardCents: 250,
        status: "assigned",
      },
    ]);
    expect(client.rpc).toHaveBeenCalledWith("list_child_chores", {
      input_access_code: "123456",
    });
  });

  it("submits an assigned chore", async () => {
    const client = createClient({
      id: "chore-1",
      title: "Load dishwasher",
      rewardCents: 250,
      status: "assigned",
    });
    const actions = createChildChoreActions(client);

    const chore = await actions.submitChore({
      accessCode: "123456",
      choreId: "chore-1",
    });

    expect(chore.status).toBe("submitted");
    expect(client.rpc).toHaveBeenCalledWith("submit_child_chore", {
      input_access_code: "123456",
      input_chore_id: "chore-1",
    });
  });
});
