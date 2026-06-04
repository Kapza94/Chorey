import {
  createOnboardingPersistence,
  type ParentOnboardingResult,
  type PersistedOnboarding,
} from "@/features/onboarding/onboarding-persistence";
import { supabase } from "@/lib/supabase";

/**
 * Persist a finished parent onboarding for the currently signed-in parent.
 * Throws if no parent session exists (RLS would reject the writes anyway).
 */
export async function persistOnboardingForSignedInParent(
  result: ParentOnboardingResult,
): Promise<PersistedOnboarding> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("A signed-in parent is required.");
  }

  return createOnboardingPersistence(supabase, data.user.id).persist(result);
}
