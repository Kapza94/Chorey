import {
  formatPayoutDate,
  toPayoutHistoryRows,
} from "@/features/parent-app/payout-history";
import type { Payout } from "@/features/payments/payment-actions";
import type { ParentKid } from "@/features/parent-app/parent-primitives";

const kid = (over: Partial<ParentKid>): ParentKid => ({
  id: "k1",
  name: "Mia",
  age: 9,
  tone: "allowance",
  earnedCents: 0,
  allowanceCents: 0,
  savingsCents: 0,
  givingCents: 0,
  choresDone: 0,
  choresTotal: 0,
  pendingApprovals: 0,
  cadence: "weekly",
  budgetCents: 0,
  assignedCents: 0,
  ...over,
});

describe("formatPayoutDate", () => {
  it("formats an ISO timestamp as 'Mon D'", () => {
    expect(formatPayoutDate("2026-05-25T09:00:00.000Z")).toBe("May 25");
  });
});

describe("toPayoutHistoryRows", () => {
  it("maps payouts to history rows with the kid's tone and other-detail", () => {
    const kids = [kid({ id: "k1", name: "Mia", tone: "savings" })];
    const payouts: Payout[] = [
      {
        id: "p1",
        childProfileId: "k1",
        childName: "Mia",
        amountCents: 1850,
        method: "other",
        note: "Lego set",
        paidAt: "2026-05-25T09:00:00.000Z",
      },
    ];

    expect(toPayoutHistoryRows(payouts, kids)).toEqual([
      {
        id: "p1",
        kidName: "Mia",
        tone: "savings",
        dateLabel: "May 25",
        method: "other",
        detail: "Lego set",
        amountCents: 1850,
      },
    ]);
  });

  it("falls back to the allowance tone when the kid is unknown", () => {
    const payouts: Payout[] = [
      {
        id: "p2",
        childProfileId: "gone",
        childName: "X",
        amountCents: 100,
        method: "cash",
        note: null,
        paidAt: "2026-06-01T00:00:00.000Z",
      },
    ];

    expect(toPayoutHistoryRows(payouts, [])[0].tone).toBe("allowance");
  });
});
