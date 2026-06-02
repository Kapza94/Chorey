import { useColorScheme } from "react-native";

import {
  buckets,
  choreyTheme,
  schemes,
  type ChoreyBucket,
  type ChoreyScheme,
  type ColorScheme,
} from "@/theme/chorey-theme";

export type ChoreyThemeContext = typeof choreyTheme & {
  /** active color mode */
  mode: ColorScheme;
  /** the resolved semantic surface/text/tint/shadow tokens for `mode` */
  scheme: ChoreyScheme;
  isDark: boolean;
  /**
   * Readable foreground for a bucket's color used as TEXT (on a cream card or
   * the bucket's soft tint). Deep shade in light mode; a light pastel in dark
   * so it stays legible on the warm-dark surfaces. Use the solid -400 / -200
   * swatches directly for backgrounds — those stay constant across modes.
   */
  bucketInk: (bucket: ChoreyBucket) => string;
};

/**
 * The single hook every screen uses to read the theme. It returns the full
 * static token set (`palette`, `typography`, `space`, …) plus the `scheme`
 * resolved for the device's current light/dark mode.
 *
 * Pull surfaces/text/borders from `scheme` (they flip with dark mode); pull the
 * brand trio and type presets from the static tokens (they don't).
 *
 * @param override force a specific mode (e.g. a user setting that beats the OS).
 */
export function useChoreyTheme(override?: ColorScheme): ChoreyThemeContext {
  const system = useColorScheme();
  const mode: ColorScheme = override ?? (system === "dark" ? "dark" : "light");

  const isDark = mode === "dark";

  return {
    ...choreyTheme,
    mode,
    scheme: schemes[mode],
    isDark,
    bucketInk: (bucket: ChoreyBucket) => {
      const ramp = buckets[bucket].ramp;
      return isDark ? ramp[200] : ramp[800];
    },
  };
}
