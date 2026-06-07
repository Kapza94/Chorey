import { useEffect } from "react";
import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";

import { useChoreyFonts } from "@/theme/use-chorey-fonts";
import { DevRoleSwitcher } from "@/features/dev/dev-role-switcher";

// Keep the splash visible until the Chorey type families are ready, so the
// first frame already renders in Bricolage / Plus Jakarta Sans (no font swap).
SplashScreen.preventAutoHideAsync().catch(() => {
  // no-op: hiding later is still safe if this rejects
});

export default function RootLayout() {
  const fontsReady = useChoreyFonts();

  useEffect(() => {
    if (fontsReady) {
      SplashScreen.hideAsync().catch(() => {
        // no-op
      });
    }
  }, [fontsReady]);

  if (!fontsReady) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
      {__DEV__ ? <DevRoleSwitcher /> : null}
    </>
  );
}
