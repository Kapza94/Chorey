import {
  createSubscriptionActions,
  type HouseholdSubscription,
  type SubscriptionPlan,
} from "@/features/entitlements/subscription-actions";
import { supabase } from "@/lib/supabase";

export async function getHouseholdSubscription(
  householdId: string,
): Promise<HouseholdSubscription> {
  return createSubscriptionActions(supabase).getSubscription(householdId);
}

export async function chooseSubscriptionPlan(
  householdId: string,
  plan: SubscriptionPlan,
): Promise<void> {
  return createSubscriptionActions(supabase).choosePlan(householdId, plan);
}
