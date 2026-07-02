import * as WebBrowser from "expo-web-browser";

import { createParentAuthActions } from "@/features/auth/parent-auth-actions";
import { createNativeGoogleSignIn } from "@/features/auth/native-google-signin";
import { getGoogleAuthConfig } from "@/lib/env";
import { supabase } from "@/lib/supabase";

// Dismisses any lingering auth session when the app regains focus.
WebBrowser.maybeCompleteAuthSession();

// The OAuth redirect. Must exactly match a Redirect URL allowlisted in
// Supabase (Authentication → URL Configuration). We use the app's custom
// scheme rather than expo-auth-session's makeRedirectUri because in Expo Go
// that resolves to a localhost/exp URL the OAuth round-trip can't return to.
// `openAuthSessionAsync` intercepts this `chorey://` callback at the OS level,
// so it works in Expo Go and in standalone/dev builds alike.
const AUTH_REDIRECT = "chorey://auth/callback";

export function createDefaultParentAuthActions() {
  const actions = createParentAuthActions(
    supabase,
    AUTH_REDIRECT,
    (authUrl, returnUrl) => WebBrowser.openAuthSessionAsync(authUrl, returnUrl),
  );
  const nativeGoogle = createNativeGoogleSignIn(supabase, getGoogleAuthConfig());

  return {
    ...actions,
    // Google goes native-first: the browser flow kept losing Google's instant
    // (prompt=none) redirect on iOS (ASWebAuthenticationSession races). Native
    // returns null when unavailable (Expo Go / missing config) → browser flow.
    async signInWithGoogle() {
      const native = await nativeGoogle();
      if (native !== null) {
        return native;
      }
      return actions.signInWithGoogle();
    },
  };
}
