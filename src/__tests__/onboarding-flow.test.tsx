import { fireEvent, render, screen } from "@testing-library/react-native";

import { OnboardingFlow } from "@/features/onboarding/onboarding-flow";

describe("OnboardingFlow", () => {
  it("walks welcome → big idea → role", () => {
    render(<OnboardingFlow />);

    expect(screen.getByText("chorey")).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Get started"));

    expect(screen.getByText("Every dollar splits three ways.")).toBeOnTheScreen();
    fireEvent.press(screen.getByText("I'm in"));

    expect(screen.getByText("Who's setting up?")).toBeOnTheScreen();
  });

  it("completes the parent branch and reports the collected setup", () => {
    const onComplete = jest.fn();
    render(<OnboardingFlow initialStep="p_family" onComplete={onComplete} />);

    // Family + country
    fireEvent.changeText(screen.getByLabelText("Your name"), "Alex");
    fireEvent.changeText(screen.getByLabelText("Family name"), "Rivera");
    fireEvent.press(screen.getByLabelText("Choose your country"));
    fireEvent.press(screen.getByLabelText("Serbia"));
    // caption reflects the chosen currency
    expect(screen.getByText(/RSD \(дин\)/)).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Continue"));

    // Add a kid
    fireEvent.changeText(screen.getByLabelText("Name"), "Mia");
    fireEvent.press(screen.getByLabelText("Add kid"));
    fireEvent.press(screen.getByText("Continue"));

    // Budget & split — default 40/40/20
    expect(screen.getByText("Budget & split.")).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Use the 40/40/20 split"));

    // First chores
    fireEvent.press(screen.getByLabelText("Make the bed"));
    fireEvent.press(screen.getByText("Add 1 chore"));

    // Charities
    fireEvent.press(screen.getByLabelText("City Food Bank"));
    fireEvent.press(screen.getByText("Continue"));

    // All set → finish
    expect(screen.getByText("You're all set.")).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Go to dashboard"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0];
    expect(result).toMatchObject({
      role: "parent",
      parentName: "Alex",
      familyName: "Rivera",
      country: "RS",
      currency: "RSD",
      cadence: "weekly",
      budgetCents: 2500,
      split: { spend: 40, save: 40, give: 20 },
    });
    expect(result.kids).toHaveLength(1);
    expect(result.kids[0].name).toBe("Mia");
    expect(result.chores).toHaveLength(1);
    expect(result.charities).toEqual(["City Food Bank"]);
    expect(result.joinCode).toBe("CHRIVE");
  });

  it("auto-balances Save when Spend changes in the split editor", () => {
    render(<OnboardingFlow initialStep="p_split" />);

    // default 40/40/20 → increase Spend by 5 → 45 spend, 35 save, 20 give
    fireEvent.press(screen.getByLabelText("Increase Spend"));
    expect(screen.getByText("45%")).toBeOnTheScreen();
    expect(screen.getByText("35%")).toBeOnTheScreen();
  });

  it("gates the kid branch on a full 6-char code and reports it", () => {
    const onComplete = jest.fn();
    render(<OnboardingFlow initialStep="k_code" onComplete={onComplete} />);

    fireEvent.press(screen.getByText("Use a sample code"));
    fireEvent.press(screen.getByText("Join family"));

    // avatar
    fireEvent.changeText(screen.getByLabelText("Your name"), "Mia");
    fireEvent.press(screen.getByText("That's me"));

    // how it works
    expect(screen.getByText("Welcome, Mia!")).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Start earning"));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ role: "kid", code: "CHRVR1", kidName: "Mia" }),
    );
  });
});
