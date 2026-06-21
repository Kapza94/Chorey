import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { KidApp } from "@/features/kid-home/kid-app";

const baseProps = {
  name: "Mia",
  currency: "USD" as const,
  chores: [
    { id: "c1", name: "Make the bed", valueCents: 100, state: "todo" as const },
  ],
  spendableCents: 2850,
  wishes: [
    { id: "w1", name: "Skateboard", targetCents: 6500, status: "active" as const },
    { id: "w2", name: "New book", targetCents: 1400, status: "active" as const },
  ],
  savingsCents: 1280,
  givingCents: 120,
  causeName: "Animals",
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

  it("opens chore details and submits through the modal", async () => {
    const onSubmitChore = jest.fn().mockResolvedValue(undefined);
    render(<KidApp {...baseProps} onSubmitChore={onSubmitChore} />);

    fireEvent.press(screen.getByLabelText("Make the bed"));
    expect(screen.getByLabelText("Close chore")).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText("Mark as finished"));
    await waitFor(() => expect(onSubmitChore).toHaveBeenCalledWith("c1", null));
  });

  it("opens a waiting chore and forwards confirmed undo", async () => {
    const onUndoChore = jest.fn().mockResolvedValue(undefined);
    render(
      <KidApp
        {...baseProps}
        chores={[
          {
            id: "c2",
            name: "Walk the dog",
            valueCents: 300,
            state: "waiting",
          },
        ]}
        onUndoChore={onUndoChore}
      />,
    );

    fireEvent.press(screen.getByLabelText("Walk the dog"));
    fireEvent.press(screen.getByLabelText("Undo finished"));
    fireEvent.press(screen.getByLabelText("Confirm move to To do"));

    await waitFor(() => expect(onUndoChore).toHaveBeenCalledWith("c2"));
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

  it("adds a wish through the add-wish sheet", () => {
    const onAddWish = jest.fn();
    render(<KidApp {...baseProps} initialTab="wish" onAddWish={onAddWish} />);

    fireEvent.press(screen.getByLabelText("Add a wish"));
    fireEvent.changeText(screen.getByLabelText("Wish name"), "Lego set");
    fireEvent.changeText(screen.getByLabelText("Wish cost"), "40.00");
    fireEvent.press(screen.getByLabelText("Save wish"));

    expect(onAddWish).toHaveBeenCalledWith({ name: "Lego set", targetCents: 4000 });
  });

  it("shows locked savings and the chosen cause on You", () => {
    render(<KidApp {...baseProps} initialTab="you" />);

    expect(screen.getByText("not spendable")).toBeOnTheScreen();
    expect(screen.getByText("$12.80")).toBeOnTheScreen(); // savings
    expect(screen.getByText(/Animals/)).toBeOnTheScreen();
    // Giving is confirmed by a parent at settlement — kids don't self-certify,
    // and no dead buttons ship on the kid surface.
    expect(screen.queryByLabelText("Mark as given")).toBeNull();
    expect(screen.queryByLabelText("See all earnings")).toBeNull();
    expect(screen.queryByLabelText("Tell a parent something")).toBeNull();
  });

  it("surfaces the wishlist under Savings on You (no single goal)", () => {
    render(<KidApp {...baseProps} initialTab="you" />);

    // Savings is "saving for many things" — the active wishes appear here.
    expect(screen.getByText("Saving for")).toBeOnTheScreen();
    expect(screen.getByText("Skateboard")).toBeOnTheScreen();
    expect(screen.getByText("New book")).toBeOnTheScreen();
    // The retired single-goal affordance is gone.
    expect(screen.queryByLabelText("Set a savings goal")).toBeNull();
  });

  it("nudges toward the wishlist when there is nothing saved for yet", () => {
    render(<KidApp {...baseProps} initialTab="you" wishes={[]} />);

    expect(
      screen.getByText(/your savings grow toward all of them/i),
    ).toBeOnTheScreen();
  });

  it("suggests a giving cause through the sheet", () => {
    const onSuggestCause = jest.fn();
    render(<KidApp {...baseProps} initialTab="you" onSuggestCause={onSuggestCause} />);

    fireEvent.press(screen.getByLabelText("Suggest a cause"));
    fireEvent.changeText(screen.getByLabelText("Cause name"), "Animal shelter");
    fireEvent.press(screen.getByLabelText("Send suggestion"));

    expect(onSuggestCause).toHaveBeenCalledWith("Animal shelter");
  });

  it("logs out from the You tab", () => {
    const onLogOut = jest.fn();
    render(<KidApp {...baseProps} initialTab="you" onLogOut={onLogOut} />);

    fireEvent.press(screen.getByLabelText("Log out"));
    expect(onLogOut).toHaveBeenCalledTimes(1);
  });
});
