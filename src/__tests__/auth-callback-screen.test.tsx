import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { AuthCallbackScreen } from "@/features/auth/auth-callback-screen";

describe("AuthCallbackScreen", () => {
  it("exchanges the code and signs in", async () => {
    const exchangeCode = jest.fn().mockResolvedValue(undefined);
    const onSignedIn = jest.fn();

    render(
      <AuthCallbackScreen
        code="link-code-123"
        actions={{ exchangeCode }}
        onSignedIn={onSignedIn}
        onBackToSignIn={jest.fn()}
      />,
    );

    await waitFor(() => expect(onSignedIn).toHaveBeenCalledTimes(1));
    expect(exchangeCode).toHaveBeenCalledWith("link-code-123");
  });

  it("shows an error and a way back when the exchange fails", async () => {
    const exchangeCode = jest.fn().mockRejectedValue(new Error("expired"));
    const onSignedIn = jest.fn();
    const onBackToSignIn = jest.fn();

    render(
      <AuthCallbackScreen
        code="stale"
        actions={{ exchangeCode }}
        onSignedIn={onSignedIn}
        onBackToSignIn={onBackToSignIn}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText(/invalid or has expired/i)).toBeTruthy(),
    );
    expect(onSignedIn).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText("Back to sign in"));
    expect(onBackToSignIn).toHaveBeenCalledTimes(1);
  });

  it("shows an error without exchanging when no code is present", async () => {
    const exchangeCode = jest.fn();

    render(
      <AuthCallbackScreen
        actions={{ exchangeCode }}
        onSignedIn={jest.fn()}
        onBackToSignIn={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText(/invalid or has expired/i)).toBeTruthy(),
    );
    expect(exchangeCode).not.toHaveBeenCalled();
  });

  it("surfaces a provider error message without exchanging", async () => {
    const exchangeCode = jest.fn();

    render(
      <AuthCallbackScreen
        errorMessage="Email link is invalid or has expired"
        actions={{ exchangeCode }}
        onSignedIn={jest.fn()}
        onBackToSignIn={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByText("Email link is invalid or has expired"),
      ).toBeTruthy(),
    );
    expect(exchangeCode).not.toHaveBeenCalled();
  });
});
