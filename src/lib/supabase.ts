import { createClient } from "@supabase/supabase-js";
import "expo-sqlite/localStorage/install";
import "react-native-url-polyfill/auto";

import { getChoreyEnvOrNull } from "@/lib/env";

const env = getChoreyEnvOrNull();

/**
 * Whether the Supabase config was present at startup. The root layout renders a
 * readable "not configured" screen when this is false, instead of letting the
 * app hard-crash at import time. The placeholder values below only exist so
 * `createClient` doesn't throw before that screen can render.
 */
export const isSupabaseConfigured = env !== null;

export const supabase = createClient(
  env?.supabaseUrl ?? "https://unconfigured.supabase.co",
  env?.supabasePublishableKey ?? "unconfigured",
  {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      // PKCE returns `?code=` to exchange for a session (what our OAuth handler
      // expects). The default implicit flow returns tokens in the URL fragment
      // instead, which the callback can't read — and is less secure on mobile.
      flowType: "pkce",
    },
  },
);
