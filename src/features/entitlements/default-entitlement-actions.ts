import {
  resolveHouseholdEntitlement,
  type HouseholdAccess,
} from "@/features/entitlements/entitlements";
import { supabase } from "@/lib/supabase";

/** The household's access tier (free / paid / lapsed) for the signed-in parent. */
export async function getHouseholdAccess(
  householdId: string,
): Promise<HouseholdAccess> {
  const result = await supabase
    .from("household_entitlements")
    .select("status")
    .eq("household_id", householdId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return resolveHouseholdEntitlement(result.data);
}
