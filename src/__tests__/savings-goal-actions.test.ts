import { createSavingsGoalActions } from "@/features/savings-goal/savings-goal-actions";

function createClient(data: unknown) {
  return { rpc: jest.fn().mockResolvedValue({ data, error: null }) };
}

describe("savings goal actions", () => {
  it("reads a kid's goal by access code", async () => {
    const client = createClient([
      { id: "g1", name: "New bike", target_cents: 6000 },
    ]);

    const goal = await createSavingsGoalActions(client).getGoalForChild("123456");

    expect(goal).toEqual({ id: "g1", name: "New bike", targetCents: 6000 });
    expect(client.rpc).toHaveBeenCalledWith("get_child_savings_goal", {
      input_access_code: "123456",
    });
  });

  it("returns null when the kid has no goal yet", async () => {
    const goal = await createSavingsGoalActions(createClient([])).getGoalForChild(
      "123456",
    );

    expect(goal).toBeNull();
  });

  it("saves a goal and trims the name", async () => {
    const client = createClient([
      { id: "g1", name: "Telescope", target_cents: 9000 },
    ]);

    const goal = await createSavingsGoalActions(client).setGoalForChild({
      accessCode: "123456",
      name: "  Telescope  ",
      targetCents: 9000,
    });

    expect(goal.name).toBe("Telescope");
    expect(client.rpc).toHaveBeenCalledWith("set_child_savings_goal", {
      input_access_code: "123456",
      input_name: "Telescope",
      input_target_cents: 9000,
    });
  });

  it("rejects an empty name or non-positive target before calling", async () => {
    const client = createClient([]);
    const actions = createSavingsGoalActions(client);

    await expect(
      actions.setGoalForChild({ accessCode: "1", name: "  ", targetCents: 100 }),
    ).rejects.toThrow("Goal name is required.");
    await expect(
      actions.setGoalForChild({ accessCode: "1", name: "Bike", targetCents: 0 }),
    ).rejects.toThrow("Goal target must be more than zero.");
    expect(client.rpc).not.toHaveBeenCalled();
  });
});
