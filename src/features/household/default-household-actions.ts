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

