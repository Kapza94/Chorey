import type { ReactNode } from "react";
import { PostHogProvider } from "posthog-react-native";

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
      {children}
    </PostHogProvider>
  );
}
