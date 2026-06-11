import { fireEvent, render, screen } from "@testing-library/react-native";

import { OnboardingFlow } from "@/features/onboarding/onboarding-flow";

describe("onboarding demo tour", () => {
  it("shows the approve demo after choosing the parent role", () => {
    render(<OnboardingFlow initialStep="role" />);

    fireEvent.press(screen.getByLabelText("I'm a parent"));

    expect(screen.getByText("Try it — approve Mia's chore.")).toBeOnTheScreen();
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

  it("gates Continue until the chore is approved", () => {
    render(<OnboardingFlow initialStep="p_demo" />);

    const next = screen.getByText("Continue");
    fireEvent.press(next);
    expect(screen.getByText("Try it — approve Mia's chore.")).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText("Approve Feed the dog"));
    fireEvent.press(screen.getByText("Continue"));
    expect(screen.getByText("Here's what Mia sees.")).toBeOnTheScreen();
  });

  it("walks approve demo → kid view demo → family setup", () => {
    render(<OnboardingFlow initialStep="p_demo" />);

    fireEvent.press(screen.getByLabelText("Approve Feed the dog"));
    fireEvent.press(screen.getByText("Continue"));

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
