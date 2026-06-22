import { fireEvent, render, screen } from "@testing-library/react-native";

import { SubscriptionScreen } from "@/features/subscription/subscription-screen";

describe("SubscriptionScreen", () => {
  it("shows the trial with its exact end date and asks for a billing choice", () => {
    render(
      <SubscriptionScreen
        subscription={{
          status: "trialing",
          plan: null,
          trialEndsAt: "2026-06-25T00:00:00Z",
          currentPeriodEndsAt: null,
        }}
      />,
    );

    expect(screen.getByText("Chorey Family")).toBeOnTheScreen();
    expect(screen.getByText("Free trial")).toBeOnTheScreen();
    expect(screen.getByText(/Free until Jun 25, 2026/)).toBeOnTheScreen();
    expect(screen.getByLabelText("Choose monthly billing")).toBeOnTheScreen();
    expect(screen.getByLabelText("Choose annual billing")).toBeOnTheScreen();
  });

  it("reports the selected plan only after Subscribe is pressed", () => {
    const onChoosePlan = jest.fn();
    render(
      <SubscriptionScreen
        subscription={{
          status: "trialing",
          plan: null,
          trialEndsAt: "2026-06-25T00:00:00Z",
          currentPeriodEndsAt: null,
        }}
        onChoosePlan={onChoosePlan}
      />,
    );

    // Tapping a card only selects it — no purchase yet.
    fireEvent.press(screen.getByLabelText("Choose monthly billing"));
    expect(onChoosePlan).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText("Subscribe — monthly billing"));
    expect(onChoosePlan).toHaveBeenCalledWith("monthly");
  });

  it("defaults the selection to the annual plan", () => {
    const onChoosePlan = jest.fn();
    render(
      <SubscriptionScreen
        subscription={{
          status: "trialing",
          plan: null,
          trialEndsAt: "2026-06-25T00:00:00Z",
          currentPeriodEndsAt: null,
        }}
        onChoosePlan={onChoosePlan}
      />,
    );

    expect(
      screen.getByLabelText("Choose annual billing").props.accessibilityState,
    ).toMatchObject({ selected: true });

    // Subscribe without touching a card commits the default (annual).
    fireEvent.press(screen.getByLabelText("Subscribe — annual billing"));
    expect(onChoosePlan).toHaveBeenCalledWith("annual");
  });

  it("shows the already-chosen plan as selected", () => {
    render(
      <SubscriptionScreen
        subscription={{
          status: "trialing",
          plan: "annual",
          trialEndsAt: "2026-06-25T00:00:00Z",
          currentPeriodEndsAt: null,
        }}
      />,
    );

    expect(
      screen.getByLabelText("Choose annual billing").props.accessibilityState,
    ).toMatchObject({ selected: true });
    expect(screen.getByText(/billed annually/)).toBeOnTheScreen();
  });

  it("shows the paused state with data reassurance when lapsed", () => {
    render(
      <SubscriptionScreen
        subscription={{
          status: "lapsed",
          plan: "monthly",
          trialEndsAt: "2026-06-25T00:00:00Z",
          currentPeriodEndsAt: null,
        }}
      />,
    );

    expect(screen.getByText("Your subscription has ended")).toBeOnTheScreen();
    expect(screen.getByText(/Everything your family built is saved/)).toBeOnTheScreen();
    expect(screen.getByText(/Balances and history stay readable/)).toBeOnTheScreen();
  });

  it("never invents a price — amounts come from the store at purchase time", () => {
    render(
      <SubscriptionScreen
        subscription={{
          status: "trialing",
          plan: null,
          trialEndsAt: "2026-06-25T00:00:00Z",
          currentPeriodEndsAt: null,
        }}
      />,
    );

    expect(screen.queryByText(/\$\d/)).toBeNull();
    expect(screen.getByText(/confirmed in the App Store/)).toBeOnTheScreen();
  });

  it("shows the live store prices when RevenueCat offers are provided", () => {
    render(
      <SubscriptionScreen
        subscription={{
          status: "trialing",
          plan: null,
          trialEndsAt: "2026-06-25T00:00:00Z",
          currentPeriodEndsAt: null,
        }}
        offers={[
          { plan: "monthly", priceString: "$4.99", packageIdentifier: "m" },
          { plan: "annual", priceString: "$59.99", packageIdentifier: "y" },
        ]}
      />,
    );

    expect(screen.getByText("$4.99")).toBeOnTheScreen();
    expect(screen.getByText("$59.99")).toBeOnTheScreen();
  });

  it("purchases the tapped plan and can restore prior purchases", () => {
    const onChoosePlan = jest.fn();
    const onRestore = jest.fn();
    render(
      <SubscriptionScreen
        subscription={{
          status: "trialing",
          plan: null,
          trialEndsAt: "2026-06-25T00:00:00Z",
          currentPeriodEndsAt: null,
        }}
        offers={[
          { plan: "monthly", priceString: "$4.99", packageIdentifier: "m" },
          { plan: "annual", priceString: "$59.99", packageIdentifier: "y" },
        ]}
        onChoosePlan={onChoosePlan}
        onRestore={onRestore}
      />,
    );

    fireEvent.press(screen.getByLabelText("Choose monthly billing"));
    fireEvent.press(screen.getByLabelText("Subscribe — monthly billing"));
    expect(onChoosePlan).toHaveBeenCalledWith("monthly");

    fireEvent.press(screen.getByLabelText("Restore purchases"));
    expect(onRestore).toHaveBeenCalledTimes(1);
  });

  it("lets a lapsed household resubscribe when billing is wired", () => {
    const onChoosePlan = jest.fn();
    render(
      <SubscriptionScreen
        subscription={{
          status: "lapsed",
          plan: "monthly",
          trialEndsAt: null,
          currentPeriodEndsAt: null,
        }}
        offers={[
          { plan: "monthly", priceString: "$4.99", packageIdentifier: "m" },
          { plan: "annual", priceString: "$59.99", packageIdentifier: "y" },
        ]}
        onChoosePlan={onChoosePlan}
      />,
    );

    expect(screen.getByText("Your subscription has ended")).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText("Choose annual billing"));
    fireEvent.press(screen.getByLabelText("Subscribe — annual billing"));
    expect(onChoosePlan).toHaveBeenCalledWith("annual");
  });
});
