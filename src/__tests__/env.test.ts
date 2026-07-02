import {
  getChoreyEnv,
  getChoreyEnvOrNull,
  getPostHogConfig,
  getSentryDsn,
} from "@/lib/env";

const KEYS = [
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "EXPO_PUBLIC_SENTRY_DSN",
  "EXPO_PUBLIC_POSTHOG_KEY",
  "EXPO_PUBLIC_POSTHOG_HOST",
] as const;

describe("env config", () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of KEYS) {
      if (saved[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = saved[key];
      }
    }
  });

  describe("getChoreyEnvOrNull", () => {
    it("returns null when Supabase config is missing", () => {
      expect(getChoreyEnvOrNull()).toBeNull();
    });

    it("returns null when only one of the two values is set", () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      expect(getChoreyEnvOrNull()).toBeNull();
    });

    it("returns the config when both values are set", () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "pk_test";
      expect(getChoreyEnvOrNull()).toEqual({
        supabaseUrl: "https://example.supabase.co",
        supabasePublishableKey: "pk_test",
      });
    });
  });

  describe("getChoreyEnv", () => {
    it("throws when config is missing", () => {
      expect(() => getChoreyEnv()).toThrow(/Missing Supabase config/);
    });

    it("returns the config when set", () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "pk_test";
      expect(getChoreyEnv().supabaseUrl).toBe("https://example.supabase.co");
    });
  });

  describe("getSentryDsn", () => {
    it("returns null when unset", () => {
      expect(getSentryDsn()).toBeNull();
    });

    it("returns null when empty", () => {
      process.env.EXPO_PUBLIC_SENTRY_DSN = "";
      expect(getSentryDsn()).toBeNull();
    });

    it("returns the DSN when set", () => {
      process.env.EXPO_PUBLIC_SENTRY_DSN =
        "https://key@org.ingest.sentry.io/123";
      expect(getSentryDsn()).toBe("https://key@org.ingest.sentry.io/123");
    });
  });

  describe("getPostHogConfig", () => {
    it("returns null when the API key is unset", () => {
      expect(getPostHogConfig()).toBeNull();
    });

    // EU is the safe default: all Chorey data lives in the EU, so a missing
    // env var must never silently route analytics to the US.
    it("defaults the host to PostHog EU cloud when only the key is set", () => {
      process.env.EXPO_PUBLIC_POSTHOG_KEY = "phc_test";
      expect(getPostHogConfig()).toEqual({
        apiKey: "phc_test",
        host: "https://eu.i.posthog.com",
      });
    });

    it("uses the configured host when set", () => {
      process.env.EXPO_PUBLIC_POSTHOG_KEY = "phc_test";
      process.env.EXPO_PUBLIC_POSTHOG_HOST = "https://us.i.posthog.com";
      expect(getPostHogConfig()).toEqual({
        apiKey: "phc_test",
        host: "https://us.i.posthog.com",
      });
    });
  });
});
