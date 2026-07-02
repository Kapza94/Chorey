import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { supabase } from "@/lib/supabase";

/**
 * Landing route for the shared family link (https://chorey.co/join?code=FAM-…
 * via Universal Links, or chorey://join?code=…). Signed-in parents redeem the
 * code straight away; everyone else lands in onboarding's join mode with the
 * code already filled in.
 */
export default function JoinRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string }>();
  const code = Array.isArray(params.code) ? params.code[0] : params.code;

  useEffect(() => {
    let active = true;

    async function route() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) {
        return;
      }

      if (session && code) {
        router.replace({ pathname: "/parent/invite", params: { token: code } });
      } else {
        router.replace({ pathname: "/", params: code ? { joinCode: code } : {} });
      }
    }

    void route();

    return () => {
      active = false;
    };
  }, [code, router]);

  return null;
}
