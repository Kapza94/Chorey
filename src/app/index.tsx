import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { createDefaultParentAuthActions } from "@/features/auth/default-parent-auth-actions";
import { loadChildSession } from "@/features/children/default-child-session";
import { resolveChildAccessCode } from "@/features/children/default-child-access-actions";
import { chooseSubscriptionPlan } from "@/features/entitlements/default-subscription-actions";
import { createRevenueCatGateway } from "@/features/entitlements/default-purchase-actions";
import type { PlanOffer } from "@/features/entitlements/purchases";
import { getPrimaryHouseholdId } from "@/features/household/default-household-actions";
import { acceptParentInvite } from "@/features/household/default-household-invite-actions";
import { OnboardingFlow, type OnboardingAuth } from "@/features/onboarding/onboarding-flow";
import { persistOnboardingForSignedInParent } from "@/features/onboarding/default-onboarding-persistence";
import { supabase } from "@/lib/supabase";
import { choreyTheme } from "@/theme/chorey-theme";
import { useChoreyTheme } from "@/theme/use-chorey-theme";

export default function IndexRoute() {
  const { scheme, palette } = useChoreyTheme();
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [resumeOnboarding, setResumeOnboarding] = useState(false);
  const [launchError, setLaunchError] = useState(false);
  const [launchAttempt, setLaunchAttempt] = useState(0);
  const [planOffers, setPlanOffers] = useState<PlanOffer[]>([]);
  const parentAuth = createDefaultParentAuthActions();
  const billing = useMemo(() => createRevenueCatGateway(), []);

  // Load localized store prices for the onboarding paywall. Best-effort: a null
  // offering (RevenueCat not configured / offline) just leaves prices hidden.
  useEffect(() => {
    let active = true;
    void billing
      .loadOffers()
      .then((offers) => {
        if (active) setPlanOffers(offers);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [billing]);

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
          // Onboarding already done (a household exists) — straight to home,
          // which gates the app on the subscription. They never re-onboard.
          router.replace({ pathname: "/parent/home", params: { householdId } });
        } else {
          // Signed in but never finished setup — resume onboarding past the
          // auth screen.
          setResumeOnboarding(true);
          setSessionChecked(true);
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
      initialStep={resumeOnboarding ? "idea" : "auth"}
      auth={auth}
      persist={persistOnboardingForSignedInParent}
      choosePlan={chooseSubscriptionPlan}
      planOffers={planOffers}
      resolveSignedInHousehold={getPrimaryHouseholdId}
      onExistingAccount={(householdId) => {
        router.replace({ pathname: "/parent/home", params: { householdId } });
      }}
      acceptInvite={acceptParentInvite}
      validateKidCode={async (code) => {
        try {
          // The parent already named this child — the join code carries the
          // name into the kid's session so they're greeted, never asked.
          const resolved = await resolveChildAccessCode(code);
          return { status: "ok", childName: resolved.childName };
        } catch (e) {
          // "not found" is a wrong code; anything else (offline, RPC down) is
          // unknown, so we let the kid through and resolve it on the home screen.
          const message = e instanceof Error ? e.message : "";
          return { status: /not found/i.test(message) ? "bad" : "unknown" };
        }
      }}
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
