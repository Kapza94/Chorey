import {
  createHouseholdActions,
  createHouseholdReadActions,
  type HouseholdSettings,
} from "@/features/household/household-actions";
import { createSignedInHouseholdAction } from "@/features/household/signed-in-household-action";
import { supabase } from "@/lib/supabase";

export const createHouseholdForSignedInParent = createSignedInHouseholdAction(
  supabase,
  (parentUserId) => createHouseholdActions(supabase, parentUserId),
);

export async function getHouseholdSettings(
  householdId: string,
): Promise<HouseholdSettings> {
  return createHouseholdReadActions(supabase).getHouseholdSettings(householdId);
}

/** The signed-in parent's primary household id, or null if they have none yet. */
export async function getPrimaryHouseholdId(): Promise<string | null> {
  const ids = await createHouseholdReadActions(supabase).listHouseholdIds();
  return ids[0] ?? null;
}

