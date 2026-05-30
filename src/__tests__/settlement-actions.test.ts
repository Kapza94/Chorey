import { createSettlementActions } from "@/features/settlement/settlement-actions";

describe("settlement actions", () => {
  it("loads the active settlement period for a household", async () => {
    const client = {
      from: jest.fn(),
      rpc: jest.fn().mockResolvedValue({
        data: {
          ends_on: "2026-06-05",
          frequency: "weekly",
          giving_status: "pending",
          id: "period-1",
          savings_status: "settled",
          spend_status: "pending",
          starts_on: "2026-05-30",
        },
        error: null,
      }),
    };
    const actions = createSettlementActions(client, "household-1");

    await expect(actions.getActivePeriod()).resolves.toEqual({
      bucketStatuses: {
        giving: "pending",
        savings: "settled",
        spend: "pending",
      },
      endsOn: "2026-06-05",
      frequency: "weekly",
      id: "period-1",
      startsOn: "2026-05-30",
    });
    expect(client.rpc).toHaveBeenCalledWith("ensure_active_settlement_period", {
      input_household_id: "household-1",
    });
  });

  it("settles every bucket in a period at once", async () => {
    const update = jest.fn(() => ({
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    }));
    const client = {
      from: jest.fn(() => ({ update })),
      rpc: jest.fn(),
    };
    const actions = createSettlementActions(client, "household-1");

    await actions.settleAllBuckets("period-1");

    expect(client.from).toHaveBeenCalledWith("settlement_bucket_statuses");
    expect(update).toHaveBeenCalledWith({ status: "settled" });
  });
});
