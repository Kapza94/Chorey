import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { supabase } from "@/lib/supabase";
import { getPrimaryHouseholdId } from "@/features/household/default-household-actions";

/**
 * Dev-only floating switcher to hop between the parent app and the kid app on a
 * single device. Resolves the signed-in parent's household and the first kid's
 * access code from Supabase. Never rendered in production (guard at call site).
 */
export function DevRoleSwitcher() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const goParent = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const householdId = await getPrimaryHouseholdId();
      if (householdId) {
        router.replace({ pathname: "/parent/home", params: { householdId } });
      }
    } finally {
      setBusy(false);
    }
  };

  const goKid = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const householdId = await getPrimaryHouseholdId();
      if (!householdId) return;

      const result = await supabase
        .from("child_access_codes")
        .select("access_code, child:child_profiles(display_name)")
        .eq("household_id", householdId)
        .limit(1)
        .maybeSingle();

      const row = result.data as any;
      const accessCode = row?.access_code as string | undefined;
      const childName = (row?.child?.display_name as string | undefined) ?? "";

      if (accessCode) {
        router.replace({
          pathname: "/child/home",
          params: { accessCode, childName },
        });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      style={{
        position: "absolute",
        left: 12,
        bottom: 110,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 6,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: "rgba(20,16,12,0.82)",
        zIndex: 9999,
      }}
    >
      <Text style={{ color: "#9b8f82", fontSize: 9, fontWeight: "700", paddingHorizontal: 4 }}>
        DEV
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dev view as parent"
        onPress={goParent}
        style={{ paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: "#3a2f26" }}
      >
        <Text style={{ color: "#f4ede4", fontSize: 12, fontWeight: "700" }}>Parent</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dev view as kid"
        onPress={goKid}
        style={{ paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: "#3a2f26" }}
      >
        <Text style={{ color: "#f4ede4", fontSize: 12, fontWeight: "700" }}>Kid</Text>
      </Pressable>
    </View>
  );
}
