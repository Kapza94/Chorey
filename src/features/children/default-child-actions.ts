import { createChildActions, type CreatedChild } from "@/features/children/child-actions";
import { supabase } from "@/lib/supabase";

export async function createChildForHousehold(input: {
  householdId: string;
  displayName: string;
}): Promise<CreatedChild> {
  return createChildActions(supabase, input.householdId).createChild({
    displayName: input.displayName,
  });
}
