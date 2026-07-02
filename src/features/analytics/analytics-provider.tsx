import { useEffect, type ReactNode } from "react";
import { PostHogProvider, usePostHog } from "posthog-react-native";
import { usePathname } from "expo-router";

import { getPostHogConfig } from "@/lib/env";

const config = getPostHogConfig();

/**
 * Wraps the app in PostHog analytics when configured, otherwise renders children
 * untouched. Analytics stays a no-op until `EXPO_PUBLIC_POSTHOG_KEY` is set
 * (mirrors the Sentry / billing approach).
 *
 * Screen autocapture is disabled because Expo Router uses React Navigation v7,
 * where the provider can't auto-track screens reliably — wire manual screen
 * views via `usePathname` later (see LAUNCH_TODO). Touch autocapture is on.
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  if (!config) {
    return <>{children}</>;
  }

  return (
    <PostHogProvider
      apiKey={config.apiKey}
      // defaultOptIn:false — analytics starts OFF and only turns on for parent
      // screens (see RouteGate). Children are NEVER tracked, not even on the
      // first frame before the gate runs.
      options={{ host: config.host, defaultOptIn: false }}
      autocapture={{ captureTouches: true, captureScreens: false }}
    >
      <RouteGate />
      {children}
    </PostHogProvider>
  );
}

/**
 * Turns capture ON only on parent screens and OFF everywhere in child mode
 * (any /child/* route). Children are data subjects under COPPA/GDPR-K/UK AADC —
 * product analytics must never capture their sessions, even anonymously.
 * Because the provider starts opted out (defaultOptIn:false), the child side is
 * safe by default; this only ever *enables* capture, and never on /child.
 */
function RouteGate() {
  const posthog = usePostHog();
  const pathname = usePathname();
  const childMode = pathname?.startsWith("/child") ?? false;

  useEffect(() => {
    if (childMode) {
      void posthog.optOut();
    } else {
      void posthog.optIn();
    }
  }, [childMode, posthog]);

  return null;
}
