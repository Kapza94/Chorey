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
    getSession(): Promise<{
      data: { session: object | null };
    }>;
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
  // Injectable so tests don't sleep for real. 3s covers the deep-link route's
  // in-flight exchange without leaving a genuine cancel feeling stuck.
  sessionWait: { pollMs: number; timeoutMs: number } = {
    pollMs: 300,
    timeoutMs: 3000,
  },
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

    // iOS can resolve "dismiss" even when the chorey:// redirect actually
    // fired — with a silent Google re-auth (prompt=none) the sheet tears down
    // before the success plumbing completes (expo#6289). The /auth/callback
    // deep link may still be exchanging the code, so wait briefly for a
    // session before calling this a cancel.
    if (result.type !== "success" || !result.url) {
      return waitForSession();
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
      // On iOS the callback URL is delivered both here and to the /auth/callback
      // deep-link route; whichever exchanges second gets "invalid flow state"
      // because the code is single-use. If a session exists (or lands within
      // the wait window — the winning exchange may still be in flight),
      // sign-in succeeded.
      if (await waitForSession()) return true;
      throw exchangeError;
    }

    return true;
  }

  async function hasSession(): Promise<boolean> {
    const { data } = await client.auth.getSession();
    return Boolean(data?.session);
  }

  /** Poll for a session until the wait window closes. The competing exchange
   *  (deep-link route vs. in-flow handler) finishes on its own schedule — a
   *  single instantaneous check loses that race. */
  async function waitForSession(): Promise<boolean> {
    const deadline = Date.now() + sessionWait.timeoutMs;
    for (;;) {
      if (await hasSession()) return true;
      if (Date.now() >= deadline) return false;
      await new Promise((resolve) => setTimeout(resolve, sessionWait.pollMs));
    }
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
    /** Trade the `code` from an email magic-link or OAuth callback for a
     *  session. Used by the `/auth/callback` deep-link route. The OAuth browser
     *  flow may have already exchanged this same code (iOS delivers the callback
     *  URL to both handlers), so an existing session counts as success — a
     *  second exchange of a single-use code would fail and wrongly show
     *  "sign in didn't work" over a completed login. */
    async exchangeCode(code: string) {
      if (await hasSession()) return;

      const { error } = await client.auth.exchangeCodeForSession(code);

      if (error) {
        // Lost the race: the other handler exchanged (or is still exchanging)
        // the code. Wait for its session before declaring failure.
        if (await waitForSession()) return;
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
