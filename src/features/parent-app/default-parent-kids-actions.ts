import type { ParentKid } from "@/features/parent-app/parent-primitives";
import { createParentKidsActions } from "@/features/parent-app/parent-kids-actions";
import { supabase } from "@/lib/supabase";

export async function listHouseholdKids(
  householdId: string,
): Promise<ParentKid[]> {
  return createParentKidsActions(supabase).listHouseholdKids(householdId);
}
