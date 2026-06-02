import { fireEvent, render, screen } from "@testing-library/react-native";

import { ParentApp } from "@/features/parent-app/parent-app";
import type { ParentKid } from "@/features/parent-app/parent-primitives";

const mia: ParentKid = {
  id: "k1",
  name: "Mia",
  age: 9,
  tone: "allowance",
  earnedCents: 1850,
  allowanceCents: 740,
  savingsCents: 740,
  givingCents: 370,
  choresDone: 4,
  choresTotal: 6,
  pendingApprovals: 2,
  cadence: "weekly",
  budgetCents: 2500,
  assignedCents: 2200,
};

const eli: ParentKid = {
  ...mia,
  id: "k2",
  name: "Eli",
  tone: "savings",
  earnedCents: 900,
  allowanceCents: 360,
  savingsCents: 360,
  givingCents: 180,
  pendingApprovals: 0,
  budgetCents: 1500,
  assignedCents: 1350,
};

describe("ParentApp · Kids", () => {
  it("shows the kids, household total, and an approvals banner", () => {
    render(<ParentApp subtitle="Saturday · This week" kids={[mia, eli]} />);

    expect(screen.getByText("Kids.")).toBeOnTheScreen();
    expect(screen.getByText("Mia")).toBeOnTheScreen();
    expect(screen.getByText("Eli")).toBeOnTheScreen();
    // 2 + 0 pending across kids
    expect(screen.getByText("2 chores need your approval")).toBeOnTheScreen();
    // household earned total = 18.50 + 9.00 = 27.50
    expect(screen.getByText("$27.50")).toBeOnTheScreen();
  });

  it("selects a kid", () => {
    const onSelectKid = jest.fn();
    render(<ParentApp kids={[mia, eli]} onSelectKid={onSelectKid} />);

    fireEvent.press(screen.getByLabelText("Mia details"));
    expect(onSelectKid).toHaveBeenCalledWith("k1");
  });

  it("flags a kid that is over budget", () => {
    const over: ParentKid = { ...eli, assignedCents: 1800, budgetCents: 1500 };
    render(<ParentApp kids={[over]} />);

    // 1800 - 1500 = 300 extra
    expect(screen.getByText("+$3.00 extra")).toBeOnTheScreen();
  });

  it("switches to another tab", () => {
    render(<ParentApp kids={[mia]} />);

    fireEvent.press(screen.getByLabelText("Pay tab"));
    expect(screen.queryByText("Kids.")).toBeNull();
  });
});
