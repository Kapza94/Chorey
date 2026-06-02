import { fireEvent, render, screen } from "@testing-library/react-native";

import { KidApp } from "@/features/kid-home/kid-app";

const baseProps = {
  name: "Mia",
  streakDays: 4,
  currency: "USD" as const,
  chores: [{ id: "c1", name: "Make the bed", valueCents: 100, done: false }],
  spendableCents: 2850,
  wishes: [
    { id: "w1", name: "Skateboard", targetCents: 6500, status: "active" as const },
    { id: "w2", name: "New book", targetCents: 1400, status: "active" as const },
  ],
  savingsCents: 1280,
  givingCents: 120,
  charityName: "City Food Bank",
  givenThisMonthCents: 120,
};

describe("KidApp shell", () => {
  it("starts on Home and switches tabs from the bar", () => {
    render(<KidApp {...baseProps} />);

    expect(screen.getByText("Hey, Mia.")).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText("Wishlist tab"));
    expect(screen.getByText("Wishlist.")).toBeOnTheScreen();
    expect(screen.getByText("Spendable now")).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText("You tab"));
    expect(screen.getByText("You.")).toBeOnTheScreen();
    expect(screen.getByText("Savings (locked)")).toBeOnTheScreen();
  });

  it("shows a Request button on an affordable wish and reports it", () => {
    const onRequestPurchase = jest.fn();
    render(
      <KidApp {...baseProps} initialTab="wish" onRequestPurchase={onRequestPurchase} />,
    );

    // $28.50 spendable covers the $14.00 book but not the $65.00 skateboard.
    fireEvent.press(screen.getByLabelText("Request New book"));
    expect(onRequestPurchase).toHaveBeenCalledWith("w2");

    expect(screen.queryByLabelText("Request Skateboard")).toBeNull();
  });

  it("shows locked savings and the picked charity on You", () => {
    render(<KidApp {...baseProps} initialTab="you" />);

    expect(screen.getByText("not spendable")).toBeOnTheScreen();
    expect(screen.getByText("$12.80")).toBeOnTheScreen(); // savings
    expect(screen.getByText(/City Food Bank/)).toBeOnTheScreen();
  });
});
