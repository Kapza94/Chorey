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
      options={{ host: config.host }}
      autocapture={{ captureTouches: true, captureScreens: false }}
    >
      <ChildModeGate />
      {children}
    </PostHogProvider>
  );
}

/**
 * Opts PostHog out while the app is in child mode (any /child/* route) and back
 * in when a parent screen is active. Children are data subjects under
 * COPPA/GDPR-K/UK AADC — product analytics must not capture their sessions,
 * even anonymously. The provider stays mounted (unmounting it would remount the
 * whole navigator); only capture is toggled.
 */
function ChildModeGate() {
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
