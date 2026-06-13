export type ChoreyEnv = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

export function getChoreyEnv(): ChoreyEnv {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing Supabase config. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return {
    supabaseUrl,
    supabasePublishableKey,
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

