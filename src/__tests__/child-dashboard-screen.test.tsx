import { fireEvent, render, screen } from "@testing-library/react-native";

import { ChildDashboardScreen } from "@/features/child-dashboard/child-dashboard-screen";

describe("ChildDashboardScreen", () => {
  it("welcomes the child and shows buckets", () => {
    render(
      <ChildDashboardScreen
        bucketBalances={{
          givingCents: 200,
          savingsCents: 400,
          spendCents: 400,
        }}
        childName="Mina"
      />,
    );

    expect(screen.getByText("Hi Mina")).toBeOnTheScreen();
    expect(screen.getByText("Spend")).toBeOnTheScreen();
    expect(screen.getByText("Savings")).toBeOnTheScreen();
    expect(screen.getByText("Giving")).toBeOnTheScreen();
    expect(screen.getAllByText("4.00")).toHaveLength(2);
    expect(screen.getByText("2.00")).toBeOnTheScreen();
  });

  it("shows assigned chores", () => {
    render(
      <ChildDashboardScreen
        childName="Mina"
        chores={[
          {
            id: "chore-1",
            title: "Load dishwasher",
            rewardCents: 250,
            status: "assigned",
          },
        ]}
      />,
    );

    expect(screen.getByText("Load dishwasher")).toBeOnTheScreen();
    expect(screen.getByText("2.50")).toBeOnTheScreen();
    expect(screen.getByText("Ready to do")).toBeOnTheScreen();
    expect(screen.getByLabelText("Submit Load dishwasher")).toBeOnTheScreen();
  });

  it("shows spend wishlist and creates a wishlist item", () => {
    const onCreateWishlistItem = jest.fn();
    const onRequestPurchase = jest.fn();

    render(
      <ChildDashboardScreen
        childName="Mina"
        onCreateWishlistItem={onCreateWishlistItem}
        onRequestPurchase={onRequestPurchase}
        wishlistItems={[
          {
            id: "wish-1",
            name: "Football",
            status: "active",
            targetCents: 2500,
          },
        ]}
      />,
    );

    expect(screen.getByText("Spend wishlist")).toBeOnTheScreen();
    expect(screen.getByText("Football")).toBeOnTheScreen();
    expect(screen.getByText("25.00")).toBeOnTheScreen();

    fireEvent.changeText(screen.getByLabelText("Wishlist item name"), "Skates");
    fireEvent.changeText(screen.getByLabelText("Wishlist target"), "30.00");
    fireEvent.press(screen.getByLabelText("Add wishlist item"));
    fireEvent.press(screen.getByLabelText("Request Football"));

    expect(onCreateWishlistItem).toHaveBeenCalledWith({
      name: "Skates",
      targetCents: 3000,
    });
    expect(onRequestPurchase).toHaveBeenCalledWith("wish-1");
  });

  it("shows done state after submission", () => {
    render(
      <ChildDashboardScreen
        childName="Mina"
        chores={[
          {
            id: "chore-1",
            title: "Load dishwasher",
            rewardCents: 250,
            status: "submitted",
          },
        ]}
      />,
    );

    expect(screen.getByLabelText("Done check")).toBeOnTheScreen();
    expect(screen.getByText("Done")).toBeOnTheScreen();
    expect(screen.getByText("Waiting for parent")).toBeOnTheScreen();
  });

  it("shows giving options and suggests a new option", () => {
    const onSuggestGivingOption = jest.fn();

    render(
      <ChildDashboardScreen
        childName="Mina"
        givingOptions={[{ id: "option-1", name: "Animal shelter" }]}
        onSuggestGivingOption={onSuggestGivingOption}
      />,
    );

    expect(screen.getByText("Giving options")).toBeOnTheScreen();
    expect(screen.getByText("Animal shelter")).toBeOnTheScreen();

    fireEvent.changeText(
      screen.getByLabelText("Giving suggestion name"),
      "Food bank",
    );
    fireEvent.press(screen.getByLabelText("Suggest giving option"));

    expect(onSuggestGivingOption).toHaveBeenCalledWith("Food bank");
  });

  it("shows sending state while submitting", () => {
    render(
      <ChildDashboardScreen
        childName="Mina"
        chores={[
          {
            id: "chore-1",
            title: "Load dishwasher",
            rewardCents: 250,
            status: "assigned",
          },
        ]}
        submittingChoreId="chore-1"
      />,
    );

    expect(screen.getByText("Sending...")).toBeOnTheScreen();
  });

  it("submits an assigned chore", () => {
    const onSubmitChore = jest.fn();

    render(
      <ChildDashboardScreen
        childName="Mina"
        chores={[
          {
            id: "chore-1",
            title: "Load dishwasher",
            rewardCents: 250,
            status: "assigned",
          },
        ]}
        onSubmitChore={onSubmitChore}
      />,
    );

    fireEvent.press(screen.getByLabelText("Submit Load dishwasher"));

    expect(onSubmitChore).toHaveBeenCalledWith("chore-1");
  });

  it("goes back from child dashboard", () => {
    const onBack = jest.fn();

    render(<ChildDashboardScreen childName="Mina" onBack={onBack} />);

    fireEvent.press(screen.getByLabelText("Go back"));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
