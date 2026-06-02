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
        { id: "c1", name: "Make the bed", valueCents: 100, done: false },
        { id: "c2", name: "Walk the dog", valueCents: 300, done: true },
      ]}
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

  it("shows the 40/40/20 split of what has been earned so far", () => {
    // Only the $3.00 chore is done → earned 300 → 120 / 120 / 60
    renderHome();

    expect(screen.getByText("$3")).toBeOnTheScreen(); // hero lead
    expect(screen.getByText(".00")).toBeOnTheScreen(); // hero cents
    expect(screen.getAllByText("$1.20")).toHaveLength(2); // Spend + Save buckets
    expect(screen.getByText("$0.60")).toBeOnTheScreen(); // Give bucket
  });

  it("counts the chores left to do", () => {
    renderHome();
    expect(screen.getByText(/1\s*chore/)).toBeOnTheScreen();
  });

  it("renders done chores with a + earnings amount", () => {
    renderHome();
    expect(screen.getByText("+$3.00")).toBeOnTheScreen();
    expect(screen.getByText("$1.00")).toBeOnTheScreen(); // undone chore value
  });

  it("toggles a chore when its row is pressed", () => {
    const onToggleChore = jest.fn();
    renderHome({ onToggleChore });

    fireEvent.press(screen.getByLabelText("Make the bed"));

    expect(onToggleChore).toHaveBeenCalledWith("c1");
  });

  it("switches tabs from the bottom bar", () => {
    const onChangeTab = jest.fn();
    renderHome({ onChangeTab });

    fireEvent.press(screen.getByLabelText("Wishlist tab"));

    expect(onChangeTab).toHaveBeenCalledWith("wish");
  });

  it("formats money in the family currency", () => {
    renderHome({ currency: "RSD" });
    // 300 cents → 3 дин earned; buckets 120/120/60 → 1 дин each
    expect(screen.getByText("3")).toBeOnTheScreen(); // hero lead
    expect(screen.getAllByText(/дин/).length).toBeGreaterThan(0);
  });
});
