import { useColorScheme } from "react-native";

import {
  choreyTheme,
  schemes,
  type ChoreyScheme,
  type ColorScheme,
} from "@/theme/chorey-theme";

export type ChoreyThemeContext = typeof choreyTheme & {
  /** active color mode */
  mode: ColorScheme;
  /** the resolved semantic surface/text/tint/shadow tokens for `mode` */
  scheme: ChoreyScheme;
  isDark: boolean;
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

  return {
    ...choreyTheme,
    mode,
    scheme: schemes[mode],
    isDark: mode === "dark",
  };
}
