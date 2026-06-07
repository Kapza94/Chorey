import { fireEvent, render, screen } from "@testing-library/react-native";

import { KidHomeScreen } from "@/features/kid-home/kid-home-screen";

const saturday = new Date("2026-06-06T09:00:00.000Z"); // a Saturday

function renderHome(overrides = {}) {
  return render(
    <KidHomeScreen
      name="Mia"
      streakDays={4}
      today={saturday}
      chores={[
        { id: "c1", name: "Make the bed", valueCents: 100, state: "todo" },
        { id: "c2", name: "Walk the dog", valueCents: 300, state: "waiting" },
      ]}
      // real, approved balances from the ledger
      spendCents={0}
      savingsCents={0}
      givingCents={0}
      {...overrides}
    />,
  );
}

describe("KidHomeScreen", () => {
  it("greets the kid with the weekday and a streak chip", () => {
    renderHome();

    expect(screen.getByText("Saturday")).toBeOnTheScreen();
    expect(screen.getByText("Hey, Mia.")).toBeOnTheScreen();
    expect(screen.getByText("4-day streak")).toBeOnTheScreen();
  });

  it("shows only real, approved money in 'this week so far'", () => {
    // Approved ledger: 80 spend / 80 save / 40 give = $2.00 total.
    renderHome({ spendCents: 80, savingsCents: 80, givingCents: 40 });

    expect(screen.getByText("$2")).toBeOnTheScreen(); // hero lead
    expect(screen.getAllByText("$0.80")).toHaveLength(2); // Spend + Save buckets
    expect(screen.getByText("$0.40")).toBeOnTheScreen(); // Give bucket
  });

  it("shows done-but-unapproved chores as waiting, not as money", () => {
    // Nothing approved (balances 0), one chore waiting ($3.00).
    renderHome();

    // Hero is $0.00 — the waiting chore is not counted as earned.
    expect(screen.getByText("$0")).toBeOnTheScreen();
    // A waiting banner explains the pending amount.
    expect(screen.getByText("$3.00 waiting to be approved")).toBeOnTheScreen();
    expect(screen.getByText("Waiting for a parent")).toBeOnTheScreen();
  });

  it("still shows a to-do chore in the 'to go' heading", () => {
    // c1 is todo → there's work left to do.
    renderHome();
    expect(screen.getByText("to go")).toBeOnTheScreen();
    expect(screen.queryByText("Done for today.")).toBeNull();
  });

  it("submits a to-do chore when its row is pressed", () => {
    const onToggleChore = jest.fn();
    renderHome({ onToggleChore });

    fireEvent.press(screen.getByLabelText("Make the bed"));
    expect(onToggleChore).toHaveBeenCalledWith("c1");
  });

  it("does not re-submit a waiting chore", () => {
    const onToggleChore = jest.fn();
    renderHome({ onToggleChore });

    fireEvent.press(screen.getByLabelText("Walk the dog")); // waiting
    expect(onToggleChore).not.toHaveBeenCalled();
  });
});
