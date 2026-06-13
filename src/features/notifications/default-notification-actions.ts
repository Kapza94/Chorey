import { Platform } from "react-native";

import { supabase } from "@/lib/supabase";
import { createChildNotificationActions } from "@/features/notifications/notification-actions";
import { getExpoPushToken } from "@/features/notifications/push-registration";

/**
 * Best-effort: grab this device's Expo push token and register it against the
 * child's access code. Silently no-ops when no token is available (simulator,
 * denied permission, or EAS not yet configured) so it never blocks the kid.
 */
export async function registerChildForPushNotifications(
  accessCode: string,
): Promise<void> {
  try {
    const token = await getExpoPushToken();
    if (!token) {
      return;
    }

    await createChildNotificationActions(supabase).registerToken({
      accessCode,
      token,
      platform: Platform.OS,
    });
  } catch {
    // Registration is non-critical; the kid's app works without it.
  }
}
