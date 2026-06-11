import {
  resolveHouseholdEntitlement,
  type SubscriptionStatus,
} from "@/features/entitlements/entitlements";
import { supabase } from "@/lib/supabase";

/** The household's subscription status (trialing / active / lapsed). */
export async function getHouseholdSubscriptionStatus(
  householdId: string,
): Promise<SubscriptionStatus> {
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
