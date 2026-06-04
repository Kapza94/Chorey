import { fireEvent, render, screen } from "@testing-library/react-native";

import { SettlementReviewScreen } from "@/features/settlement/settlement-review-screen";

const settlementPeriod = {
  bucketStatuses: {
    giving: "pending",
    savings: "pending",
    spend: "pending",
  },
  endsOn: "2026-06-05",
  frequency: "weekly",
  id: "period-1",
  startsOn: "2026-05-30",
} as const;

describe("SettlementReviewScreen", () => {
  it("reviews bucket amounts and marks everything settled", () => {
    const onMarkAllSettled = jest.fn();

    render(
      <SettlementReviewScreen
        bucketBalances={{
          givingCents: 200,
          savingsCents: 400,
          spendCents: 400,
        }}
        onMarkAllSettled={onMarkAllSettled}
        settlementPeriod={settlementPeriod}
      />,
    );

    expect(screen.getByText("Review settlement")).toBeOnTheScreen();
    expect(screen.getByText("Weekly period")).toBeOnTheScreen();
    expect(screen.getByText("2026-05-30 to 2026-06-05")).toBeOnTheScreen();
    expect(screen.getByText("Spend paid to child")).toBeOnTheScreen();
    expect(screen.getByText("Savings set aside")).toBeOnTheScreen();
    expect(screen.getByText("Giving — handed over in real life")).toBeOnTheScreen();
    expect(screen.getByText("10.00 total")).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText("Mark all settled"));

    expect(onMarkAllSettled).toHaveBeenCalledWith("period-1");
  });

  it("shows settled state when all buckets are settled", () => {
    render(
      <SettlementReviewScreen
        bucketBalances={{
          givingCents: 200,
          savingsCents: 400,
          spendCents: 400,
        }}
        settlementPeriod={{
          ...settlementPeriod,
          bucketStatuses: {
            giving: "settled",
            savings: "settled",
            spend: "settled",
          },
        }}
      />,
    );

    expect(screen.getByText("All settled")).toBeOnTheScreen();
  });
});
