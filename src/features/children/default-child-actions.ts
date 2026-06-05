import { createChildActions, type CreatedChild } from "@/features/children/child-actions";
import type { SettlementFrequency } from "@/features/household/household-actions";
import { supabase } from "@/lib/supabase";

export async function createChildForHousehold(input: {
  householdId: string;
  displayName: string;
}): Promise<CreatedChild> {
  return createChildActions(supabase, input.householdId).createChild({
    displayName: input.displayName,
  });
}

export async function updateChildSettingsForHousehold(input: {
  householdId: string;
  childProfileId: string;
  budgetCents?: number;
  cadence?: SettlementFrequency;
}): Promise<void> {
  return createChildActions(supabase, input.householdId).updateChildSettings({
    childProfileId: input.childProfileId,
    budgetCents: input.budgetCents,
    cadence: input.cadence,
  });
}
