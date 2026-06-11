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
    expect(screen.getByText(/ends Jun 25, 2026/)).toBeOnTheScreen();
    expect(screen.getByLabelText("Choose monthly billing")).toBeOnTheScreen();
    expect(screen.getByLabelText("Choose yearly billing")).toBeOnTheScreen();
  });

  it("reports the chosen plan", () => {
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

    fireEvent.press(screen.getByLabelText("Choose yearly billing"));
    expect(onChoosePlan).toHaveBeenCalledWith("yearly");
  });

  it("shows the already-chosen plan as selected", () => {
    render(
      <SubscriptionScreen
        subscription={{
          status: "trialing",
          plan: "yearly",
          trialEndsAt: "2026-06-25T00:00:00Z",
          currentPeriodEndsAt: null,
        }}
      />,
    );

    expect(
      screen.getByLabelText("Choose yearly billing").props.accessibilityState,
    ).toMatchObject({ selected: true });
    expect(screen.getByText(/Billed yearly after the trial/)).toBeOnTheScreen();
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
});
