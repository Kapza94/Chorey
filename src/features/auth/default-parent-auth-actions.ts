import { makeRedirectUri } from "expo-auth-session";

import { createParentAuthActions } from "@/features/auth/parent-auth-actions";
import { supabase } from "@/lib/supabase";

export function createDefaultParentAuthActions() {
  return createParentAuthActions(
    supabase,
    makeRedirectUri({
      scheme: "chorey",
      path: "auth/callback",
    }),
  );
}

