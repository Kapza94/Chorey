import {
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from "@expo-google-fonts/bricolage-grotesque";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from "@expo-google-fonts/jetbrains-mono";
import { useFonts } from "expo-font";

/**
 * Loads the Chorey type families and registers them under the short family
 * names used by `choreyTheme.typography.family` (e.g. "Bricolage_700Bold").
 * The keys here ARE the `fontFamily` strings the theme references, so the two
 * must stay in sync.
 *
 * Returns `true` once fonts are ready (or have errored — we never block the app
 * on a font failure; React Native falls back to the system face).
 */
export function useChoreyFonts(): boolean {
  const [loaded, error] = useFonts({
    Bricolage_400Regular: BricolageGrotesque_400Regular,
    Bricolage_500Medium: BricolageGrotesque_500Medium,
    Bricolage_600SemiBold: BricolageGrotesque_600SemiBold,
    Bricolage_700Bold: BricolageGrotesque_700Bold,
    Bricolage_800ExtraBold: BricolageGrotesque_800ExtraBold,

    Jakarta_400Regular: PlusJakartaSans_400Regular,
    Jakarta_500Medium: PlusJakartaSans_500Medium,
    Jakarta_600SemiBold: PlusJakartaSans_600SemiBold,
    Jakarta_700Bold: PlusJakartaSans_700Bold,
    Jakarta_800ExtraBold: PlusJakartaSans_800ExtraBold,

    JetBrainsMono_400Regular: JetBrainsMono_400Regular,
    JetBrainsMono_500Medium: JetBrainsMono_500Medium,
  });

  return loaded || error != null;
}
