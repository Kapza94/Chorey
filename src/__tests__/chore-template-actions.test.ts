import { createChoreTemplateActions } from "@/features/chores/chore-template-actions";
import { canUseRecurringChores } from "@/features/entitlements/entitlements";

function entitlementClient(status: string | null) {
  return {
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        maybeSingle: jest.fn().mockResolvedValue({
          data: status ? { status } : null,
          error: null,
        }),
      })),
    })),
  };
}

describe("canUseRecurringChores", () => {
  it("runs while trialing or active, pauses when lapsed", () => {
    expect(canUseRecurringChores("trialing")).toBe(true);
    expect(canUseRecurringChores("active")).toBe(true);
    expect(canUseRecurringChores("lapsed")).toBe(false);
  });
});

describe("createChoreTemplateActions.createTemplate", () => {
  it("creates a template for an entitled household", async () => {
    const single = jest.fn().mockResolvedValue({
      data: {
        id: "tmpl-1",
        household_id: "h-1",
        child_profile_id: "c-1",
        title: "Feed the cat",
        reward_cents: 100,
        recurrence: "daily",
        active: true,
      },
      error: null,
    });
    const insert = jest.fn(() => ({ select: jest.fn(() => ({ single })) }));
    const client = {
      from: jest.fn((table: string) =>
        table === "household_entitlements"
          ? entitlementClient("active")
          : { insert },
      ),
      rpc: jest.fn(),
    };

    const template = await createChoreTemplateActions(client as any, "h-1").createTemplate({
      childProfileId: "c-1",
      title: "  Feed the cat  ",
      rewardCents: 100,
      recurrence: "daily",
    });

    expect(insert).toHaveBeenCalledWith({
      household_id: "h-1",
      child_profile_id: "c-1",
      title: "Feed the cat",
      reward_cents: 100,
      recurrence: "daily",
      due_time: null,
    });
    expect(template.recurrence).toBe("daily");
  });

  it("blocks recurring chores while the household is paused", async () => {
    const insert = jest.fn();
    const client = {
      from: jest.fn((table: string) =>
        table === "household_entitlements" ? entitlementClient("lapsed") : { insert },
      ),
      rpc: jest.fn(),
    };

    await expect(
      createChoreTemplateActions(client as any, "h-1").createTemplate({
        childProfileId: "c-1",
        title: "Feed the cat",
        rewardCents: 100,
        recurrence: "daily",
      }),
    ).rejects.toThrow(/Chorey is paused/);
    expect(insert).not.toHaveBeenCalled();
  });

  it("treats a missing entitlement record as paused, not free", async () => {
    const insert = jest.fn();
    const client = {
      from: jest.fn((table: string) =>
        table === "household_entitlements" ? entitlementClient(null) : { insert },
      ),
      rpc: jest.fn(),
    };

    await expect(
      createChoreTemplateActions(client as any, "h-1").createTemplate({
        childProfileId: "c-1",
        title: "Feed the cat",
        rewardCents: 100,
        recurrence: "daily",
      }),
    ).rejects.toThrow(/Chorey is paused/);
    expect(insert).not.toHaveBeenCalled();
  });

  it("calls the generation RPC and returns the count", async () => {
    const client = {
      from: jest.fn(),
      rpc: jest.fn().mockResolvedValue({ data: 3, error: null }),
    };

    const count = await createChoreTemplateActions(client as any, "h-1").ensureInstances();

    expect(client.rpc).toHaveBeenCalledWith("ensure_recurring_chore_instances", {
      input_household_id: "h-1",
    });
    expect(count).toBe(3);
  });
});
