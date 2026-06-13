import { createClient } from "@supabase/supabase-js";
import "expo-sqlite/localStorage/install";
import "react-native-url-polyfill/auto";

import { getChoreyEnv } from "@/lib/env";

const env = getChoreyEnv();

export const supabase = createClient(
  env.supabaseUrl,
  env.supabasePublishableKey,
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
