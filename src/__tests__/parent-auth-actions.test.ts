import { createParentAuthActions } from "@/features/auth/parent-auth-actions";

function createAuthClient() {
  return {
    auth: {
      signInWithOAuth: jest.fn().mockResolvedValue({
        data: { url: "https://accounts.google.com/o/oauth2/v2/auth?x=1" },
        error: null,
      }),
      exchangeCodeForSession: jest.fn().mockResolvedValue({ error: null }),
      signInWithOtp: jest.fn().mockResolvedValue({ data: {}, error: null }),
      verifyOtp: jest.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  };
}

/** Fake system browser that lands on the callback with an auth code. */
function browserReturning(url: string) {
  return jest.fn().mockResolvedValue({ type: "success", url });
}

const REDIRECT = "chorey://auth/callback";

describe("parent auth actions", () => {
  it("opens the system browser to finish Google OAuth, then exchanges the code", async () => {
    const client = createAuthClient();
    const openAuthSession = browserReturning(`${REDIRECT}?code=abc123`);
    const actions = createParentAuthActions(client, REDIRECT, openAuthSession);

    const signedIn = await actions.signInWithGoogle();

    expect(client.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: REDIRECT, skipBrowserRedirect: true },
    });
    expect(openAuthSession).toHaveBeenCalledWith(
      "https://accounts.google.com/o/oauth2/v2/auth?x=1",
      REDIRECT,
    );
    expect(client.auth.exchangeCodeForSession).toHaveBeenCalledWith("abc123");
    expect(signedIn).toBe(true);
  });

  it("opens the system browser to finish Apple OAuth", async () => {
    const client = createAuthClient();
    const openAuthSession = browserReturning(`${REDIRECT}?code=apple789`);
    const actions = createParentAuthActions(client, REDIRECT, openAuthSession);

    await actions.signInWithApple();

    expect(client.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "apple",
      options: { redirectTo: REDIRECT, skipBrowserRedirect: true },
    });
    expect(client.auth.exchangeCodeForSession).toHaveBeenCalledWith("apple789");
  });

  it("does not sign in if the user closes the browser before finishing", async () => {
    const client = createAuthClient();
    const openAuthSession = jest.fn().mockResolvedValue({ type: "cancel" });
    const actions = createParentAuthActions(client, REDIRECT, openAuthSession);

    const signedIn = await actions.signInWithGoogle();

    expect(client.auth.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(signedIn).toBe(false);
  });

  it("surfaces an error the provider returned on the callback", async () => {
    const client = createAuthClient();
    const openAuthSession = browserReturning(
      `${REDIRECT}?error=access_denied&error_description=User%20said%20no`,
    );
    const actions = createParentAuthActions(client, REDIRECT, openAuthSession);

    await expect(actions.signInWithApple()).rejects.toThrow("User said no");
    expect(client.auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("sends a magic link with user creation enabled for parent onboarding", async () => {
    const client = createAuthClient();
    const actions = createParentAuthActions(client, REDIRECT, browserReturning(""));

    await actions.sendMagicLink("parent@example.com");

    expect(client.auth.signInWithOtp).toHaveBeenCalledWith({
      email: "parent@example.com",
      options: {
        emailRedirectTo: REDIRECT,
        shouldCreateUser: true,
      },
    });
  });

  it("trims magic link email input", async () => {
    const client = createAuthClient();
    const actions = createParentAuthActions(client, REDIRECT, browserReturning(""));

    await actions.sendMagicLink("  parent@example.com  ");

    expect(client.auth.signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({ email: "parent@example.com" }),
    );
  });

  it("verifies an email OTP code", async () => {
    const client = createAuthClient();
    const actions = createParentAuthActions(client, REDIRECT, browserReturning(""));

    await actions.verifyEmailOtp(" parent@example.com ", " 231761 ");

    expect(client.auth.verifyOtp).toHaveBeenCalledWith({
      email: "parent@example.com",
      token: "231761",
      type: "email",
    });
  });

  it("signs the parent out", async () => {
    const client = createAuthClient();
    const actions = createParentAuthActions(client, REDIRECT, browserReturning(""));

    await actions.signOut();

    expect(client.auth.signOut).toHaveBeenCalledTimes(1);
  });
});
