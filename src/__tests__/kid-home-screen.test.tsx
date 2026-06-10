import { fireEvent, render, screen } from "@testing-library/react-native";

import { KidHomeScreen } from "@/features/kid-home/kid-home-screen";

const saturday = new Date("2026-06-06T09:00:00.000Z"); // a Saturday

function renderHome(overrides = {}) {
  return render(
    <KidHomeScreen
      name="Mia"
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
  it("greets the kid with the weekday — no streak pressure", () => {
    renderHome();

    expect(screen.getByText("Saturday")).toBeOnTheScreen();
    expect(screen.getByText("Hey, Mia.")).toBeOnTheScreen();
    expect(screen.queryByText(/streak/)).toBeNull();
  });

  it("shows only real, approved money under an honest label", () => {
    // Approved ledger: 80 spend / 80 save / 40 give = $2.00 total.
    renderHome({ spendCents: 80, savingsCents: 80, givingCents: 40 });

    // Balances are all-time, so the label must not claim "this week".
    expect(screen.getByText("Your money")).toBeOnTheScreen();
    expect(screen.queryByText("This week so far")).toBeNull();
    expect(screen.getByText("$2")).toBeOnTheScreen(); // hero lead
    expect(screen.getAllByText("$0.80")).toHaveLength(2); // Spend + Save buckets
    expect(screen.getByText("$0.40")).toBeOnTheScreen(); // Give bucket
  });

  it("shows a friendly empty state when no chores are assigned", () => {
    renderHome({ chores: [] });

    expect(screen.getByText("Nothing on your list today.")).toBeOnTheScreen();
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

  it.each([
    ["Make the bed", "c1"],
    ["Walk the dog", "c2"],
  ])("opens %s when its row is pressed", (label, id) => {
    const onOpenChore = jest.fn();
    renderHome({ onOpenChore });

    fireEvent.press(screen.getByLabelText(label));

    expect(onOpenChore).toHaveBeenCalledWith(id);
  });
});
