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
    expect(screen.getByText("2 things need you")).toBeOnTheScreen();
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

  it("shows a labelled Add kid button that fires onAddKid", () => {
    const onAddKid = jest.fn();
    render(<ParentApp kids={[mia]} onAddKid={onAddKid} />);

    // The affordance reads as text, not just a bare plus.
    expect(screen.getByText("Add kid")).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText("Add kid"));
    expect(onAddKid).toHaveBeenCalledTimes(1);
  });

  it("reviews and approves a pending chore from the banner", () => {
    const onApproveChore = jest.fn();
    const pendingApprovals = [
      {
        id: "ci1",
        childName: "Mia",
        title: "Dishes",
        rewardCents: 250,
        tone: "allowance" as const,
      },
    ];
    render(
      <ParentApp
        kids={[mia, eli]}
        pendingApprovals={pendingApprovals}
        onApproveChore={onApproveChore}
      />,
    );

    fireEvent.press(screen.getByLabelText("Review approvals"));
    // the review sheet lists the submitted chore
    expect(screen.getByText("Dishes")).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText("Approve Dishes"));
    expect(onApproveChore).toHaveBeenCalledWith("ci1");
  });

  it("sends a chore back with a reason from the review sheet", () => {
    const onSendBackChore = jest.fn();
    render(
      <ParentApp
        kids={[mia]}
        pendingApprovals={[
          { id: "ci1", childName: "Mia", title: "Dishes", rewardCents: 250, tone: "allowance" },
        ]}
        onSendBackChore={onSendBackChore}
      />,
    );

    fireEvent.press(screen.getByLabelText("Review approvals"));
    fireEvent.press(screen.getByLabelText("Send back Dishes"));
    fireEvent.changeText(screen.getByLabelText("Send-back reason"), "Redo it");
    fireEvent.press(screen.getByLabelText("Confirm send back"));

    expect(onSendBackChore).toHaveBeenCalledWith("ci1", "Redo it");
  });

  it("approves a purchase request from the review sheet", () => {
    const onApprovePurchase = jest.fn();
    render(
      <ParentApp
        kids={[mia]}
        purchaseRequests={[
          { id: "pr1", childName: "Mia", itemName: "Skateboard", targetCents: 6500 },
        ]}
        onApprovePurchase={onApprovePurchase}
      />,
    );

    fireEvent.press(screen.getByLabelText("Review approvals"));
    expect(screen.getByText("Skateboard")).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText("Approve purchase Skateboard"));
    expect(onApprovePurchase).toHaveBeenCalledWith("pr1");
  });

  it("approves a giving suggestion from the review sheet", () => {
    const onApproveGivingSuggestion = jest.fn();
    render(
      <ParentApp
        kids={[mia]}
        givingSuggestions={[{ id: "gs1", childName: "Mia", name: "Animal shelter" }]}
        onApproveGivingSuggestion={onApproveGivingSuggestion}
      />,
    );

    fireEvent.press(screen.getByLabelText("Review approvals"));
    expect(screen.getByText("Animal shelter")).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText("Approve cause Animal shelter"));
    expect(onApproveGivingSuggestion).toHaveBeenCalledWith("gs1");
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

  it("records a cash payout through the mark-as-paid sheet", () => {
    const onMarkPaid = jest.fn();
    render(<ParentApp initialTab="pay" due={due} onMarkPaid={onMarkPaid} />);

    fireEvent.press(screen.getByLabelText("Mark Mia as paid"));
    // sheet opens, amount prefilled to 18.50, cash is the default method
    fireEvent.press(screen.getByLabelText("Confirm payout"));

    expect(onMarkPaid).toHaveBeenCalledWith("k1", 1850, "cash", undefined);
  });

  it("no longer offers bank transfer as a method", () => {
    render(<ParentApp initialTab="pay" due={due} onMarkPaid={jest.fn()} />);

    fireEvent.press(screen.getByLabelText("Mark Mia as paid"));
    expect(screen.queryByLabelText("Bank transfer")).toBeNull();
    expect(screen.getByLabelText("Cash")).toBeOnTheScreen();
    expect(screen.getByLabelText("Other")).toBeOnTheScreen();
  });

  it("captures a preset Other detail", () => {
    const onMarkPaid = jest.fn();
    render(<ParentApp initialTab="pay" due={due} onMarkPaid={onMarkPaid} />);

    fireEvent.press(screen.getByLabelText("Mark Mia as paid"));
    fireEvent.press(screen.getByLabelText("Other"));
    fireEvent.press(screen.getByLabelText("Gift"));
    fireEvent.press(screen.getByLabelText("Confirm payout"));

    expect(onMarkPaid).toHaveBeenCalledWith("k1", 1850, "other", "Gift");
  });

  it("captures a free-text Other detail via Something else", () => {
    const onMarkPaid = jest.fn();
    render(<ParentApp initialTab="pay" due={due} onMarkPaid={onMarkPaid} />);

    fireEvent.press(screen.getByLabelText("Mark Mia as paid"));
    fireEvent.press(screen.getByLabelText("Other"));
    fireEvent.press(screen.getByLabelText("Something else"));
    fireEvent.changeText(screen.getByLabelText("What did you give?"), "Lego set");
    fireEvent.press(screen.getByLabelText("Confirm payout"));

    expect(onMarkPaid).toHaveBeenCalledWith("k1", 1850, "other", "Lego set");
  });

  it("shows the all-paid-up empty state", () => {
    render(<ParentApp initialTab="pay" due={[]} payoutHistory={history} />);
    expect(screen.getByText("All paid up.")).toBeOnTheScreen();
  });

  it("marks the settlement period settled", () => {
    const onMarkAllSettled = jest.fn();
    render(
      <ParentApp
        initialTab="pay"
        due={due}
        settlementPeriod={{
          id: "sp1",
          frequency: "weekly",
          startsOn: "2026-05-30",
          endsOn: "2026-06-05",
          bucketStatuses: { spend: "pending", savings: "pending", giving: "pending" },
        }}
        onMarkAllSettled={onMarkAllSettled}
      />,
    );

    fireEvent.press(screen.getByLabelText("Mark all settled"));
    expect(onMarkAllSettled).toHaveBeenCalledTimes(1);
  });

  it("shows a settled period without a settle button", () => {
    render(
      <ParentApp
        initialTab="pay"
        due={due}
        settlementPeriod={{
          id: "sp1",
          frequency: "weekly",
          startsOn: "2026-05-30",
          endsOn: "2026-06-05",
          bucketStatuses: { spend: "settled", savings: "settled", giving: "settled" },
        }}
      />,
    );

    expect(screen.getByText("Period settled")).toBeOnTheScreen();
    expect(screen.queryByLabelText("Mark all settled")).toBeNull();
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

  it("creates a recurring chore via the Repeat option", () => {
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
    fireEvent.changeText(screen.getByLabelText("Chore name"), "Feed cat");
    fireEvent.press(screen.getByLabelText("Repeat Daily"));
    fireEvent.press(screen.getByLabelText("Add chore"));

    expect(onAddChore).toHaveBeenCalledWith({
      name: "Feed cat",
      rewardCents: 200,
      assigneeId: "k1",
      recurrence: "daily",
    });
  });

  it("hides Everyone when there is only one kid", () => {
    render(
      <ParentApp
        initialTab="chores"
        kids={[mia]}
        assignees={[{ id: "k1", name: "Mia" }]}
      />,
    );

    fireEvent.press(screen.getByLabelText("New chore"));
    expect(screen.getByLabelText("Assign to Mia")).toBeOnTheScreen();
    expect(screen.queryByLabelText("Assign to Everyone")).toBeNull();
  });

  it("offers Everyone once there is more than one kid", () => {
    render(
      <ParentApp
        initialTab="chores"
        kids={[mia, eli]}
        assignees={[
          { id: "k1", name: "Mia" },
          { id: "k2", name: "Eli" },
        ]}
      />,
    );

    fireEvent.press(screen.getByLabelText("New chore"));
    expect(screen.getByLabelText("Assign to Everyone")).toBeOnTheScreen();
  });

  it("caps assignee names at three behind a More toggle", () => {
    const four = [
      { id: "k1", name: "Mia" },
      { id: "k2", name: "Eli" },
      { id: "k3", name: "Sam" },
      { id: "k4", name: "Zoe" },
    ];
    render(<ParentApp initialTab="chores" kids={[mia, eli]} assignees={four} />);

    fireEvent.press(screen.getByLabelText("New chore"));
    expect(screen.getByLabelText("Assign to Mia")).toBeOnTheScreen();
    expect(screen.queryByLabelText("Assign to Zoe")).toBeNull();

    fireEvent.press(screen.getByLabelText("Show more kids"));
    expect(screen.getByLabelText("Assign to Zoe")).toBeOnTheScreen();
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
