import {
  createChildLedgerActions,
  createLedgerActions,
} from "@/features/ledger/ledger-actions";

describe("ledger actions", () => {
  it("sums household ledger events into bucket balances", async () => {
    const client = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: [
              { amount_cents: 400, bucket: "spend" },
              { amount_cents: 100, bucket: "spend" },
              { amount_cents: 400, bucket: "savings" },
              { amount_cents: 200, bucket: "giving" },
            ],
            error: null,
          }),
        })),
      })),
    };
    const actions = createLedgerActions(client, "household-1");

    await expect(actions.getBucketBalances()).resolves.toEqual({
      givingCents: 200,
      savingsCents: 400,
      spendCents: 500,
    });
    expect(client.from).toHaveBeenCalledWith("ledger_events");
  });

  it("loads child bucket balances by access code", async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: {
          giving_cents: 200,
          savings_cents: 400,
          spend_cents: 400,
        },
        error: null,
      }),
    };
    const actions = createChildLedgerActions(client);

    await expect(actions.getBucketBalances("123456")).resolves.toEqual({
      givingCents: 200,
      savingsCents: 400,
      spendCents: 400,
    });
    expect(client.rpc).toHaveBeenCalledWith("get_child_bucket_balances", {
      input_access_code: "123456",
    });
  });
});
