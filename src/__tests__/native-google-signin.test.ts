import { createNativeGoogleSignIn } from "@/features/auth/native-google-signin";

const CONFIG = {
  webClientId: "web-client-id",
  iosClientId: "ios-client-id",
};

function createClient() {
  return {
    auth: {
      signInWithIdToken: jest.fn().mockResolvedValue({ error: null }),
    },
  };
}

function createModule(signInResult: {
  type: string;
  data?: { idToken?: string | null } | null;
}) {
  return {
    GoogleSignin: {
      configure: jest.fn(),
      signIn: jest.fn().mockResolvedValue(signInResult),
      signOut: jest.fn().mockResolvedValue(undefined),
    },
  };
}

describe("native Google sign-in", () => {
  it("signs in with the native ID token and establishes a Supabase session", async () => {
    const client = createClient();
    const module = createModule({ type: "success", data: { idToken: "id-token-1" } });
    const signIn = createNativeGoogleSignIn(client, CONFIG, () => module);

    await expect(signIn()).resolves.toBe(true);

    expect(module.GoogleSignin.configure).toHaveBeenCalledWith({
      webClientId: "web-client-id",
      iosClientId: "ios-client-id",
    });
    expect(client.auth.signInWithIdToken).toHaveBeenCalledWith({
      provider: "google",
      token: "id-token-1",
    });
  });

  it("returns false when the user cancels the Google sheet", async () => {
    const client = createClient();
    const module = createModule({ type: "cancelled", data: null });
    const signIn = createNativeGoogleSignIn(client, CONFIG, () => module);

    await expect(signIn()).resolves.toBe(false);
    expect(client.auth.signInWithIdToken).not.toHaveBeenCalled();
  });

  // null tells the caller to fall back to the browser OAuth flow.
  it("returns null when config is missing", async () => {
    const client = createClient();
    const signIn = createNativeGoogleSignIn(client, null, () =>
      createModule({ type: "success", data: { idToken: "t" } }),
    );

    await expect(signIn()).resolves.toBeNull();
  });

  it("returns null when the native module isn't in this binary (Expo Go)", async () => {
    const client = createClient();
    const signIn = createNativeGoogleSignIn(client, CONFIG, () => null);

    await expect(signIn()).resolves.toBeNull();
  });

  it("surfaces Supabase errors and signs Google out to keep retries clean", async () => {
    const client = createClient();
    client.auth.signInWithIdToken.mockResolvedValue({
      error: new Error("audience mismatch"),
    });
    const module = createModule({ type: "success", data: { idToken: "t" } });
    const signIn = createNativeGoogleSignIn(client, CONFIG, () => module);

    await expect(signIn()).rejects.toThrow("audience mismatch");
    expect(module.GoogleSignin.signOut).toHaveBeenCalled();
  });
});
