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

describe("ParentApp · Payments", () => {
  const due = [
    {
      id: "k1",
      name: "Mia",
      tone: "allowance" as const,
      earnedCents: 1850,
      allowanceCents: 740,
      savingsCents: 740,
      givingCents: 370,
      choresDone: 4,
      cadence: "weekly" as const,
    },
  ];
  const history = [
    {
      id: "h1",
      kidName: "Mia",
      tone: "allowance" as const,
      dateLabel: "May 25",
      method: "cash" as const,
      amountCents: 2200,
    },
  ];

  it("lists who is due and the total to pay out", () => {
    render(
      <ParentApp
        initialTab="pay"
        due={due}
        payoutHistory={history}
        paidThisMonthCents={2200}
      />,
    );

    expect(screen.getByText("Payments.")).toBeOnTheScreen();
    expect(screen.getByText("to pay out")).toBeOnTheScreen();
    expect(screen.getByText("Total to pay out")).toBeOnTheScreen();
    expect(screen.getByText("$22.00 this month")).toBeOnTheScreen();
  });

  it("records a payout through the mark-as-paid sheet", () => {
    const onMarkPaid = jest.fn();
    render(<ParentApp initialTab="pay" due={due} onMarkPaid={onMarkPaid} />);

    fireEvent.press(screen.getByLabelText("Mark Mia as paid"));
    // sheet opens, amount prefilled to 18.50
    fireEvent.press(screen.getByLabelText("Bank transfer"));
    fireEvent.press(screen.getByLabelText("Confirm payout"));

    expect(onMarkPaid).toHaveBeenCalledWith("k1", 1850, "bank_transfer");
  });

  it("shows the all-paid-up empty state", () => {
    render(<ParentApp initialTab="pay" due={[]} payoutHistory={history} />);
    expect(screen.getByText("All paid up.")).toBeOnTheScreen();
  });
});

describe("ParentApp · Chores", () => {
  const chores = [
    { id: "c1", name: "Walk Buddy", valueCents: 300, freq: "Daily", assignedTo: "Mia" },
  ];

  it("lists the chore library and per-kid assigned-vs-cap", () => {
    render(<ParentApp initialTab="chores" kids={[mia]} chores={chores} />);

    expect(screen.getByText("Chores.")).toBeOnTheScreen();
    expect(screen.getByText("Walk Buddy")).toBeOnTheScreen();
    expect(screen.getByText("Daily · Mia")).toBeOnTheScreen();
    // Mia: assigned 22.00 of 25.00 budget → $3.00 left
    expect(screen.getByText("$3.00 left")).toBeOnTheScreen();
  });

  it("adds a chore with a live split preview", () => {
    const onAddChore = jest.fn();
    render(
      <ParentApp
        initialTab="chores"
        kids={[mia]}
        chores={chores}
        assignees={[{ id: "k1", name: "Mia" }]}
        onAddChore={onAddChore}
      />,
    );

    fireEvent.press(screen.getByLabelText("New chore"));
    fireEvent.changeText(screen.getByLabelText("Chore name"), "Dishes");
    fireEvent.changeText(screen.getByLabelText("Chore reward"), "2.50");
    // default reward 2.00 → preview splits shown; after change, confirm
    fireEvent.press(screen.getByLabelText("Add chore"));

    expect(onAddChore).toHaveBeenCalledWith({
      name: "Dishes",
      rewardCents: 250,
      assigneeId: "k1",
    });
  });
});

describe("ParentApp · Settings", () => {
  it("shows the split and per-kid budget cards", () => {
    render(<ParentApp initialTab="settings" kids={[mia]} />);

    expect(screen.getByText("Settings.")).toBeOnTheScreen();
    expect(screen.getByText("40 / 40 / 20")).toBeOnTheScreen();
    expect(screen.getByText("Budget cap")).toBeOnTheScreen();
    expect(screen.getByText("chorey · v0.1")).toBeOnTheScreen();
  });

  it("steps a kid's budget by $5", () => {
    const onChangeBudget = jest.fn();
    render(
      <ParentApp initialTab="settings" kids={[mia]} onChangeBudget={onChangeBudget} />,
    );

    // Mia starts at $25.00 (2500c) → increase to 3000
    fireEvent.press(screen.getByLabelText("Increase budget"));
    expect(onChangeBudget).toHaveBeenCalledWith("k1", 3000);
  });

  it("switches a kid's cadence", () => {
    const onChangeCadence = jest.fn();
    render(
      <ParentApp initialTab="settings" kids={[mia]} onChangeCadence={onChangeCadence} />,
    );

    fireEvent.press(screen.getByLabelText("Mia monthly"));
    expect(onChangeCadence).toHaveBeenCalledWith("k1", "monthly");
  });
});
