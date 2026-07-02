import type { GoogleAuthConfig } from "@/lib/env";

/**
 * Native Google Sign-In (Google's iOS SDK → ID token → Supabase). No browser,
 * no redirect, no PKCE flow state — this replaces the ASWebAuthenticationSession
 * flow that kept losing Google's instant (prompt=none) redirect on iOS.
 *
 * Returns:
 *  - true   → signed in (Supabase session established)
 *  - false  → the user cancelled the Google sheet
 *  - null   → native sign-in unavailable (no config, or the native module
 *             isn't in this binary, e.g. Expo Go) — caller falls back to the
 *             browser flow.
 */

type IdTokenClient = {
  auth: {
    signInWithIdToken(args: {
      provider: "google";
      token: string;
    }): Promise<{ error: Error | null }>;
  };
};

/** Shape of the @react-native-google-signin module we rely on (v16). */
type GoogleSigninModule = {
  GoogleSignin: {
    configure(options: { webClientId: string; iosClientId?: string }): void;
    signIn(): Promise<{
      type: string;
      data?: { idToken?: string | null } | null;
    }>;
    signOut(): Promise<unknown>;
  };
};

export function createNativeGoogleSignIn(
  client: IdTokenClient,
  config: GoogleAuthConfig | null,
  // Injectable for tests; defaults to the real native module, loaded lazily so
  // binaries without it (Expo Go) fall back instead of crashing at import.
  loadModule: () => GoogleSigninModule | null = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require("@react-native-google-signin/google-signin");
    } catch {
      return null;
    }
  },
) {
  return async function signInWithGoogleNatively(): Promise<boolean | null> {
    if (!config) {
      return null;
    }

    const module = loadModule();
    if (!module?.GoogleSignin) {
      return null;
    }

    const { GoogleSignin } = module;
    GoogleSignin.configure({
      webClientId: config.webClientId,
      iosClientId: config.iosClientId,
    });

    const result = await GoogleSignin.signIn();
    if (result.type === "cancelled") {
      return false;
    }

    const idToken = result.data?.idToken;
    if (!idToken) {
      throw new Error("Google didn't return a sign-in token. Please try again.");
    }

    const { error } = await client.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });

    if (error) {
      // A half-signed-in Google state would make retries confusing.
      await GoogleSignin.signOut().catch(() => {});
      throw error;
    }

    return true;
  };
}
