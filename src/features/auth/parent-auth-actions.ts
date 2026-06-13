type OAuthProvider = "apple" | "google";

/** Result of opening the system auth browser (expo-web-browser shape). */
type AuthSessionResult = { type: string; url?: string };

/** Opens the provider login in a system auth session and resolves with the
 *  redirect it lands on. In practice this is `WebBrowser.openAuthSessionAsync`,
 *  which catches the `chorey://` callback at the OS level — so it works in
 *  Expo Go without the scheme being registered. Injected for testability. */
type OpenAuthSession = (
  authUrl: string,
  returnUrl: string,
) => Promise<AuthSessionResult>;

type ParentAuthClient = {
  auth: {
    signInWithOAuth(args: {
      provider: OAuthProvider;
      options: {
        redirectTo: string;
        skipBrowserRedirect: boolean;
      };
    }): Promise<{ data: { url?: string | null } | null; error: Error | null }>;
    exchangeCodeForSession(
      code: string,
    ): Promise<{ error: Error | null }>;
    signInWithOtp(args: {
      email: string;
      options: {
        emailRedirectTo: string;
        shouldCreateUser: boolean;
      };
    }): Promise<{ error: Error | null }>;
    verifyOtp(args: {
      email: string;
      token: string;
      type: "email";
    }): Promise<{ error: Error | null }>;
    signOut(): Promise<{ error: Error | null }>;
  };
};

/** Pull `code` (or a surfaced error) out of the callback URL. URLSearchParams
 *  is polyfilled (react-native-url-polyfill), and parsing the query off the
 *  raw string sidesteps `new URL()` quirks with custom schemes. */
function parseCallback(url: string): { code?: string; error?: string } {
  const query = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
  const params = new URLSearchParams(query);
  const error = params.get("error_description") ?? params.get("error");
  if (error) {
    return { error };
  }
  const code = params.get("code");
  return code ? { code } : {};
}

export function createParentAuthActions(
  client: ParentAuthClient,
  redirectTo: string,
  openAuthSession: OpenAuthSession,
) {
  /** Shared Apple/Google flow: get the provider URL, open the system browser,
   *  then trade the returned code for a session. Resolves `true` only when a
   *  session was actually established — `false` if the user cancelled — so the
   *  caller never advances the UI on a non-sign-in. */
  async function signInWith(provider: OAuthProvider): Promise<boolean> {
    const { data, error } = await client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        // RN has no window to redirect — we open the URL ourselves.
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      throw error;
    }
    if (!data?.url) {
      throw new Error("Sign in could not start. Please try again.");
    }

    const result = await openAuthSession(data.url, redirectTo);

    // The user closed the browser before finishing — not an error, not a login.
    if (result.type !== "success" || !result.url) {
      return false;
    }

    const { code, error: callbackError } = parseCallback(result.url);
    if (callbackError) {
      throw new Error(callbackError);
    }
    if (!code) {
      throw new Error("Sign in didn't complete. Please try again.");
    }

    const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      throw exchangeError;
    }

    return true;
  }

  return {
    async signInWithApple() {
      return signInWith("apple");
    },
    async signInWithGoogle() {
      return signInWith("google");
    },
    async sendMagicLink(email: string) {
      const { error } = await client.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      });

      if (error) {
        throw error;
      }
    },
    async verifyEmailOtp(email: string, token: string) {
      const { error } = await client.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: "email",
      });

      if (error) {
        throw error;
      }
    },
    async signOut() {
      const { error } = await client.auth.signOut();

      if (error) {
        throw error;
      }
    },
  };
}
