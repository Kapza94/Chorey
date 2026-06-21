import { useEffect } from "react";
import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Sentry from "@sentry/react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { getSentryDsn } from "@/lib/env";
import { isSupabaseConfigured } from "@/lib/supabase";
import { ConfigErrorScreen } from "@/features/system/config-error-screen";
import { AnalyticsProvider } from "@/features/analytics/analytics-provider";
import { useChoreyFonts } from "@/theme/use-chorey-fonts";
import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { ThemePreferenceProvider } from "@/theme/theme-preference";
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
  const { isDark, scheme } = useChoreyTheme();
  // Status-bar glyphs flip with the resolved theme so they stay legible whether
  // the user picked light, dark, or "follow system".
  const statusBarStyle = isDark ? "light" : "dark";

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
        <StatusBar style={statusBarStyle} />
        <ConfigErrorScreen />
      </>
    );
  }

  if (!fontsReady) {
    return null;
  }

  return (
    <AnalyticsProvider>
      <StatusBar style={statusBarStyle} />
      {/* One top inset for the whole app — every screen leaned on the iOS-only
          ScrollView `contentInsetAdjustmentBehavior` before, which left content
          tucked under the status bar / Dynamic Island whenever it didn't kick
          in. The page-coloured band keeps the notch area on-theme. */}
      <SafeAreaView
        edges={["top"]}
        style={{ flex: 1, backgroundColor: scheme.bgPage }}
      >
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaView>
      {__DEV__ ? <DevRoleSwitcher /> : null}
    </AnalyticsProvider>
  );
}

// The theme preference must wrap the whole tree so every `useChoreyTheme()` call
// (including RootLayout's own) resolves against the user's saved appearance.
function RootLayoutWithProviders() {
  return (
    <SafeAreaProvider>
      <ThemePreferenceProvider>
        <RootLayout />
      </ThemePreferenceProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayoutWithProviders);
