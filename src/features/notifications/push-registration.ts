import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Show late-chore nudges even when the kid has the app open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Acquire this device's Expo push token, requesting permission first. Returns
 * null (never throws) whenever a token can't be obtained — simulator, denied
 * permission, or EAS not yet configured — so callers can fire-and-forget.
 *
 * NOTE: a real token requires an EAS `projectId`. Until `eas init` adds
 * `extra.eas.projectId` to app.json this returns null and registration is a
 * no-op; the app still runs normally.
 */
export async function getExpoPushToken(): Promise<string | null> {
  // Push tokens are only meaningful on a physical device.
  if (!Device.isDevice) {
    return null;
  }

  // Android needs a channel before the permission prompt can appear.
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Chore reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let granted = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    granted = status;
  }
  if (granted !== "granted") {
    return null;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  if (!projectId) {
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    // Offline or Expo push service hiccup — try again on the next app open.
    return null;
  }
}
