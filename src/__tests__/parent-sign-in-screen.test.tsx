import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { ParentSignInScreen } from "@/features/auth/parent-sign-in-screen";

describe("ParentSignInScreen", () => {
  function createActions() {
    return {
      signInWithApple: jest.fn(),
      signInWithGoogle: jest.fn(),
      sendMagicLink: jest.fn().mockResolvedValue(undefined),
      verifyEmailOtp: jest.fn().mockResolvedValue(undefined),
    };
  }

  it("offers Apple, Google, and magic link sign-in", () => {
    render(<ParentSignInScreen />);

    expect(screen.getByText("Continue with Apple")).toBeOnTheScreen();
    expect(screen.getByText("Continue with Google")).toBeOnTheScreen();
    expect(screen.getByLabelText("Apple logo")).toBeOnTheScreen();
    expect(screen.getByLabelText("Google logo")).toBeOnTheScreen();
    expect(screen.getByText("Send magic link")).toBeOnTheScreen();
  });

  it("keeps auth clearly parent-facing", () => {
    render(<ParentSignInScreen />);

    expect(screen.getByText("Parent sign in")).toBeOnTheScreen();
    expect(screen.getByText("Children use a parent-linked profile.")).toBeOnTheScreen();
  });

  it("calls the selected provider action", () => {
    const actions = createActions();

    render(<ParentSignInScreen actions={actions} />);

    fireEvent.press(screen.getByText("Continue with Apple"));
    fireEvent.press(screen.getByText("Continue with Google"));

    expect(actions.signInWithApple).toHaveBeenCalledTimes(1);
    expect(actions.signInWithGoogle).toHaveBeenCalledTimes(1);
  });

  it("sends the entered email for magic link sign-in", async () => {
    const actions = createActions();

    render(<ParentSignInScreen actions={actions} />);

    fireEvent.changeText(screen.getByLabelText("Email address"), "parent@example.com");
    fireEvent.press(screen.getByText("Send magic link"));

    await waitFor(() => {
      expect(actions.sendMagicLink).toHaveBeenCalledWith("parent@example.com");
    });
  });

  it("shows success after sending a magic link", async () => {
    const actions = createActions();

    render(<ParentSignInScreen actions={actions} />);

    fireEvent.changeText(screen.getByLabelText("Email address"), "parent@example.com");
    fireEvent.press(screen.getByText("Send magic link"));

    await waitFor(() => {
      expect(screen.getByText("Check your email for the Chorey sign-in link.")).toBeOnTheScreen();
      expect(screen.getByLabelText("Magic link code")).toBeOnTheScreen();
    });
  });

  it("shows a pending label while the magic link is sending", async () => {
    let resolveMagicLink: () => void = () => {};
    const actions = createActions();
    actions.sendMagicLink.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveMagicLink = resolve;
      }),
    );

    render(<ParentSignInScreen actions={actions} />);

    fireEvent.changeText(screen.getByLabelText("Email address"), "parent@example.com");
    fireEvent.press(screen.getByText("Send magic link"));

    expect(screen.getByText("Sending link")).toBeOnTheScreen();
    resolveMagicLink();

    await waitFor(() => {
      expect(screen.getByText("Check your email for the Chorey sign-in link.")).toBeOnTheScreen();
    });
  });

  it("shows an error when magic link sending fails", async () => {
    const actions = createActions();
    actions.sendMagicLink.mockRejectedValue(new Error("Email rate limit reached."));

    render(<ParentSignInScreen actions={actions} />);

    fireEvent.changeText(screen.getByLabelText("Email address"), "parent@example.com");
    fireEvent.press(screen.getByText("Send magic link"));

    await waitFor(() => {
      expect(screen.getByText("Email rate limit reached.")).toBeOnTheScreen();
    });
  });

  it("verifies the entered magic link code", async () => {
    const actions = createActions();
    const onSignedIn = jest.fn();

    render(<ParentSignInScreen actions={actions} onSignedIn={onSignedIn} />);

    fireEvent.changeText(screen.getByLabelText("Email address"), "parent@example.com");
    fireEvent.press(screen.getByText("Send magic link"));

    await waitFor(() => {
      expect(screen.getByLabelText("Magic link code")).toBeOnTheScreen();
    });

    fireEvent.changeText(screen.getByLabelText("Magic link code"), "231761");
    fireEvent.press(screen.getByText("Verify code"));

    await waitFor(() => {
      expect(actions.verifyEmailOtp).toHaveBeenCalledWith(
        "parent@example.com",
        "231761",
      );
      expect(screen.getByText("Signed in.")).toBeOnTheScreen();
      expect(onSignedIn).toHaveBeenCalledTimes(1);
    });
  });

  it("shows an error when code verification fails", async () => {
    const actions = createActions();
    actions.verifyEmailOtp.mockRejectedValue(new Error("Invalid code."));

    render(<ParentSignInScreen actions={actions} />);

    fireEvent.changeText(screen.getByLabelText("Email address"), "parent@example.com");
    fireEvent.press(screen.getByText("Send magic link"));

    await waitFor(() => {
      expect(screen.getByLabelText("Magic link code")).toBeOnTheScreen();
    });

    fireEvent.changeText(screen.getByLabelText("Magic link code"), "000000");
    fireEvent.press(screen.getByText("Verify code"));

    await waitFor(() => {
      expect(screen.getByText("Invalid code.")).toBeOnTheScreen();
    });
  });
});
