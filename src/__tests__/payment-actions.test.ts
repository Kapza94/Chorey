import {
  createPaymentActions,
  payoutsThisMonthCents,
  type Payout,
} from "@/features/payments/payment-actions";

describe("payment actions", () => {
  it("records an off-app payout scoped to the household", async () => {
    const single = jest.fn().mockResolvedValue({
      data: {
        id: "payout-1",
        child_profile_id: "child-1",
        amount_cents: 1850,
        method: "cash",
        paid_at: "2026-06-02T09:00:00.000Z",
        child: { display_name: "Mina" },
      },
      error: null,
    });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    const client = { from: jest.fn(() => ({ insert })) };

    const actions = createPaymentActions(client as any, "household-1");
    const payout = await actions.recordPayout({
      childProfileId: "child-1",
      amountCents: 1850,
      method: "cash",
    });

    expect(client.from).toHaveBeenCalledWith("payouts");
    expect(insert).toHaveBeenCalledWith({
      household_id: "household-1",
      child_profile_id: "child-1",
      amount_cents: 1850,
      method: "cash",
    });
    expect(payout).toEqual<Payout>({
      id: "payout-1",
      childProfileId: "child-1",
      childName: "Mina",
      amountCents: 1850,
      method: "cash",
      paidAt: "2026-06-02T09:00:00.000Z",
    });
  });

  it("rejects a non-positive payout amount", async () => {
    const client = { from: jest.fn() };
    const actions = createPaymentActions(client as any, "household-1");

    await expect(
      actions.recordPayout({ childProfileId: "c", amountCents: 0, method: "cash" }),
    ).rejects.toThrow(/greater than zero/);
    expect(client.from).not.toHaveBeenCalled();
  });

  it("lists payouts newest-first with the child name", async () => {
    const order = jest.fn().mockResolvedValue({
      data: [
        {
          id: "payout-2",
          child_profile_id: "child-1",
          amount_cents: 1200,
          method: "bank_transfer",
          paid_at: "2026-06-01T10:00:00.000Z",
          child: { display_name: "Mina" },
        },
      ],
      error: null,
    });
    const eq = jest.fn(() => ({ order }));
    const select = jest.fn(() => ({ eq }));
    const client = { from: jest.fn(() => ({ select })) };

    const actions = createPaymentActions(client as any, "household-1");
    const payouts = await actions.listPayouts();

    expect(eq).toHaveBeenCalledWith("household_id", "household-1");
    expect(order).toHaveBeenCalledWith("paid_at", { ascending: false });
    expect(payouts).toHaveLength(1);
    expect(payouts[0].childName).toBe("Mina");
    expect(payouts[0].method).toBe("bank_transfer");
  });
});

describe("payoutsThisMonthCents", () => {
  const payouts: Payout[] = [
    {
      id: "1",
      childProfileId: "c",
      childName: "Mina",
      amountCents: 1000,
      method: "cash",
      paidAt: "2026-06-02T09:00:00.000Z",
    },
    {
      id: "2",
      childProfileId: "c",
      childName: "Mina",
      amountCents: 500,
      method: "cash",
      paidAt: "2026-06-20T09:00:00.000Z",
    },
    {
      id: "3",
      childProfileId: "c",
      childName: "Mina",
      amountCents: 999,
      method: "cash",
      paidAt: "2026-05-30T09:00:00.000Z",
    },
  ];

  it("sums only payouts in the reference month", () => {
    expect(payoutsThisMonthCents(payouts, new Date("2026-06-15T00:00:00.000Z"))).toBe(
      1500,
    );
  });
});
