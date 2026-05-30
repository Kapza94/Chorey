import { createParentAuthActions } from "@/features/auth/parent-auth-actions";

function createAuthClient() {
  return {
    auth: {
      signInWithOAuth: jest.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithOtp: jest.fn().mockResolvedValue({ data: {}, error: null }),
      verifyOtp: jest.fn().mockResolvedValue({ data: {}, error: null }),
    },
  };
}

describe("parent auth actions", () => {
  it("starts Google OAuth with the Chorey auth callback", async () => {
    const client = createAuthClient();
    const actions = createParentAuthActions(client, "chorey://auth/callback");

    await actions.signInWithGoogle();

    expect(client.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "chorey://auth/callback",
      },
    });
  });

  it("starts Apple OAuth with the Chorey auth callback", async () => {
    const client = createAuthClient();
    const actions = createParentAuthActions(client, "chorey://auth/callback");

    await actions.signInWithApple();

    expect(client.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "apple",
      options: {
        redirectTo: "chorey://auth/callback",
      },
    });
  });

  it("sends a magic link with user creation enabled for parent onboarding", async () => {
    const client = createAuthClient();
    const actions = createParentAuthActions(client, "chorey://auth/callback");

    await actions.sendMagicLink("parent@example.com");

    expect(client.auth.signInWithOtp).toHaveBeenCalledWith({
      email: "parent@example.com",
      options: {
        emailRedirectTo: "chorey://auth/callback",
        shouldCreateUser: true,
      },
    });
  });

  it("trims magic link email input", async () => {
    const client = createAuthClient();
    const actions = createParentAuthActions(client, "chorey://auth/callback");

    await actions.sendMagicLink("  parent@example.com  ");

    expect(client.auth.signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({ email: "parent@example.com" }),
    );
  });

  it("verifies an email OTP code", async () => {
    const client = createAuthClient();
    const actions = createParentAuthActions(client, "chorey://auth/callback");

    await actions.verifyEmailOtp(" parent@example.com ", " 231761 ");

    expect(client.auth.verifyOtp).toHaveBeenCalledWith({
      email: "parent@example.com",
      token: "231761",
      type: "email",
    });
  });
});
