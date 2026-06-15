import { useEffect } from "react";
import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Sentry from "@sentry/react-native";

import { getSentryDsn } from "@/lib/env";
import { isSupabaseConfigured } from "@/lib/supabase";
import { ConfigErrorScreen } from "@/features/system/config-error-screen";
import { AnalyticsProvider } from "@/features/analytics/analytics-provider";
import { useChoreyFonts } from "@/theme/use-chorey-fonts";
import { DevRoleSwitcher } from "@/features/dev/dev-role-switcher";

// Error reporting stays disabled until a DSN is configured (no-op like billing
// and push). Set EXPO_PUBLIC_SENTRY_DSN to turn it on.
const sentryDsn = getSentryDsn();
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    // Sample a fraction of transactions for performance monitoring; crash/error
    // reporting is unaffected by this rate.
    tracesSampleRate: 0.2,
  });
}

// Keep the splash visible until the Chorey type families are ready, so the
// first frame already renders in Bricolage / Plus Jakarta Sans (no font swap).
SplashScreen.preventAutoHideAsync().catch(() => {
  // no-op: hiding later is still safe if this rejects
});

function RootLayout() {
  const fontsReady = useChoreyFonts();

  useEffect(() => {
    // Hide the splash once fonts are ready — or immediately if the build is
    // misconfigured, so the readable error screen isn't stuck behind the splash.
    if (fontsReady || !isSupabaseConfigured) {
      SplashScreen.hideAsync().catch(() => {
        // no-op
      });
    }
  }, [fontsReady]);

  if (!isSupabaseConfigured) {
    return (
      <>
        <StatusBar style="dark" />
        <ConfigErrorScreen />
      </>
    );
  }

  if (!fontsReady) {
    return null;
  }

  return (
    <AnalyticsProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
      {__DEV__ ? <DevRoleSwitcher /> : null}
    </AnalyticsProvider>
  );
}

export default Sentry.wrap(RootLayout);
