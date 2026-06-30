import { fireEvent, render, screen } from "@testing-library/react-native";

import { OnboardingFlow } from "@/features/onboarding/onboarding-flow";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe("onboarding demo tour", () => {
  it("shows the approve demo after the big-idea screen", () => {
    render(<OnboardingFlow initialStep="idea" />);

    fireEvent.press(screen.getByText("I'm in"));

    expect(
      screen.getByText("Approve Mia's chore to continue."),
    ).toBeOnTheScreen();
    expect(screen.getByText("Feed the dog")).toBeOnTheScreen();
  });

  it("splits the demo reward 40/40/20 when approved", () => {
    render(<OnboardingFlow initialStep="p_demo" />);

    // Before approving there is nothing split yet.
    expect(screen.queryByText("+$0.80")).toBeNull();

    fireEvent.press(screen.getByLabelText("Approve Feed the dog"));

    // $2.00 → 80¢ Spend / 80¢ Save / 40¢ Give, straight from splitRewardCents.
    expect(screen.getAllByText("+$0.80")).toHaveLength(2);
    expect(screen.getByText("+$0.40")).toBeOnTheScreen();
  });

  it("gates advancing until the chore is approved", () => {
    render(<OnboardingFlow initialStep="p_demo" />);

    // There is no way to continue to the kid demo until the chore is approved:
    // the footer button reads "Approve" (disabled), not "Continue".
    expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();
    expect(screen.queryByText("Here's what Mia sees.")).toBeNull();

    fireEvent.press(screen.getByLabelText("Approve Feed the dog"));
    fireEvent.press(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Here's what Mia sees.")).toBeOnTheScreen();
  });

  it("walks approve demo → kid view demo → family setup", () => {
    render(<OnboardingFlow initialStep="p_demo" />);

    fireEvent.press(screen.getByLabelText("Approve Feed the dog"));
    fireEvent.press(screen.getByRole("button", { name: "Continue" }));

    // The kid demo embeds the real kid home screen with Mia's demo data.
    expect(screen.getByText("Here's what Mia sees.")).toBeOnTheScreen();
    expect(screen.getByText("Make the bed")).toBeOnTheScreen();

    fireEvent.press(screen.getByText("Continue"));
    expect(screen.getByText("Set up your family.")).toBeOnTheScreen();
  });

  it("lets parents skip the tour straight to setup", () => {
    render(<OnboardingFlow initialStep="p_demo" />);

    fireEvent.press(screen.getByText("Skip the tour"));

    expect(screen.getByText("Set up your family.")).toBeOnTheScreen();
  });
});
