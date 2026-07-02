import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { ParentApp } from "@/features/parent-app/parent-app";
import {
  getBottomSheetMaxHeight,
  type ChoreBoardItem,
} from "@/features/parent-app/parent-chores-screen";
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

    expect(screen.getByText("Children.")).toBeOnTheScreen();
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

  it("shows chores beyond the allowance as a bonus, not a warning", () => {
    const over: ParentKid = { ...eli, assignedCents: 1800, budgetCents: 1500 };
    render(<ParentApp kids={[over]} />);

    // 1800 - 1500 = 300 on top of the allowance
    expect(screen.getByText("+$3.00 bonus")).toBeOnTheScreen();
  });

  it("switches to another tab", () => {
    render(<ParentApp kids={[mia]} />);

    fireEvent.press(screen.getByLabelText("Pay tab"));
    expect(screen.queryByText("Children.")).toBeNull();
  });

  it("badges Chores with chore approvals and Children with purchase requests", () => {
    render(
      <ParentApp
        initialTab="kids"
        kids={[mia]}
        pendingApprovals={[
          {
            id: "ci1",
            childName: "Mia",
            title: "Dishes",
            rewardCents: 250,
            tone: "allowance",
          },
          {
            id: "ci2",
            childName: "Mia",
            title: "Trash",
            rewardCents: 100,
            tone: "allowance",
          },
        ]}
        purchaseRequests={[
          {
            id: "pr1",
            childName: "Mia",
            itemName: "Skateboard",
            targetCents: 6500,
            wishlistItemId: "w1",
          },
        ]}
      />,
    );

    // Chore approvals badge the Chores tab; the purchase request badges Children.
    expect(
      screen.getByLabelText("Chores tab, 2 waiting for review"),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText("Children tab, 1 waiting for review"),
    ).toBeOnTheScreen();
  });

  it("shows no review badge when nothing is waiting", () => {
    render(
      <ParentApp
        initialTab="chores"
        kids={[{ ...mia, pendingApprovals: 0 }]}
      />,
    );

    expect(screen.getByLabelText("Children tab")).toBeOnTheScreen();
    expect(screen.getByLabelText("Chores tab")).toBeOnTheScreen();
    expect(screen.queryByLabelText(/waiting for review/)).toBeNull();
  });

  it("shows a labelled Add kid button that fires onAddKid", () => {
    const onAddKid = jest.fn();
    render(<ParentApp kids={[mia]} onAddKid={onAddKid} />);

    // The affordance reads as text, not just a bare plus.
    expect(screen.getByText("Add child")).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText("Add child"));
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

  it("opens a kid's payments sheet (earned/paid/owed + history) on card tap", () => {
    render(
      <ParentApp
        kids={[mia]}
        payments={[
          {
            kidId: "k1",
            earnedCents: 650,
            paidCents: 500,
            spendCents: 150,
            history: [
              {
                id: "p1",
                dateLabel: "May 25",
                method: "other",
                detail: "Gift",
                amountCents: 500,
              },
            ],
          },
        ]}
      />,
    );

    fireEvent.press(screen.getByLabelText("Mia details"));
    expect(screen.getByText("Earned")).toBeOnTheScreen();
    expect(screen.getByText("$1.50")).toBeOnTheScreen(); // owed = Spend balance
    expect(screen.getByText("Other · Gift")).toBeOnTheScreen(); // history row
  });

  it("sends a chore back with a reason from the review sheet", () => {
    const onSendBackChore = jest.fn();
    render(
      <ParentApp
        kids={[mia]}
        pendingApprovals={[
          {
            id: "ci1",
            childName: "Mia",
            title: "Dishes",
            rewardCents: 250,
            tone: "allowance",
          },
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
          {
            id: "pr1",
            childName: "Mia",
            itemName: "Skateboard",
            targetCents: 6500,
            wishlistItemId: "w1",
          },
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
        givingSuggestions={[
          { id: "gs1", childName: "Mia", name: "Animal shelter" },
        ]}
        onApproveGivingSuggestion={onApproveGivingSuggestion}
      />,
    );

    fireEvent.press(screen.getByLabelText("Review approvals"));
    expect(screen.getByText("Animal shelter")).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText("Approve cause Animal shelter"));
    expect(onApproveGivingSuggestion).toHaveBeenCalledWith("gs1");
  });

  it("shows child wishlist items on the parent dashboard", () => {
    render(
      <ParentApp
        kids={[mia]}
        wishlistItems={[
          {
            id: "w1",
            childName: "Mia",
            itemName: "Skateboard",
            targetCents: 6500,
            status: "active",
            hasUnread: true,
            unreadNoteCount: 2,
            latestNote: {
              authorKind: "child",
              body: "Can I get this?",
            },
          },
        ]}
        onLoadWishNotes={jest.fn().mockResolvedValue([])}
      />,
    );

    expect(screen.getByText("Wishlist")).toBeOnTheScreen();
    expect(screen.getByText("Skateboard")).toBeOnTheScreen();
    expect(screen.getByText("Mia · $65.00")).toBeOnTheScreen();
    expect(screen.getByText("Mia: Can I get this?")).toBeOnTheScreen();
    expect(screen.getByLabelText("Notes for Skateboard, 2 new messages")).toBeOnTheScreen();
    expect(screen.getByText("2")).toBeOnTheScreen();
  });

  it("opens a wishlist note thread from the parent dashboard and replies", async () => {
    const onLoadWishNotes = jest.fn().mockResolvedValue([
      {
        id: "n1",
        authorKind: "child",
        authorName: "Mia",
        body: "Can I get this?",
        createdAt: "2026-06-25T10:00:00Z",
      },
    ]);
    const onAddWishNote = jest.fn().mockResolvedValue({
      id: "n2",
      authorKind: "parent",
      authorName: "Dad",
      body: "After chores.",
      createdAt: "2026-06-25T11:00:00Z",
    });

    render(
      <ParentApp
        kids={[mia]}
        wishlistItems={[
          {
            id: "w1",
            childName: "Mia",
            itemName: "Skateboard",
            targetCents: 6500,
            status: "active",
            hasUnread: true,
            unreadNoteCount: 1,
          },
        ]}
        onLoadWishNotes={onLoadWishNotes}
        onAddWishNote={onAddWishNote}
      />,
    );

    fireEvent.press(screen.getByLabelText("Notes for Skateboard, 1 new message"));
    expect(await screen.findByText("Can I get this?")).toBeOnTheScreen();
    expect(onLoadWishNotes).toHaveBeenCalledWith("w1");

    fireEvent.changeText(screen.getByLabelText("Reply to Skateboard"), " After chores. ");
    fireEvent.press(screen.getByLabelText("Send reply"));
    await waitFor(() =>
      expect(onAddWishNote).toHaveBeenCalledWith("w1", "After chores."),
    );
  });
});

describe("ParentApp · Payments", () => {
  const due = [
    {
      id: "k1",
      name: "Mia",
      tone: "allowance" as const,
      earnedCents: 1850,
      spendCents: 740,
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
    expect(screen.getByText("Spend to hand over")).toBeOnTheScreen();
    expect(screen.getByText("Total to pay out")).toBeOnTheScreen();
    expect(screen.getByText("$22.00 this month")).toBeOnTheScreen();
  });

  it("records a cash payout through the mark-as-paid sheet", () => {
    const onMarkPaid = jest.fn();
    render(<ParentApp initialTab="pay" due={due} onMarkPaid={onMarkPaid} />);

    fireEvent.press(screen.getByLabelText("Mark Mia as paid"));
    // sheet opens, amount prefilled to the Spend balance (7.40), cash default
    fireEvent.press(screen.getByLabelText("Confirm payout"));

    expect(onMarkPaid).toHaveBeenCalledWith("k1", 740, "cash", undefined);
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

    expect(onMarkPaid).toHaveBeenCalledWith("k1", 740, "other", "Gift");
  });

  it("captures a free-text Other detail via Something else", () => {
    const onMarkPaid = jest.fn();
    render(<ParentApp initialTab="pay" due={due} onMarkPaid={onMarkPaid} />);

    fireEvent.press(screen.getByLabelText("Mark Mia as paid"));
    fireEvent.press(screen.getByLabelText("Other"));
    fireEvent.press(screen.getByLabelText("Something else"));
    fireEvent.changeText(
      screen.getByLabelText("What did you give?"),
      "Lego set",
    );
    fireEvent.press(screen.getByLabelText("Confirm payout"));

    expect(onMarkPaid).toHaveBeenCalledWith("k1", 740, "other", "Lego set");
  });

  it("shows the all-paid-up empty state", () => {
    render(<ParentApp initialTab="pay" due={[]} payoutHistory={history} />);
    expect(screen.getByText("All paid up.")).toBeOnTheScreen();
  });

  it("shows owed as the kid's Spend balance — never Savings or Giving", () => {
    render(
      <ParentApp
        initialTab="pay"
        due={[{ ...due[0], earnedCents: 650, spendCents: 150 }]}
      />,
    );

    // owed shows in the card and the total
    expect(screen.getAllByText("$1.50").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("$6.50 earned all-time")).toBeOnTheScreen();
  });

  it("drops a kid with no Spend balance to all-paid-up", () => {
    render(<ParentApp initialTab="pay" due={[{ ...due[0], spendCents: 0 }]} />);

    expect(screen.getByText("All paid up.")).toBeOnTheScreen();
  });

  it("caps a payout at the kid's Spend balance", () => {
    const onMarkPaid = jest.fn();
    render(<ParentApp initialTab="pay" due={due} onMarkPaid={onMarkPaid} />);

    fireEvent.press(screen.getByLabelText("Mark Mia as paid"));
    fireEvent.changeText(screen.getByLabelText("Payout amount"), "100.00");
    expect(
      screen.getByText("That's more than Mia's $7.40 Spend balance."),
    ).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText("Confirm payout"));

    expect(onMarkPaid).not.toHaveBeenCalled();
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
          bucketStatuses: {
            spend: "pending",
            savings: "pending",
            giving: "pending",
          },
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
          bucketStatuses: {
            spend: "settled",
            savings: "settled",
            giving: "settled",
          },
        }}
      />,
    );

    expect(screen.getByText("Period settled")).toBeOnTheScreen();
    expect(screen.queryByLabelText("Mark all settled")).toBeNull();
  });
});

describe("ParentApp · Chores", () => {
  it("keeps keyboard-lifted sheets below the status area", () => {
    expect(
      getBottomSheetMaxHeight({
        windowHeight: 874,
        keyboardHeight: 320,
        topInset: 59,
      }),
    ).toBe(483);
  });

  const chores = [
    {
      id: "c1",
      name: "Walk Buddy",
      valueCents: 300,
      freq: "Daily",
      assignedTo: "Mia",
    },
  ];

  it("lists the chore library and per-kid assigned-vs-cap", () => {
    render(<ParentApp initialTab="chores" kids={[mia]} chores={chores} />);

    expect(screen.getByText("Chores.")).toBeOnTheScreen();
    expect(screen.getByText("Walk Buddy")).toBeOnTheScreen();
    expect(screen.getByText("Daily · Mia")).toBeOnTheScreen();
    // Mia: assigned 22.00 of 25.00 budget → $3.00 left
    expect(screen.getByText("$3.00 left")).toBeOnTheScreen();
  });

  it("filters the board by repeat-cadence tabs", () => {
    const board: ChoreBoardItem[] = [
      {
        id: "b1",
        title: "Make bed",
        childName: "Mia",
        rewardCents: 100,
        tone: "allowance",
        status: "assigned",
        recurrence: "daily",
      },
      {
        id: "b2",
        title: "Mow lawn",
        childName: "Mia",
        rewardCents: 500,
        tone: "allowance",
        status: "assigned",
        recurrence: "weekly",
      },
      {
        id: "b3",
        title: "Wash car",
        childName: "Mia",
        rewardCents: 300,
        tone: "allowance",
        status: "assigned",
        recurrence: null,
      },
    ];
    render(<ParentApp initialTab="chores" kids={[mia]} choreBoard={board} />);

    // All cadences visible by default
    expect(screen.getByText("Make bed")).toBeOnTheScreen();
    expect(screen.getByText("Mow lawn")).toBeOnTheScreen();
    expect(screen.getByText("Wash car")).toBeOnTheScreen();

    // Weekly tab shows only the weekly chore — a crossed-off weekly stays findable here
    fireEvent.press(screen.getByLabelText("Show Weekly chores"));
    expect(screen.getByText("Mow lawn")).toBeOnTheScreen();
    expect(screen.queryByText("Make bed")).toBeNull();
    expect(screen.queryByText("Wash car")).toBeNull();

    // Once tab shows only the one-off chore
    fireEvent.press(screen.getByLabelText("Show Once chores"));
    expect(screen.getByText("Wash car")).toBeOnTheScreen();
    expect(screen.queryByText("Mow lawn")).toBeNull();
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
      recurrence: undefined,
    });
  });

  // One-off rewards suggest 5/10/20% of the kid's allowance as tappable chips
  // ($2000 budget → $1 / $2 / $4) so the parent never does arithmetic.
  it("offers allowance-anchored reward chips for a one-off chore", () => {
    const onAddChore = jest.fn();
    render(
      <ParentApp
        initialTab="chores"
        kids={[mia]}
        chores={chores}
        assignees={[{ id: "k1", name: "Mia", budgetCents: 2000 }]}
        onAddChore={onAddChore}
      />,
    );

    fireEvent.press(screen.getByLabelText("New chore"));
    fireEvent.changeText(screen.getByLabelText("Chore name"), "Wash the car");
    fireEvent.press(screen.getByLabelText("Reward $2.00"));
    // Tapping a chip fills the reward and explains it's on top of the allowance.
    expect(
      screen.getByText(/Paid on top of the \$20\.00 allowance/),
    ).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText("Add chore"));

    expect(onAddChore).toHaveBeenCalledWith({
      name: "Wash the car",
      rewardCents: 200,
      assigneeId: "k1",
      recurrence: undefined,
    });
  });

  it("creates a recurring chore via the Repeat option", () => {
    const onAddChore = jest.fn();
    render(
      <ParentApp
        initialTab="chores"
        kids={[mia]}
        chores={chores}
        assignees={[{ id: "k1", name: "Mia", budgetCents: 2000 }]}
        onAddChore={onAddChore}
      />,
    );

    fireEvent.press(screen.getByLabelText("New chore"));
    fireEvent.changeText(screen.getByLabelText("Chore name"), "Feed cat");
    // Type a reward while it's still a one-off, then switch to Daily — the
    // budget-first sheet must drop that stale value and emit 0 (the recurring
    // reward is derived from the allowance after creation).
    fireEvent.changeText(screen.getByLabelText("Chore reward"), "2.00");
    fireEvent.press(screen.getByLabelText("Repeat Daily"));
    fireEvent.press(screen.getByLabelText("Add chore"));

    expect(onAddChore).toHaveBeenCalledWith({
      name: "Feed cat",
      rewardCents: 0,
      assigneeId: "k1",
      recurrence: "daily",
    });
  });

  it("locks recurring options for a paused household (no navigation)", () => {
    const onAddChore = jest.fn();
    render(
      <ParentApp
        initialTab="chores"
        kids={[mia]}
        chores={chores}
        assignees={[{ id: "k1", name: "Mia" }]}
        recurringLocked
        onAddChore={onAddChore}
      />,
    );

    fireEvent.press(screen.getByLabelText("New chore"));
    fireEvent.changeText(screen.getByLabelText("Chore name"), "Feed cat");
    fireEvent.changeText(screen.getByLabelText("Chore reward"), "2.00");
    // Tapping a locked recurrence explains the pause inline, doesn't select it.
    fireEvent.press(screen.getByLabelText("Repeat Daily"));
    expect(
      screen.getByText(
        "Chorey is paused — resume your subscription to use repeats.",
      ),
    ).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText("Add chore"));

    // The chore is still created — as a one-off, with no recurrence.
    expect(onAddChore).toHaveBeenCalledWith({
      name: "Feed cat",
      rewardCents: 200,
      assigneeId: "k1",
      recurrence: undefined,
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
    render(
      <ParentApp initialTab="chores" kids={[mia, eli]} assignees={four} />,
    );

    fireEvent.press(screen.getByLabelText("New chore"));
    expect(screen.getByLabelText("Assign to Mia")).toBeOnTheScreen();
    expect(screen.queryByLabelText("Assign to Zoe")).toBeNull();

    fireEvent.press(screen.getByLabelText("Show more children"));
    expect(screen.getByLabelText("Assign to Zoe")).toBeOnTheScreen();
  });
});

describe("ParentApp · Settings", () => {
  it("shows the split and per-kid budget cards", () => {
    render(<ParentApp initialTab="settings" kids={[mia]} />);

    expect(screen.getByText("Settings.")).toBeOnTheScreen();
    expect(screen.getByText("40 / 40 / 20")).toBeOnTheScreen();
    expect(screen.getByText("Budget cap")).toBeOnTheScreen();
    expect(screen.getByText(/chorey · v/)).toBeOnTheScreen();
  });

  it("shows the signed-in parent as a profile row that opens the editor", () => {
    const onOpenProfile = jest.fn();
    render(
      <ParentApp
        initialTab="settings"
        kids={[mia]}
        account={{
          name: "Alex Rivera",
          email: "alex@example.com",
          provider: "google",
        }}
        onOpenProfile={onOpenProfile}
      />,
    );

    expect(screen.getByText("Alex Rivera")).toBeOnTheScreen();
    expect(screen.getByText("alex@example.com")).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText("Account and family"));
    expect(onOpenProfile).toHaveBeenCalledTimes(1);
  });

  it("surfaces account, legal, and delete actions directly in Settings", () => {
    const onManageStoreSubscription = jest.fn();
    render(
      <ParentApp
        initialTab="settings"
        kids={[mia]}
        account={{ name: "Alex", email: "alex@example.com", provider: "apple" }}
        onManageStoreSubscription={onManageStoreSubscription}
        onSubmitContact={jest.fn(async () => {})}
        onSubmitFeedback={jest.fn(async () => {})}
        onDeleteAccount={jest.fn(async () => {})}
      />,
    );

    // Reachable from Settings without opening the avatar sheet.
    expect(screen.getByLabelText("Cancel or manage billing")).toBeOnTheScreen();
    expect(screen.getByLabelText("Contact us")).toBeOnTheScreen();
    expect(screen.getByLabelText("Send feedback")).toBeOnTheScreen();
    expect(screen.getByLabelText("Terms of Service")).toBeOnTheScreen();
    expect(screen.getByLabelText("Privacy Policy")).toBeOnTheScreen();
    expect(screen.getByLabelText("Delete account")).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText("Cancel or manage billing"));
    expect(onManageStoreSubscription).toHaveBeenCalledTimes(1);
  });

  it("shows the native app version and build number under logout", () => {
    render(
      <ParentApp
        initialTab="settings"
        kids={[mia]}
        appVersionLabel="chorey · v1.2.3 (45)"
      />,
    );

    expect(screen.getByText("chorey · v1.2.3 (45)")).toBeOnTheScreen();
  });

  it("steps a kid's budget by $5", () => {
    const onChangeBudget = jest.fn();
    render(
      <ParentApp
        initialTab="settings"
        kids={[mia]}
        onChangeBudget={onChangeBudget}
      />,
    );

    // Mia starts at $25.00 (2500c) → increase to 3000
    fireEvent.press(screen.getByLabelText("Increase budget"));
    expect(onChangeBudget).toHaveBeenCalledWith("k1", 3000);
  });

  it("nudges the split and clamps Giving at the floor", () => {
    const onChangeSplit = jest.fn();
    const view = render(
      <ParentApp
        initialTab="settings"
        kids={[mia]}
        onChangeSplit={onChangeSplit}
      />,
    );

    // Increase Spend 40 → 45; Savings absorbs the change (40 → 35), Give holds.
    fireEvent.press(screen.getByLabelText("Increase Spend"));
    expect(onChangeSplit).toHaveBeenCalledWith({
      spend: 45,
      save: 35,
      give: 20,
    });

    // With Giving already at the 10% floor, decreasing keeps it at 10.
    view.rerender(
      <ParentApp
        initialTab="settings"
        kids={[mia]}
        split={{ spend: 40, save: 50, give: 10 }}
        onChangeSplit={onChangeSplit}
      />,
    );
    onChangeSplit.mockClear();
    fireEvent.press(screen.getByLabelText("Decrease Give"));
    expect(onChangeSplit).toHaveBeenCalledWith({
      spend: 40,
      save: 50,
      give: 10,
    });
  });

  it("switches a kid's cadence", () => {
    const onChangeCadence = jest.fn();
    render(
      <ParentApp
        initialTab="settings"
        kids={[mia]}
        onChangeCadence={onChangeCadence}
      />,
    );

    fireEvent.press(screen.getByLabelText("Mia monthly"));
    expect(onChangeCadence).toHaveBeenCalledWith("k1", "monthly");
  });

  it("logs out from the settings tab", () => {
    const onLogOut = jest.fn();
    render(
      <ParentApp initialTab="settings" kids={[mia]} onLogOut={onLogOut} />,
    );

    fireEvent.press(screen.getByLabelText("Log out"));
    expect(onLogOut).toHaveBeenCalledTimes(1);
  });

  it("shows the subscription row and opens management from settings", () => {
    const onManageSubscription = jest.fn();
    render(
      <ParentApp
        initialTab="settings"
        kids={[mia]}
        subscriptionLabel="Free trial · ends Jun 25, 2026"
        onManageSubscription={onManageSubscription}
      />,
    );

    expect(screen.getByText("Chorey Family")).toBeOnTheScreen();
    expect(screen.getByText("Manage your plan")).toBeOnTheScreen();
    // The trial countdown lives on the profile sheet, not in the settings list —
    // we don't want it nagging the parent about days left here.
    expect(screen.queryByText(/Free trial/)).toBeNull();
    fireEvent.press(screen.getByLabelText("Manage subscription"));
    expect(onManageSubscription).toHaveBeenCalledTimes(1);
  });

  it("shows each kid's access code so a lost code is recoverable", () => {
    render(
      <ParentApp
        initialTab="settings"
        kids={[mia]}
        accessCodes={[{ kidId: "k1", accessCode: "482913" }]}
      />,
    );

    expect(screen.getByText("Child sign-in codes")).toBeOnTheScreen();
    expect(screen.getByText("482913")).toBeOnTheScreen();
  });

  it("creates and cancels co-parent invites from settings", async () => {
    const onCreateInvite = jest.fn().mockResolvedValue({
      id: "invite-2",
      email: "step@example.com",
      role: "parent_admin",
      status: "pending",
      expiresAt: "2026-07-07T12:00:00Z",
      createdAt: "2026-06-30T12:00:00Z",
      inviteCode: "FAM-AB12CD34",
      inviteUrl: "chorey://parent/invite?token=FAM-AB12CD34",
    });
    const onCancelInvite = jest.fn();

    render(
      <ParentApp
        initialTab="settings"
        kids={[mia]}
        parentInvites={[
          {
            id: "invite-1",
            email: "dad@example.com",
            role: "parent_admin",
            status: "pending",
            expiresAt: "2026-07-07T12:00:00Z",
            createdAt: "2026-06-30T12:00:00Z",
          },
        ]}
        onCreateParentInvite={onCreateInvite}
        onCancelParentInvite={onCancelInvite}
      />,
    );

    fireEvent.changeText(screen.getByLabelText("Co-parent email"), " step@example.com ");
    fireEvent.press(screen.getByLabelText("Create co-parent invite"));

    expect(onCreateInvite).toHaveBeenCalledWith("step@example.com");
    // The human-typeable family code is the deliverable, not a link.
    expect(await screen.findByText("FAM-AB12CD34")).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText("Cancel invite for dad@example.com"));
    expect(onCancelInvite).toHaveBeenCalledWith("invite-1");
  });

  it("ships no placeholder settings rows", () => {
    render(<ParentApp initialTab="settings" kids={[mia]} />);

    // These were static labels wired to nothing — gone until they're real.
    expect(screen.queryByText("Pay-out day")).toBeNull();
    expect(screen.queryByText("Notifications")).toBeNull();
    expect(screen.queryByText("Dark mode")).toBeNull();
    expect(screen.queryByText("Causes kids can give to")).toBeNull();
  });
});

describe("ParentApp empty state", () => {
  it("shows a getting-started state instead of zero totals when there are no kids", () => {
    const onAddKid = jest.fn();
    render(<ParentApp kids={[]} onAddKid={onAddKid} />);

    expect(screen.getByText("No children yet.")).toBeOnTheScreen();
    // No wall of zeros: the household total card is replaced entirely.
    expect(screen.queryByText("This week, all children")).toBeNull();

    fireEvent.press(screen.getByLabelText("Add your first child"));
    expect(onAddKid).toHaveBeenCalled();
  });
});

describe("ParentApp kid levels", () => {
  it("shows each kid's level sticker when provided", () => {
    render(<ParentApp kids={[{ ...mia, level: 4 }]} />);
    expect(screen.getByText("Lv 4")).toBeOnTheScreen();
  });
});

describe("ParentApp · Chores board", () => {
  const board = [
    {
      id: "b1",
      title: "Wash dishes",
      childName: "Mia",
      rewardCents: 200,
      tone: "allowance" as const,
      status: "submitted" as const,
    },
    {
      id: "b2",
      title: "Feed cat",
      childName: "Mia",
      rewardCents: 100,
      tone: "allowance" as const,
      status: "assigned" as const,
      late: true,
    },
    {
      id: "b3",
      title: "Make bed",
      childName: "Mia",
      rewardCents: 100,
      tone: "allowance" as const,
      status: "approved" as const,
    },
  ];

  it("groups chores into Needs approval / To do / Done", () => {
    render(<ParentApp initialTab="chores" kids={[mia]} choreBoard={board} />);

    expect(screen.getByText("Needs your approval · 1")).toBeOnTheScreen();
    expect(screen.getByText("To do · 1")).toBeOnTheScreen();
    expect(screen.getByText("Done · 1")).toBeOnTheScreen();
    // The overdue daily chore is flagged late, in the row and the section badge.
    expect(screen.getByText("Late")).toBeOnTheScreen();
    expect(screen.getByText("1 late")).toBeOnTheScreen();
  });

  it("approves a submitted chore straight from the Chores tab", () => {
    const onApproveChore = jest.fn();
    render(
      <ParentApp
        initialTab="chores"
        kids={[mia]}
        choreBoard={board}
        onApproveChore={onApproveChore}
      />,
    );

    fireEvent.press(screen.getByLabelText("Approve Wash dishes"));
    expect(onApproveChore).toHaveBeenCalledWith("b1");
  });

  it("sends a submitted chore back with a reason from the Chores tab", () => {
    const onSendBackChore = jest.fn();
    render(
      <ParentApp
        initialTab="chores"
        kids={[mia]}
        choreBoard={board}
        onSendBackChore={onSendBackChore}
      />,
    );

    fireEvent.press(screen.getByLabelText("Send back Wash dishes"));
    fireEvent.changeText(
      screen.getByLabelText("Send-back reason"),
      "Do it again",
    );
    fireEvent.press(screen.getByLabelText("Confirm send back"));
    expect(onSendBackChore).toHaveBeenCalledWith("b1", "Do it again");
  });

  it("opens a done chore's detail and saves a note", () => {
    const onSaveNote = jest.fn();
    render(
      <ParentApp
        initialTab="chores"
        kids={[mia]}
        choreBoard={[{ ...board[2], parentNote: "Looked great" }]}
        onSaveChoreNote={onSaveNote}
      />,
    );

    // Tapping the done row opens its detail card, seeded with the saved note.
    fireEvent.press(screen.getByLabelText("Open Make bed"));
    const field = screen.getByLabelText("Chore note");
    expect(field.props.value).toBe("Looked great");

    fireEvent.changeText(field, "Nice work!");
    fireEvent.press(screen.getByLabelText("Save note"));
    expect(onSaveNote).toHaveBeenCalledWith("b3", "Nice work!");
  });
});
