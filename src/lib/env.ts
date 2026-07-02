export type ChoreyEnv = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

/**
 * Reads the Supabase config, or returns null when it isn't set. Use this on the
 * startup path so a misconfigured build shows a readable screen instead of
 * throwing at import time and hard-crashing on launch (see `isSupabaseConfigured`).
 */
export function getChoreyEnvOrNull(): ChoreyEnv | null {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  return {
    supabaseUrl,
    supabasePublishableKey,
  };
}

export function getChoreyEnv(): ChoreyEnv {
  const env = getChoreyEnvOrNull();

  if (!env) {
    throw new Error(
      "Missing Supabase config. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return env;
}

/**
 * Sentry DSN, or null when error reporting isn't configured. The app runs
 * without it — Sentry simply stays disabled until the DSN is set (mirrors the
 * RevenueCat / push-notifications no-op approach).
 */
export function getSentryDsn(): string | null {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  return dsn && dsn.length > 0 ? dsn : null;
}

export type PostHogConfig = {
  apiKey: string;
  host: string;
};

/**
 * PostHog analytics config, or null when it isn't set. Analytics stays disabled
 * until `EXPO_PUBLIC_POSTHOG_KEY` is provided (no-op like Sentry/billing). Host
 * defaults to PostHog EU cloud — all Chorey data lives in the EU (Supabase
 * eu-central-2), so a missing env var must never silently route analytics to
 * the US (GDPR transfer posture).
 */
export function getPostHogConfig(): PostHogConfig | null {
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;

  if (!apiKey) {
    return null;
  }

  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST;

  return {
    apiKey,
    host: host && host.length > 0 ? host : "https://eu.i.posthog.com",
  };
}

export type RevenueCatConfig = {
  iosKey: string;
  androidKey: string;
};

/**
 * RevenueCat public SDK keys, or null when billing isn't configured yet. The
 * app runs without it — the subscription screen simply shows no purchasable
 * plans until these are set (mirrors the push-notifications no-op approach).
 */
export function getRevenueCatConfig(): RevenueCatConfig | null {
  const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
  const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

  if (!iosKey || !androidKey) {
    return null;
  }

  return { iosKey, androidKey };
}

