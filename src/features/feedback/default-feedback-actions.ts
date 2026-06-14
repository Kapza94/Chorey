import { Platform } from "react-native";
import Constants from "expo-constants";

import { createFeedbackActions, type FeedbackKind } from "@/features/feedback/feedback";
import { supabase } from "@/lib/supabase";

/**
 * Submit a feedback or contact message, tagging it with the current household
 * and device context so the inbox has enough to triage and reply. The route
 * file just passes the household id; platform + app version are filled here.
 */
export async function submitAppFeedback(
  kind: FeedbackKind,
  message: string,
  householdId: string,
): Promise<void> {
  await createFeedbackActions(supabase).submit(kind, message, {
    householdId,
    platform: Platform.OS,
    appVersion: Constants.expoConfig?.version ?? undefined,
  });
}
