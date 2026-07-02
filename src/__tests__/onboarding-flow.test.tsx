import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { Share } from "react-native";

import { OnboardingFlow } from "@/features/onboarding/onboarding-flow";

// The signature pad draws via PanResponder, which isn't worth simulating here —
// stub it with a button that reports "signed" so the pledge step can advance.
jest.mock("@/features/onboarding/signature-pad", () => ({
  SignaturePad: ({ onChange }: { onChange?: (hasInk: boolean) => void }) => {
    const React = require("react");
    const { Pressable, Text } = require("react-native");
    return React.createElement(
      Pressable,
      { accessibilityLabel: "Sign", onPress: () => onChange?.(true) },
      React.createElement(Text, null, "Sign"),
    );
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe("OnboardingFlow", () => {
  it("opens on the auth screen and enters onboarding after sign-in", async () => {
    const auth = {
      sendEmailCode: jest.fn().mockResolvedValue(undefined),
      verifyEmailCode: jest.fn().mockResolvedValue(undefined),
    };
    render(
      <OnboardingFlow
        auth={auth}
        resolveSignedInHousehold={jest.fn().mockResolvedValue(null)}
      />,
    );

    // Auth is the first screen — no "Get started" / "I already have an account".
    expect(screen.getByText("chorey")).toBeOnTheScreen();
    expect(screen.queryByText("Get started")).toBeNull();
    expect(screen.queryByText("I already have an account")).toBeNull();

    fireEvent.press(screen.getByText("Continue with email"));
    fireEvent.changeText(
      await screen.findByLabelText("Email"),
      "alex@example.com",
    );
    fireEvent.press(screen.getByText("Email me a code"));
    fireEvent.changeText(
      await screen.findByLabelText("Verification code"),
      "ABCD1234",
    );
    fireEvent.press(screen.getByText("Continue"));

    expect(
      await screen.findByText("Every dollar splits three ways."),
    ).toBeOnTheScreen();
  });

  it("routes a kid from the auth screen to the join-code step", () => {
    render(<OnboardingFlow />);

    fireEvent.press(screen.getByText("I'm a kid — enter a code"));

    expect(screen.getByText("Use a sample code")).toBeOnTheScreen();
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
    const choosePlan = jest.fn().mockResolvedValue(undefined);
    const shareSpy = jest
      .spyOn(Share, "share")
      .mockResolvedValue({ action: Share.sharedAction });
    render(
      <OnboardingFlow
        initialStep="p_family"
        onComplete={onComplete}
        auth={auth}
        persist={persist}
        choosePlan={choosePlan}
      />,
    );

    // Family + country
    fireEvent.press(screen.getByLabelText("Dad"));
    fireEvent.changeText(screen.getByLabelText("Your name"), "Alex");
    fireEvent.changeText(screen.getByLabelText("Family name"), "Rivera");
    fireEvent.press(screen.getByLabelText("Choose your country"));
    // The picker spans every country, so filter down before tapping.
    fireEvent.changeText(screen.getByLabelText("Search countries"), "Serbia");
    fireEvent.press(screen.getByLabelText("Serbia"));
    // the currency field defaults to the country's currency, shown as its code
    expect(screen.getByText("RSD")).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Continue"));

    // Add a kid — the bottom Continue commits the filled-in kid and proceeds.
    // Both name and age are required before it can be committed.
    fireEvent.changeText(screen.getByLabelText("Name"), "Mia");
    fireEvent.changeText(screen.getByLabelText("Age"), "9");
    fireEvent.press(screen.getByText("Continue"));

    // Budget & the fixed 40/40/20 split
    expect(screen.getByText("Budget & split.")).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Continue"));

    // First chores
    fireEvent.press(screen.getByLabelText("Make the bed"));
    fireEvent.press(screen.getByText("Add 1 chore"));

    // Causes — "What Matters Most"; finishing it persists the family.
    expect(screen.getByText("What does your family care about?")).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText("Animals"));
    fireEvent.press(screen.getByText("Continue"));

    // The family-promise screen: sign it, then continue to the trial choice.
    expect(await screen.findByText("Family promise.")).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText("Sign"));
    fireEvent.press(screen.getByText("We promise"));

    // Plan choice before the trial — monthly or yearly, no prices invented.
    expect(await screen.findByText("Try Chorey Family.")).toBeOnTheScreen();
    // The paywall recaps what this family already set up during onboarding.
    expect(screen.getByText("1 chore ready for Mia")).toBeOnTheScreen();
    expect(screen.getByText(/Giving pointed at Animals/)).toBeOnTheScreen();
    expect(screen.getByText(/Free until/)).toBeOnTheScreen();
    expect(screen.queryByText(/\$\d/)).toBeNull();
    // Apple 3.1.2: the purchase screen must carry functional EULA + Privacy links.
    expect(screen.getByLabelText("Terms of Service")).toBeOnTheScreen();
    expect(screen.getByLabelText("Privacy Policy")).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText("Choose monthly billing"));
    fireEvent.press(screen.getByText("Start my free trial"));
    await waitFor(() => {
      expect(choosePlan).toHaveBeenCalledWith("h1", "monthly");
    });

    // Persisted → the success screen appears
    expect(await screen.findByText("You're all set.")).toBeOnTheScreen();
    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist.mock.calls[0][0]).toMatchObject({
      role: "parent",
      parentName: "Alex",
      parentLabel: "Dad",
      kids: [expect.objectContaining({ name: "Mia" })],
    });

    // The success screen shows the REAL generated access code from persistence,
    // not a name-derived placeholder.
    expect(screen.getByText("482913")).toBeOnTheScreen();
    expect(screen.queryByText("CHRIVE")).not.toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText("Share child join code"));
    expect(shareSpy).toHaveBeenCalledWith({
      message:
        'Mia\'s Chorey join code: 482913\n\nOpen Chorey, tap "Join as a child", and enter this code.',
    });

    fireEvent.press(screen.getByText("Go to dashboard"));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0];
    expect(result).toMatchObject({
      role: "parent",
      parentName: "Alex",
      parentLabel: "Dad",
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

    // No standalone "Add child" affordance; the bottom button is just Continue.
    expect(screen.queryByLabelText("Add child")).toBeNull();

    fireEvent.changeText(screen.getByLabelText("Name"), "Mia");
    fireEvent.changeText(screen.getByLabelText("Age"), "9");
    // "Add another kid" appears once name and age are both filled in
    fireEvent.press(screen.getByText("+ Add another child"));

    // Mia is committed (shows in the list) and the form resets for the next kid
    expect(screen.getByText("Add another child.")).toBeOnTheScreen();
    expect(screen.getByText("Mia")).toBeOnTheScreen();
  });

  it("blocks Continue until the child's age is filled in", () => {
    render(<OnboardingFlow initialStep="p_addkid" />);

    // Name alone is not enough — age is required.
    fireEvent.changeText(screen.getByLabelText("Name"), "Mia");
    expect(screen.getByText("Enter an age from 1 to 18.")).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Continue"));
    expect(screen.queryByText("Budget & split.")).toBeNull();

    // Filling a valid age unblocks it.
    fireEvent.changeText(screen.getByLabelText("Age"), "9");
    expect(screen.queryByText("Enter an age from 1 to 18.")).toBeNull();
    fireEvent.press(screen.getByText("Continue"));
    expect(screen.getByText("Budget & split.")).toBeOnTheScreen();
  });

  it("does not continue with an age-only second kid draft", () => {
    render(<OnboardingFlow initialStep="p_addkid" />);

    fireEvent.changeText(screen.getByLabelText("Name"), "Mia");
    fireEvent.changeText(screen.getByLabelText("Age"), "9");
    fireEvent.press(screen.getByText("+ Add another child"));
    fireEvent.changeText(screen.getByLabelText("Age"), "8");
    fireEvent.press(screen.getByText("Continue"));

    expect(screen.getByText("Add another child.")).toBeOnTheScreen();
    expect(screen.getByText("Enter a name for this child.")).toBeOnTheScreen();
    expect(screen.queryByText("Budget & split.")).toBeNull();
  });

  it("defaults to 40/40/20 but lets parents nudge it, with a Giving floor", () => {
    render(<OnboardingFlow initialStep="p_split" />);

    // 40 / 40 / 20 is the recommended default.
    expect(screen.getAllByText("40%")).toHaveLength(2);
    expect(screen.getByText("20%")).toBeOnTheScreen();

    // Spend is adjustable; Savings absorbs the change.
    fireEvent.press(screen.getByLabelText("Increase Spend"));
    expect(screen.getByText("45%")).toBeOnTheScreen(); // spend 40 → 45

    // Giving can be lowered to the 10% floor, then no further.
    fireEvent.press(screen.getByLabelText("Decrease Give")); // 20 → 15
    fireEvent.press(screen.getByLabelText("Decrease Give")); // 15 → 10
    expect(screen.getByText("10%")).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText("Decrease Give")); // floored at 10
    expect(screen.getByText("10%")).toBeOnTheScreen();
    expect(screen.queryByText("5%")).toBeNull();
  });

  it("keeps a typed budget amount when the parent taps Continue", async () => {
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
        initialStep="p_split"
        onComplete={onComplete}
        auth={auth}
        persist={persist}
      />,
    );

    fireEvent(screen.getByLabelText("Budget amount"), "focus");
    fireEvent.changeText(screen.getByLabelText("Budget amount"), "500");
    fireEvent.press(screen.getByText("Continue"));

    fireEvent.press(screen.getByLabelText("Make the bed"));
    fireEvent.press(screen.getByText("Add 1 chore"));
    fireEvent.press(screen.getByLabelText("Animals"));
    fireEvent.press(screen.getByText("Continue"));
    fireEvent.press(await screen.findByLabelText("Sign"));
    fireEvent.press(screen.getByText("We promise"));
    fireEvent.press(await screen.findByLabelText("Choose monthly billing"));
    fireEvent.press(screen.getByText("Start my free trial"));
    fireEvent.press(await screen.findByText("Go to dashboard"));

    expect(onComplete.mock.calls[0][0]).toMatchObject({
      role: "parent",
      budgetCents: 50000,
    });
  });

  it("sends existing accounts to their household instead of overwriting onboarding data", async () => {
    const persist = jest.fn();
    const auth = {
      sendEmailCode: jest.fn().mockResolvedValue(undefined),
      verifyEmailCode: jest.fn().mockResolvedValue(undefined),
    };
    const resolveSignedInHousehold = jest.fn().mockResolvedValue("household-1");
    const onExistingAccount = jest.fn();

    render(
      <OnboardingFlow
        auth={auth}
        persist={persist}
        resolveSignedInHousehold={resolveSignedInHousehold}
        onExistingAccount={onExistingAccount}
      />,
    );

    fireEvent.press(screen.getByText("Continue with email"));
    fireEvent.changeText(
      await screen.findByLabelText("Email"),
      "alex@example.com",
    );
    fireEvent.press(screen.getByText("Email me a code"));
    fireEvent.changeText(
      await screen.findByLabelText("Verification code"),
      "ABCD1234",
    );
    fireEvent.press(screen.getByText("Continue"));

    await waitFor(() => {
      expect(onExistingAccount).toHaveBeenCalledWith("household-1");
    });
    expect(resolveSignedInHousehold).toHaveBeenCalledTimes(1);
    expect(persist).not.toHaveBeenCalled();
  });

  // The co-parent path: "I'm joining my family" → sign in → enter the family
  // code → land in the partner's household. Never reaches family setup, so a
  // second household (and a second subscription) is never created.
  it("joins the partner's household via a family code after sign-in", async () => {
    const persist = jest.fn();
    const auth = {
      sendEmailCode: jest.fn().mockResolvedValue(undefined),
      verifyEmailCode: jest.fn().mockResolvedValue(undefined),
    };
    const resolveSignedInHousehold = jest.fn().mockResolvedValue(null);
    const onExistingAccount = jest.fn();
    const acceptInvite = jest
      .fn()
      .mockResolvedValue({ householdId: "household-9" });

    render(
      <OnboardingFlow
        auth={auth}
        persist={persist}
        resolveSignedInHousehold={resolveSignedInHousehold}
        onExistingAccount={onExistingAccount}
        acceptInvite={acceptInvite}
      />,
    );

    fireEvent.press(screen.getByText("I'm joining my family — I have a code"));
    fireEvent.press(screen.getByText("Continue with email"));
    fireEvent.changeText(
      await screen.findByLabelText("Email"),
      "wife@example.com",
    );
    fireEvent.press(screen.getByText("Email me a code"));
    fireEvent.changeText(
      await screen.findByLabelText("Verification code"),
      "ABCD1234",
    );
    fireEvent.press(screen.getByText("Continue"));

    // Signed in with no household + join intent → the family-code step.
    fireEvent.changeText(
      await screen.findByLabelText("Family code"),
      "fam-ab12cd34",
    );
    fireEvent.press(screen.getByText("Join family"));

    await waitFor(() => {
      expect(onExistingAccount).toHaveBeenCalledWith("household-9");
    });
    expect(acceptInvite).toHaveBeenCalledWith("fam-ab12cd34");
    expect(persist).not.toHaveBeenCalled();
  });

  it("persists the family only once if you go back from the promise and continue again", async () => {
    const persist = jest.fn().mockResolvedValue({ householdId: "h1", kids: [] });
    render(<OnboardingFlow initialStep="p_causes" persist={persist} />);

    fireEvent.press(screen.getByLabelText("Animals"));
    fireEvent.press(screen.getByText("Continue"));
    expect(await screen.findByText("Family promise.")).toBeOnTheScreen();

    // Step back to the causes screen and continue a second time.
    fireEvent.press(screen.getByLabelText("Back"));
    expect(
      await screen.findByText("What does your family care about?"),
    ).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Continue"));
    expect(await screen.findByText("Family promise.")).toBeOnTheScreen();

    // The household must not be created twice.
    expect(persist).toHaveBeenCalledTimes(1);
  });

  // The parent already named the child — a resolved code greets them by that
  // name and never shows a name field. Kids type only the part after CHOREY-.
  it("greets the kid with the parent-given name from the join code", async () => {
    const onComplete = jest.fn();
    const validateKidCode = jest
      .fn()
      .mockResolvedValue({ status: "ok", childName: "Mia" });
    render(
      <OnboardingFlow
        initialStep="k_code"
        onComplete={onComplete}
        validateKidCode={validateKidCode}
      />,
    );

    // The field holds only the payload; CHOREY- is a fixed prefix.
    fireEvent.changeText(screen.getByLabelText("Join code"), "ab12cd34");
    fireEvent.press(screen.getByText("Join family"));

    // The full code is validated, the name comes back from the database.
    await waitFor(() => {
      expect(validateKidCode).toHaveBeenCalledWith("CHOREY-AB12CD34");
    });
    expect(await screen.findByText("Hey, Mia!")).toBeOnTheScreen();
    expect(screen.queryByLabelText("Your name")).toBeNull();

    fireEvent.press(screen.getByText("That's me"));
    fireEvent.press(screen.getByText("Start earning"));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "kid",
        code: "CHOREY-AB12CD34",
        kidName: "Mia",
      }),
    );
  });

  it("gates the kid branch on the join code and reports it", () => {
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
      expect.objectContaining({
        role: "kid",
        code: "CHOREY-DEMO0001",
        kidName: "Mia",
      }),
    );
  });

  it("offers four starter chores plus a name-only custom field", () => {
    render(<OnboardingFlow initialStep="p_chores" />);

    // Four starter chores are shown up front — no suggest button, no amounts.
    expect(screen.getByLabelText("Make the bed")).toBeOnTheScreen();
    expect(screen.getByLabelText("Take out the trash")).toBeOnTheScreen();
    expect(screen.queryByLabelText("Suggest a chore")).toBeNull();
    expect(screen.queryByLabelText("Chore reward")).toBeNull();

    // The write-your-own field takes a name only.
    fireEvent.changeText(
      screen.getByLabelText("Chore name"),
      "Vacuum the hall",
    );
    fireEvent.press(screen.getByLabelText("Add chore"));
    expect(screen.getByText("Vacuum the hall")).toBeOnTheScreen();
    expect(screen.getByText("Add 1 chore")).toBeOnTheScreen();
  });

  it("lets a family add several kids with no gate before the paywall", async () => {
    render(<OnboardingFlow initialStep="p_addkid" />);

    // Add two kids — Chorey Family covers every kid in the household.
    fireEvent.changeText(screen.getByLabelText("Name"), "Mia");
    fireEvent.changeText(screen.getByLabelText("Age"), "9");
    fireEvent.press(screen.getByText("+ Add another child"));
    fireEvent.changeText(screen.getByLabelText("Name"), "Eli");
    fireEvent.changeText(screen.getByLabelText("Age"), "7");
    fireEvent.press(screen.getByText("Continue")); // commits Eli → split

    fireEvent.press(screen.getByText("Continue")); // split explainer → chores
    fireEvent.press(screen.getByLabelText("Make the bed"));
    fireEvent.press(screen.getByText("Add 1 chore")); // → causes
    fireEvent.press(screen.getByLabelText("Animals"));
    fireEvent.press(screen.getByText("Continue")); // persists, then the promise

    expect(await screen.findByText("Family promise.")).toBeOnTheScreen();
    expect(screen.queryByText(/Premium/)).toBeNull();
  });
});
