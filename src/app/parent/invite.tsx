import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { acceptParentInvite } from "@/features/household/default-household-invite-actions";
import { useChoreyTheme } from "@/theme/use-chorey-theme";

export default function ParentInviteRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const { scheme, typography, palette, radius } = useChoreyTheme();
  const [status, setStatus] = useState<"loading" | "accepted" | "error">("loading");
  const [message, setMessage] = useState("Joining family...");
  const [householdId, setHouseholdId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function accept() {
      if (!token) {
        setStatus("error");
        setMessage("This invite link is missing its token.");
        return;
      }

      try {
        const accepted = await acceptParentInvite(token);
        if (!active) {
          return;
        }
        setHouseholdId(accepted.householdId);
        setStatus("accepted");
        setMessage("You joined this Chorey family.");
      } catch (error) {
        if (!active) {
          return;
        }
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Invite could not be accepted. Sign in as the invited parent, then open the link again.",
        );
      }
    }

    void accept();

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 24,
        backgroundColor: scheme.bgPage,
      }}
    >
      <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 26, textAlign: "center" }]}>
        {status === "accepted" ? "Family joined." : status === "error" ? "Invite needs attention." : "Joining..."}
      </Text>
      <Text style={[typography.text.bodySm, { color: scheme.fgMuted, textAlign: "center" }]}>
        {message}
      </Text>

      {status === "accepted" && householdId ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open family"
          onPress={() =>
            router.replace({
              pathname: "/parent/home",
              params: { householdId },
            })
          }
          style={({ pressed }) => ({
            marginTop: 8,
            borderRadius: radius.pill,
            backgroundColor: pressed ? palette.accent[800] : palette.accent[600],
            paddingHorizontal: 28,
            paddingVertical: 13,
          })}
        >
          <Text style={[typography.text.label, { color: palette.cream[4], fontSize: 15 }]}>
            Open family
          </Text>
        </Pressable>
      ) : status === "error" ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign in as parent"
          onPress={() => router.replace("/parent/sign-in")}
          style={({ pressed }) => ({
            marginTop: 8,
            borderRadius: radius.pill,
            backgroundColor: pressed ? scheme.bgSunken : scheme.bgRaised,
            borderColor: scheme.border,
            borderWidth: 1,
            paddingHorizontal: 28,
            paddingVertical: 13,
          })}
        >
          <Text style={[typography.text.label, { color: scheme.fg, fontSize: 15 }]}>
            Sign in as parent
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
