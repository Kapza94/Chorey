import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { createDefaultParentAuthActions } from "@/features/auth/default-parent-auth-actions";
import { loadChildSession } from "@/features/children/default-child-session";
import { chooseSubscriptionPlan } from "@/features/entitlements/default-subscription-actions";
import { getPrimaryHouseholdId } from "@/features/household/default-household-actions";
import { OnboardingFlow, type OnboardingAuth } from "@/features/onboarding/onboarding-flow";
import { persistOnboardingForSignedInParent } from "@/features/onboarding/default-onboarding-persistence";
import { supabase } from "@/lib/supabase";
import { choreyTheme } from "@/theme/chorey-theme";
import { useChoreyTheme } from "@/theme/use-chorey-theme";

export default function IndexRoute() {
  const { scheme, palette } = useChoreyTheme();
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [launchError, setLaunchError] = useState(false);
  const [launchAttempt, setLaunchAttempt] = useState(0);
  const parentAuth = createDefaultParentAuthActions();

  useEffect(() => {
    let active = true;

    async function resolveSignedInParent() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!active) return;

        if (!session) {
          // No parent signed in — a kid may still own this device.
          const childSession = loadChildSession();

          if (childSession) {
            router.replace("/child/home");
            return;
          }

          setSessionChecked(true);
          return;
        }

        const householdId = await getPrimaryHouseholdId();
        if (!active) return;

        if (householdId) {
          router.replace({ pathname: "/parent/home", params: { householdId } });
        } else {
          router.replace("/parent/household/new");
        }
      } catch {
        if (active) {
          setLaunchError(true);
        }
      }
    }

    void resolveSignedInParent();

    return () => {
      active = false;
    };
  }, [launchAttempt, router]);

  if (launchError) {
    return (
      <View
        style={{
          alignItems: "center",
          backgroundColor: scheme.bgPage,
          flex: 1,
          gap: choreyTheme.spacing.md,
          justifyContent: "center",
          padding: choreyTheme.spacing.xl,
        }}
      >
        <Text
          style={{
            color: scheme.fg,
            fontFamily: choreyTheme.typography.family.display.bold,
            fontSize: 28,
            textAlign: "center",
          }}
        >
          Couldn&apos;t start Chorey
        </Text>
        <Text
          style={{
            color: scheme.fgFaint,
            fontFamily: choreyTheme.typography.family.body.regular,
            fontSize: 16,
            lineHeight: 24,
            textAlign: "center",
          }}
        >
          Check your connection, then try again.
        </Text>
        <Pressable
          accessibilityLabel="Retry launch"
          accessibilityRole="button"
          onPress={() => {
            setLaunchError(false);
            setSessionChecked(false);
            setLaunchAttempt((attempt) => attempt + 1);
          }}
          style={({ pressed }) => ({
            backgroundColor: pressed
              ? palette.accent[800]
              : palette.accent[600],
            borderRadius: choreyTheme.radii.pill,
            marginTop: choreyTheme.spacing.sm,
            paddingHorizontal: choreyTheme.spacing.xl,
            paddingVertical: 14,
          })}
        >
          <Text
            style={{
              color: palette.cream[4],
              fontFamily: choreyTheme.typography.family.body.bold,
              fontSize: 16,
            }}
          >
            Try again
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!sessionChecked) {
    return null;
  }

  // Email 6-digit OTP: sendMagicLink emails the code; verifyEmailOtp checks it.
  // Apple/Google are the one-tap primary options on the account step.
  const auth: OnboardingAuth = {
    sendEmailCode: (email) => parentAuth.sendMagicLink(email),
    verifyEmailCode: (email, code) => parentAuth.verifyEmailOtp(email, code),
    signInWithApple: () => parentAuth.signInWithApple(),
    signInWithGoogle: () => parentAuth.signInWithGoogle(),
  };

  return (
    <OnboardingFlow
      auth={auth}
      persist={persistOnboardingForSignedInParent}
      choosePlan={chooseSubscriptionPlan}
      onSignIn={() => router.push("/parent/sign-in")}
      onComplete={(result, persisted) => {
        if (result.role === "parent") {
          router.push({
            pathname: "/parent/home",
            params: { householdId: persisted?.householdId ?? "" },
          });
        } else {
          router.push({
            pathname: "/child/home",
            params: { accessCode: result.code, childName: result.kidName },
          });
        }
      }}
    />
  );
}
