import {
  createSubscriptionActions,
  describeSubscription,
} from "@/features/entitlements/subscription-actions";

function createClient(row: unknown) {
  return {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn().mockResolvedValue({ data: row, error: null }),
        })),
      })),
    })),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
}

describe("subscription actions", () => {
  it("reads the household subscription with plan and dates", async () => {
    const client = createClient({
      status: "trialing",
      plan: "annual",
      trial_ends_at: "2026-06-25T00:00:00Z",
      current_period_ends_at: null,
    });

    const subscription = await createSubscriptionActions(client).getSubscription(
      "household-1",
    );

    expect(subscription).toEqual({
      status: "trialing",
      plan: "annual",
      trialEndsAt: "2026-06-25T00:00:00Z",
      currentPeriodEndsAt: null,
    });
  });

  it("treats a missing entitlement record as lapsed, never free", async () => {
    const client = createClient(null);

    const subscription = await createSubscriptionActions(client).getSubscription(
      "household-1",
    );

    expect(subscription.status).toBe("lapsed");
    expect(subscription.plan).toBeNull();
  });

  it.each([
    [
      { status: "active", plan: "annual", trialEndsAt: null, currentPeriodEndsAt: null },
      "Active · billed annually",
    ],
    [
      { status: "lapsed", plan: "monthly", trialEndsAt: null, currentPeriodEndsAt: null },
      "Paused",
    ],
  ] as const)("describes %p as %s", (subscription, expected) => {
    expect(describeSubscription(subscription)).toBe(expected);
  });

  it("describes a trial by the whole days left, rounded up", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-06-22T00:00:00Z"));
    try {
      expect(
        describeSubscription({
          status: "trialing",
          plan: null,
          trialEndsAt: "2026-06-25T00:00:00Z",
          currentPeriodEndsAt: null,
        }),
      ).toBe("Free trial · 3 days left");

      // Within the final 24h it reads the last day, never "0 days".
      jest.setSystemTime(new Date("2026-06-25T06:00:00Z"));
      expect(
        describeSubscription({
          status: "trialing",
          plan: null,
          trialEndsAt: "2026-06-25T00:00:00Z",
          currentPeriodEndsAt: null,
        }),
      ).toBe("Free trial · last day");
    } finally {
      jest.useRealTimers();
    }
  });

  it("records the plan choice through the RPC", async () => {
    const client = createClient(null);

    await createSubscriptionActions(client).choosePlan("household-1", "monthly");

    expect(client.rpc).toHaveBeenCalledWith("choose_subscription_plan", {
      input_household_id: "household-1",
      input_plan: "monthly",
    });
  });
});
