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

  it("completes the parent branch, creates an account, persists and reports the setup", async () => {
    const onComplete = jest.fn();
    const persist = jest.fn().mockResolvedValue({
      householdId: "h1",
      kids: [{ childProfileId: "c1", name: "Mia", accessCode: "482913" }],
    });
    const auth = {
      sendEmailCode: jest.fn().mockResolvedValue(undefined),
      verifyEmailCode: jest.fn().mockResolvedValue(undefined),
    };
    render(
      <OnboardingFlow
        initialStep="p_family"
        onComplete={onComplete}
        auth={auth}
        persist={persist}
      />,
    );

    // Family + country
    fireEvent.changeText(screen.getByLabelText("Your name"), "Alex");
    fireEvent.changeText(screen.getByLabelText("Family name"), "Rivera");
    fireEvent.press(screen.getByLabelText("Choose your country"));
    fireEvent.press(screen.getByLabelText("Serbia"));
    // caption reflects the chosen currency
    expect(screen.getByText(/RSD \(дин\)/)).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Continue"));

    // Add a kid — the bottom Continue commits the filled-in kid and proceeds
    fireEvent.changeText(screen.getByLabelText("Name"), "Mia");
    fireEvent.press(screen.getByText("Continue"));

    // Budget & split — default 40/40/20
    expect(screen.getByText("Budget & split.")).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Use the 40/40/20 split"));

    // First chores
    fireEvent.press(screen.getByLabelText("Make the bed"));
    fireEvent.press(screen.getByText("Add 1 chore"));

    // Causes — pick a broad cause idea, not a real charity
    expect(screen.getByText("What matters to your family?")).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText("Animals"));
    fireEvent.press(screen.getByText("Continue"));

    // Create account — email, then the 6-digit code
    fireEvent.changeText(await screen.findByLabelText("Email"), "alex@example.com");
    fireEvent.press(screen.getByText("Email me a code"));
    expect(auth.sendEmailCode).toHaveBeenCalledWith("alex@example.com");

    fireEvent.changeText(await screen.findByLabelText("6-digit code"), "123456");
    fireEvent.press(screen.getByText("Create account & finish"));

    // Verified + persisted → the success screen appears
    expect(await screen.findByText("You're all set.")).toBeOnTheScreen();
    expect(auth.verifyEmailCode).toHaveBeenCalledWith("alex@example.com", "123456");
    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist.mock.calls[0][0]).toMatchObject({
      role: "parent",
      parentName: "Alex",
      kids: [expect.objectContaining({ name: "Mia" })],
    });

    // The success screen shows the REAL generated access code from persistence,
    // not a name-derived placeholder.
    expect(screen.getByText("482913")).toBeOnTheScreen();
    expect(screen.queryByText("CHRIVE")).not.toBeOnTheScreen();

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
    expect(result.causes).toEqual(["Animals"]);
    expect(result.joinCode).toBe("CHRIVE");

    // onComplete also forwards the persisted IDs so the route can load real rows.
    expect(onComplete.mock.calls[0][1]).toMatchObject({ householdId: "h1" });
  });

  it("commits a kid and offers adding another (no add-kid button)", () => {
    render(<OnboardingFlow initialStep="p_addkid" />);

    // No standalone "Add kid" affordance; the bottom button is just Continue.
    expect(screen.queryByLabelText("Add kid")).toBeNull();

    fireEvent.changeText(screen.getByLabelText("Name"), "Mia");
    // "Add another kid" appears once a name is entered
    fireEvent.press(screen.getByText("+ Add another kid"));

    // Mia is committed (shows in the list) and the form resets for the next kid
    expect(screen.getByText("Add another kid.")).toBeOnTheScreen();
    expect(screen.getByText("Mia")).toBeOnTheScreen();
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

  it("suggests more preset chores; custom field is always available", () => {
    render(<OnboardingFlow initialStep="p_chores" />);

    // The write-your-own field shows from the start, alongside suggestions.
    expect(screen.getByLabelText("Chore name")).toBeOnTheScreen();
    // A 4th preset is hidden until suggested.
    expect(screen.queryByLabelText("Take out the trash")).toBeNull();

    for (let i = 0; i < 5; i += 1) {
      fireEvent.press(screen.getByLabelText("Suggest a chore"));
    }

    // A suggested preset now shows and the suggest button is exhausted.
    expect(screen.getByLabelText("Take out the trash")).toBeOnTheScreen();
    expect(screen.queryByLabelText("Suggest a chore")).toBeNull();
  });

  it("gates a second kid behind Premium and lets you remove one to continue", () => {
    render(<OnboardingFlow initialStep="p_addkid" />);

    // Add two kids.
    fireEvent.changeText(screen.getByLabelText("Name"), "Mia");
    fireEvent.press(screen.getByText("+ Add another kid"));
    fireEvent.changeText(screen.getByLabelText("Name"), "Eli");
    fireEvent.press(screen.getByText("Continue")); // commits Eli → split

    fireEvent.press(screen.getByText("Use the 40/40/20 split")); // → chores
    fireEvent.press(screen.getByLabelText("Make the bed"));
    fireEvent.press(screen.getByText("Add 1 chore")); // → causes
    fireEvent.press(screen.getByLabelText("Animals"));
    fireEvent.press(screen.getByText("Continue")); // → premium gate (2 kids)

    expect(screen.getByText("Add the whole family with Premium.")).toBeOnTheScreen();
    // Can't proceed with two kids on free.
    expect(screen.getByText("Remove a kid to continue")).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText("Remove Eli"));
    // Down to one kid → continue to the account step.
    fireEvent.press(screen.getByText("Continue"));
    expect(screen.getByText("Save your family.")).toBeOnTheScreen();
  });
});
