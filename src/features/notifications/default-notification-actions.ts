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

/**
 * Best-effort: register this parent's device for pushes ("<kid> finished a
 * chore" approval nudges). Silently no-ops on simulator/denied permission so
 * it never blocks the parent app. Chore-event pushes themselves fire from DB
 * triggers (chore_push_notifications migration), never from clients.
 */
export async function registerParentForPushNotifications(): Promise<void> {
  try {
    const token = await getExpoPushToken();
    if (!token) {
      return;
    }

    await supabase.rpc("register_parent_push_token", {
      input_token: token,
      input_platform: Platform.OS,
    });
  } catch {
    // Registration is non-critical; the parent app works without it.
  }
}
